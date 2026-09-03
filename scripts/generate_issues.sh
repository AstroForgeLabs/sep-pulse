#!/usr/bin/env bash
# ==============================================================================
# SEP-Pulse Issue Generation Script (Stellar Wave Program Standard)
# Automated script to populate GitHub backlog with structured scoped issues.
# ==============================================================================

set -euo pipefail

REPO="SmartCraftGroup/sep-pulse"

echo "Generating Wave Program backlog issues for ${REPO}..."

# Issue 1: Contract - Soroban SLA Storage TTL Extension
gh issue create --repo "$REPO" \
  --title "feat(contract): implement TTL extension for persistent SLA records" \
  --label "enhancement,contract,soroban" \
  --body "### Summary
Add automatic storage TTL extension calls to \`record_attestation\` in \`contracts/sla_registry\` to ensure persistent anchor SLA records do not expire on ledger.

### Acceptance Criteria
- [ ] Call \`env.storage().persistent().extend_ttl()\` whenever \`record_attestation\` is invoked.
- [ ] Add unit test verifying TTL extension on existing SLA records.
- [ ] Contract compiles cleanly without warnings.

### Tech Stack
- Rust, Soroban SDK v20.0.0"

# Issue 2: Runner - Direct @stellar/anchor-tests CLI execution bridge
gh issue create --repo "$REPO" \
  --title "feat(runner): integrate raw @stellar/anchor-tests CLI assertion runner" \
  --label "enhancement,runner,typescript" \
  --body "### Summary
Bridge \`packages/runner\` directly with \`@stellar/anchor-tests\` execution engine to allow running full SEP-10 auth challenge validation against live testnet domain endpoints.

### Acceptance Criteria
- [ ] Export \`runAnchorTests(domain: string, seps: number[])\` from \`packages/runner\`.
- [ ] Parse JSON output into \`AnchorComplianceResult\` format.
- [ ] Add node unit test covering testnet execution.

### Tech Stack
- TypeScript, Node.js v20, @stellar/anchor-tests"

# Issue 3: API - Scheduled Cron Health Monitor & Webhook Dispatcher
gh issue create --repo "$REPO" \
  --title "feat(api): implement 15-minute cron scheduler and webhook notification dispatcher" \
  --label "enhancement,api,backend" \
  --body "### Summary
Build a background cron process in \`apps/api\` that automatically checks registered anchor domains every 15 minutes and dispatches HTTP POST webhooks on SLA degradation.

### Acceptance Criteria
- [ ] Scheduled cron loop querying all configured anchors.
- [ ] Webhook payload contains domain, SLA score, timestamp, and degraded status.
- [ ] Handle network timeouts gracefully with exponential backoff.

### Tech Stack
- Node.js, Express, TypeScript"

# Issue 4: Web - Interactive Anchor Search & Historical SLA Latency Graph
gh issue create --repo "$REPO" \
  --title "feat(web): add interactive anchor search and historical SLA latency chart" \
  --label "enhancement,frontend,react" \
  --body "### Summary
Enhance \`apps/web\` status page with a real-time domain search input and SVG latency trend chart for monitored anchors.

### Acceptance Criteria
- [ ] Domain search filter updating the health matrix table dynamically.
- [ ] Response latency visualization chart per anchor.
- [ ] Responsive dark glassmorphism UI layout.

### Tech Stack
- Next.js, React, CSS Modules"

echo "Issue generation script complete."
