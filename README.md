# SEP-Pulse — Continuous Anchor Observability & Soroban SLA Registry

[![CI](https://github.com/AstroForgeLabs/sep-pulse/actions/workflows/ci.yml/badge.svg)](https://github.com/AstroForgeLabs/sep-pulse/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![Soroban](https://img.shields.io/badge/Soroban-Smart%20Contracts-purple.svg)](https://soroban.stellar.org/)
[![Drips Wave](https://img.shields.io/badge/Drips-Stellar%20Wave-blue.svg)](https://drips.network)

**SEP-Pulse** is an automated compliance testing, continuous uptime monitoring, and SLA attestation platform for Stellar Ecosystem Proposals (SEPs). Powered by the official `@stellar/anchor-tests` engine and integrated with a Soroban SLA Registry smart contract, SEP-Pulse provides anchor operators, wallet developers, and ecosystem participants with real-time health visibility, webhook alerts, and on-chain SLA verification.

---

## Key Features

- **Continuous SEP Validation:** Scheduled 15-minute cron monitoring against any Stellar Anchor domain using the official `@stellar/anchor-tests` engine.
- **Comprehensive SEP Coverage:** Validates SEP-1 (`stellar.toml`), SEP-10 (Web Auth), SEP-24 (Hosted Deposit/Withdrawal), SEP-31 (Cross-Border Payments), and SEP-38 (Anchor RFQ).
- **On-Chain SLA Attestations:** Publishes cryptographic health and uptime records directly to the Soroban `sla_registry` smart contract on Testnet.
- **Alerting & Webhooks:** Instant HTTP POST webhook dispatch when an anchor's endpoint fails or SLA score drops below threshold.
- **Ecosystem Health Dashboard:** Next.js web dashboard with live status matrix and real-time API polling.

---

## Supported SEPs

| SEP Standard | Name | Scope & Assertion Checklist |
|---|---|---|
| **SEP-0001** | Stellar TOML | Validates TOML formatting, HTTPS headers, CORS config, and signing key resolution |
| **SEP-0010** | Stellar Web Auth | Challenge transaction generation, time-bounds validation, and signature verification |
| **SEP-0024** | Hosted Deposit & Withdrawal | Asserts interactive flow endpoints (`/info`, `/deposit`, `/withdraw`, `/transaction`) |
| **SEP-0031** | Cross-Border Payments | Schema compliance for direct remittance endpoints |
| **SEP-0038** | Anchor RFQ API | Asserts quote generation, asset pair verification, and price queries |

---

## Quickstart

### Prerequisites
- **Node.js** v20+
- **Rust & Cargo** stable (with `wasm32-unknown-unknown` target)
- **Stellar CLI** — `cargo install --locked stellar-cli`

### 1. Clone & Install

```bash
git clone https://github.com/AstroForgeLabs/sep-pulse.git
cd sep-pulse
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env to set your MONITORED_ANCHORS and optionally SOROBAN_CONTRACT_ID
```

### 3. Build All Packages

```bash
npm run build
```

### 4. Start the Monitoring API

```bash
cd apps/api && npm start
# API server starts on http://localhost:3001
# Cron scheduler fires every 15 minutes automatically
```

### 5. Start the Web Dashboard

```bash
cd apps/web && npm run dev
# Dashboard available at http://localhost:3000
```

### 6. Run an Instant Compliance Check

```bash
# Trigger a live check via the API
curl -X POST http://localhost:3001/api/v1/run \
  -H "Content-Type: application/json" \
  -d '{"domain": "testanchor.stellar.org", "seps": [1, 10, 24]}'
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service health check |
| `GET` | `/api/v1/anchors` | Get SLA results for all monitored anchors |
| `GET` | `/api/v1/anchors/:domain` | Get SLA result for a specific anchor domain |
| `POST` | `/api/v1/run` | Trigger an immediate compliance check for a domain |
| `POST` | `/api/v1/webhooks` | Register a webhook URL for SLA alerts |
| `GET` | `/api/v1/webhooks` | List all registered webhooks |
| `DELETE` | `/api/v1/webhooks` | Remove a webhook URL |

---

## Architecture Topology

```
                        +-------------------------------+
                        |     sep-pulse Web Dashboard   |
                        | (Live Status & Latency Matrix)|
                        +---------------+---------------+
                                        |
                                        v
                        +---------------+---------------+
                        |   sep-pulse API + Cron (15m)  |
                        +---------------+---------------+
                                        |
      +---------------------------------+---------------------------------+
      |                                 |                                 |
      v                                 v                                 v
+-----------------------+     +-------------------+     +-------------------+
| @stellar/anchor-tests |     | Webhook Notifier  |     | Soroban Contract  |
| (Validation Engine)   |     | (HTTP POST Alerts)|     |  (SLA Registry)   |
+-----------------------+     +-------------------+     +-------------------+
```

---

## Repository Structure

```
sep-pulse/
├── apps/
│   ├── api/            # Express/Node monitoring engine, cron scheduler & webhook service
│   └── web/            # Next.js status dashboard with live API polling
├── contracts/
│   └── sla_registry/   # Soroban Rust smart contract for on-chain SLA attestations
├── packages/
│   └── runner/         # Core TypeScript SDK wrapping @stellar/anchor-tests
├── .env.example        # Environment variable reference
├── pulse.config.json   # Example monitoring configuration
├── CONTRIBUTING.md     # Development & contribution guide
├── SECURITY.md         # Vulnerability disclosure policy
└── README.md           # Master repository documentation
```

---

## Contract — Soroban SLA Registry

The `sla_registry` Soroban smart contract stores on-chain SLA attestation records for each monitored anchor. Each attestation records:

- `total_checks` / `healthy_checks` — cumulative check counts
- `sla_score` — percentage (0–100) of healthy checks
- `avg_latency_ms` — rolling average latency
- `last_updated` — ledger timestamp of last attestation

TTL extension is applied on every write to ensure records never expire from ledger storage.

### Build & Test

```bash
# Run contract unit tests
npm run contract:test

# Build WASM release artifact
npm run contract:build
```

---

## Maintainers & Contact

| Maintainer | Role | Contact | Telegram |
|---|---|---|---|
| **Abdulmalik Ojo** (`@tecmalik`) | Lead Maintainer | [abdulmalikojo2@gmail.com](mailto:abdulmalikojo2@gmail.com) | [@tecmalik](https://t.me/tecmalik) |
| **Hikmah Oladele** (`@Hikmaholadele`) | Maintainer | [hikmaholadele@gmail.com](mailto:hikmaholadele@gmail.com) | — |

---

## Contributing

We welcome community contributions! Please read [`CONTRIBUTING.md`](./CONTRIBUTING.md) before submitting a pull request.

[![Contributors](https://contrib.rocks/image?repo=AstroForgeLabs/sep-pulse)](https://github.com/AstroForgeLabs/sep-pulse/graphs/contributors)

---

## License

MIT — see [`LICENSE`](./LICENSE).
