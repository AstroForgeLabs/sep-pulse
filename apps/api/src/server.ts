import express, { Request, Response } from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { runAnchorComplianceCheck, AnchorComplianceResult } from '@sep-pulse/runner';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Cron schedule (env-configurable, default: every 15 minutes) ─────────────
const CRON_SCHEDULE = process.env.MONITOR_CRON_SCHEDULE ?? '*/15 * * * *';

// ─── Monitored anchors (env-configurable) ────────────────────────────────────
const DEFAULT_ANCHORS = (process.env.MONITORED_ANCHORS ?? 'testanchor.stellar.org,ultrastellar.com,clabe.salamex.app')
  .split(',')
  .map((d) => d.trim())
  .filter(Boolean);

// ─── In-memory state ─────────────────────────────────────────────────────────
const anchorCache = new Map<string, AnchorComplianceResult>();
const webhooks: string[] = [];

app.use(cors());
app.use(express.json());

// ─── Webhook dispatcher ───────────────────────────────────────────────────────
async function dispatchWebhooks(result: AnchorComplianceResult): Promise<void> {
  if (webhooks.length === 0 || result.overallStatus === 'HEALTHY') return;

  const payload = JSON.stringify({
    event: 'ANCHOR_SLA_ALERT',
    domain: result.domain,
    status: result.overallStatus,
    slaScore: result.slaScore,
    timestamp: result.timestamp,
  });

  await Promise.allSettled(
    webhooks.map((webhookUrl) =>
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      })
    )
  );
}

// ─── Core check function (used by both cron and API) ─────────────────────────
async function checkAnchor(domain: string, seps: number[] = [1, 10, 24, 31, 38]): Promise<AnchorComplianceResult> {
  const result = await runAnchorComplianceCheck({ domain, seps });
  anchorCache.set(domain, result);

  // Fire-and-forget webhook dispatch
  dispatchWebhooks(result).catch((err) =>
    console.error(`[webhook] dispatch error for ${domain}:`, err.message)
  );

  return result;
}

// ─── Scheduled cron: check all monitored anchors every 15 minutes ─────────────
function startCronScheduler(): void {
  if (!cron.validate(CRON_SCHEDULE)) {
    console.error(`[cron] Invalid schedule expression: "${CRON_SCHEDULE}" — using default "*/15 * * * *"`);
    return;
  }

  console.log(`[cron] Starting anchor monitoring scheduler: "${CRON_SCHEDULE}"`);

  cron.schedule(CRON_SCHEDULE, async () => {
    console.log(`[cron] ${new Date().toISOString()} — Running scheduled anchor checks for ${DEFAULT_ANCHORS.length} domains`);
    for (const domain of DEFAULT_ANCHORS) {
      try {
        const result = await checkAnchor(domain);
        console.log(`[cron] ${domain} → ${result.overallStatus} (SLA: ${result.slaScore}%)`);
      } catch (err: any) {
        console.error(`[cron] ${domain} → CHECK FAILED: ${err.message}`);
      }
    }
  });
}

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'sep-pulse-api',
    monitoredAnchors: DEFAULT_ANCHORS.length,
    cronSchedule: CRON_SCHEDULE,
  });
});

/**
 * GET /api/v1/anchors
 * Returns the latest SLA compliance results for all monitored anchors.
 * Results are served from cache; a fresh check is triggered if no cached data exists.
 */
app.get('/api/v1/anchors', async (_req: Request, res: Response) => {
  const results: AnchorComplianceResult[] = [];

  for (const domain of DEFAULT_ANCHORS) {
    if (!anchorCache.has(domain)) {
      try {
        await checkAnchor(domain);
      } catch (err: any) {
        console.error(`[api] Initial check failed for ${domain}: ${err.message}`);
      }
    }
    const cached = anchorCache.get(domain);
    if (cached) results.push(cached);
  }

  res.json({ anchors: results, total: results.length });
});

/**
 * POST /api/v1/run
 * Triggers an immediate SEP compliance check for a specific anchor domain.
 */
app.post('/api/v1/run', async (req: Request, res: Response) => {
  const { domain, seps } = req.body;

  if (!domain || typeof domain !== 'string') {
    return res.status(400).json({ error: 'Missing required field: domain' });
  }

  try {
    const result = await checkAnchor(
      domain,
      Array.isArray(seps) ? seps : [1, 10, 24, 31, 38]
    );
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Validation failed' });
  }
});

/**
 * GET /api/v1/anchors/:domain
 * Returns the latest cached SLA result for a specific anchor domain.
 */
app.get('/api/v1/anchors/:domain', async (req: Request, res: Response) => {
  const { domain } = req.params;

  if (!anchorCache.has(domain)) {
    try {
      await checkAnchor(domain);
    } catch (err: any) {
      return res.status(502).json({ error: `Check failed for ${domain}: ${err.message}` });
    }
  }

  const result = anchorCache.get(domain);
  if (!result) return res.status(404).json({ error: 'Domain not found' });
  return res.json(result);
});

/**
 * POST /api/v1/webhooks
 * Registers a webhook URL to receive SLA degradation alerts.
 */
app.post('/api/v1/webhooks', (req: Request, res: Response) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing valid webhook URL' });
  }
  if (webhooks.includes(url)) {
    return res.status(409).json({ error: 'Webhook URL already registered' });
  }
  webhooks.push(url);
  return res.json({ message: 'Webhook registered successfully', totalWebhooks: webhooks.length });
});

/**
 * DELETE /api/v1/webhooks
 * Removes a webhook URL from the notification list.
 */
app.delete('/api/v1/webhooks', (req: Request, res: Response) => {
  const { url } = req.body;
  const idx = webhooks.indexOf(url);
  if (idx === -1) return res.status(404).json({ error: 'Webhook not found' });
  webhooks.splice(idx, 1);
  return res.json({ message: 'Webhook removed', totalWebhooks: webhooks.length });
});

/**
 * GET /api/v1/webhooks
 * Lists all registered webhook URLs.
 */
app.get('/api/v1/webhooks', (_req: Request, res: Response) => {
  res.json({ webhooks, total: webhooks.length });
});

// ─── Boot ──────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`SEP-Pulse API Monitoring server running on port ${PORT}`);
  startCronScheduler();
});
