# SEP-Pulse — Continuous Anchor Observability & Soroban SLA Registry

[![CI](https://github.com/SmartCraftGroup/sep-pulse/actions/workflows/ci.yml/badge.svg)](https://github.com/SmartCraftGroup/sep-pulse/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![Soroban](https://img.shields.io/badge/Soroban-Smart%20Contracts-purple.svg)](https://soroban.stellar.org/)
[![Drips Wave](https://img.shields.io/badge/Drips-Stellar%20Wave-blue.svg)](https://drips.network)

**SEP-Pulse** is an automated compliance testing, continuous uptime monitoring, and SLA attestation platform for Stellar Ecosystem Proposals (SEPs). Powered by the official `@stellar/anchor-tests` engine and integrated with a Soroban SLA Registry smart contract, SEP-Pulse provides anchor operators, wallet developers, and ecosystem participants with real-time health visibility, webhook alerts, and on-chain SLA verification.

---

## Key Features

- **Continuous SEP Validation:** Scheduled monitoring and instant CLI test execution against any Stellar Anchor domain (`sep-pulse run --domain anchor.example.com`).
- **Comprehensive SEP Coverage:** Validates SEP-1 (`stellar.toml`), SEP-10 (Web Auth), SEP-24 (Hosted Deposit/Withdrawal), SEP-31 (Cross-Border Payments), and SEP-38 (Anchor RFQ).
- **On-Chain SLA Attestations:** Publishes cryptographic health and uptime records directly to the Soroban `sla_registry` smart contract.
- **Alerting & Webhooks:** Instant notification dispatch (Slack, Discord, Telegram, Webhook) when an anchor's endpoint fails or experiences high latency.
- **Ecosystem Health Dashboard:** Web dashboard providing status matrices, historical uptime graphs, and compliance badges for mainnet and testnet anchors.

---

## Supported SEPs

| SEP Standard | Name | Scope & Assertion Checklist |
|---|---|---|
| **SEP-0001** | Stellar TOML | Validates TOML formatting, HTTPS headers, CORS config, and signing key resolution |
| **SEP-0010** | Stellar Web Auth | Challenges transaction generation, time-bounds validation, and signature verification |
| **SEP-0024** | Hosted Deposit & Withdrawal | Asserts interactive flow endpoints (`/info`, `/deposit`, `/withdraw`, `/transaction`) |
| **SEP-0031** | Cross-Border Payments | Schema compliance for direct remittance endpoints |
| **SEP-0038** | Anchor RFQ API | Asserts quote generation, asset pair verification, and price queries |

---

## Quickstart & Usage

### 1. Install CLI & Engine
```bash
npm install -g @sep-pulse/cli
```

### 2. Run Instant Anchor Compliance Suite
```bash
sep-pulse run --domain testanchor.stellar.org --seps 1,10,24
```

### 3. Start Continuous SLA Monitoring Node
```bash
sep-pulse monitor --config ./pulse.config.json --interval 15m
```

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
                        |      sep-pulse API / Cron     |
                        +---------------+---------------+
                                        |
      +---------------------------------+---------------------------------+
      |                                 |                                 |
      v                                 v                                 v
+-----------------------+     +-------------------+     +-------------------+
| @stellar/anchor-tests |     | Webhook Notifier  |     | Soroban Contract  |
| (Validation Engine)   |     | (Discord / Slack) |     |  (SLA Registry)   |
+-----------------------+     +-------------------+     +-------------------+
```

---

## Repository Structure

```
sep-pulse/
├── apps/
│   ├── api/            # Express/Node monitoring engine & webhook service
│   └── web/            # Next.js status dashboard & SLA matrix
├── contracts/
│   └── sla_registry/   # Soroban Rust smart contract for on-chain SLA attestations
├── packages/
│   └── runner/         # Core TypeScript SDK wrapping @stellar/anchor-tests
├── scripts/
│   └── generate_issues.sh  # Automated GH CLI batch issue creation
├── CONTRIBUTING.md     # Development & contribution guide
├── SECURITY.md         # Vulnerability disclosure policy
└── README.md           # Master repository documentation
```

---

## Maintainers & Contact

| Maintainer | Role | Contact | Telegram |
|---|---|---|---|
| **Abdulmalik Ojo** (`@tecmalik`) | Lead Maintainer | [abdulmalikojo2@gmail.com](mailto:abdulmalikojo2@gmail.com) | [@tecmalik](https://t.me/tecmalik) |
| **Hikmah Oladele** (`@Hikmaholadele`) | Maintainer | [edit@gmail.com](mailto:edit@gmail.com) | — |

---

## Contributing

We welcome community contributions! Please read [`CONTRIBUTING.md`](./CONTRIBUTING.md) before submitting a pull request.

[![Contributors](https://contrib.rocks/image?repo=SmartCraftGroup/sep-pulse)](https://github.com/SmartCraftGroup/sep-pulse/graphs/contributors)

---

## License

MIT — see [`LICENSE`](./LICENSE).
