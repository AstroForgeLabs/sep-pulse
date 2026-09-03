import express, { Request, Response } from 'express';
import cors from 'cors';
import { runAnchorComplianceCheck, AnchorComplianceResult } from '@sep-pulse/runner';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// In-memory cache of anchor SLA results
const anchorCache = new Map<string, AnchorComplianceResult>();
const webhooks: string[] = [];

// Seed default monitored anchors
const DEFAULT_ANCHORS = ['testanchor.stellar.org', 'ultrastellar.com', 'clabe.salamex.app'];

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), service: 'sep-pulse-api' });
});

app.get('/api/v1/anchors', async (_req: Request, res: Response) => {
  const results: AnchorComplianceResult[] = [];

  for (const domain of DEFAULT_ANCHORS) {
    if (!anchorCache.has(domain)) {
      const result = await runAnchorComplianceCheck({ domain, seps: [1, 10, 24, 31, 38] });
      anchorCache.set(domain, result);
    }
    results.push(anchorCache.get(domain)!);
  }

  res.json({ anchors: results, total: results.length });
});

app.post('/api/v1/run', async (req: Request, res: Response) => {
  const { domain, seps } = req.body;

  if (!domain || typeof domain !== 'string') {
    return res.status(400).json({ error: 'Missing required field: domain' });
  }

  try {
    const result = await runAnchorComplianceCheck({
      domain,
      seps: Array.isArray(seps) ? seps : [1, 10, 24, 31, 38],
    });

    anchorCache.set(domain, result);

    // Dispatch webhook notifications if overall status is degraded or down
    if (result.overallStatus !== 'HEALTHY') {
      for (const webhookUrl of webhooks) {
        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'ANCHOR_SLA_ALERT',
            domain: result.domain,
            status: result.overallStatus,
            slaScore: result.slaScore,
            timestamp: result.timestamp,
          }),
        }).catch(() => {});
      }
    }

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Validation failed' });
  }
});

app.post('/api/v1/webhooks', (req: Request, res: Response) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing valid webhook URL' });
  }

  webhooks.push(url);
  return res.json({ message: 'Webhook registered successfully', totalWebhooks: webhooks.length });
});

app.listen(PORT, () => {
  console.log(`SEP-Pulse API Monitoring server running on port ${PORT}`);
});
