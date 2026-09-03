# SEP-Pulse

[![CI](https://github.com/SmartCraftGroup/sep-pulse/actions/workflows/ci.yml/badge.svg)](https://github.com/SmartCraftGroup/sep-pulse/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![Drips Wave](https://img.shields.io/badge/Drips-Stellar%20Wave-blue.svg)](https://drips.network)

**SEP-Pulse** is an automated compliance testing suite and CLI runner for Stellar Ecosystem Proposals (SEPs). It provides anchor operators, wallet developers, and QA teams with automated validation for SEP-1 (`stellar.toml`), SEP-10 (Web Auth), SEP-24 (Hosted Deposit/Withdrawal), SEP-31 (Cross-Border Payments), and SEP-38 (Quotes).

---

## Why SEP-Pulse Exists

Stellar Anchors connect off-chain financial systems (bank accounts, cash pick-ups) to the Stellar blockchain using standardized REST APIs (SEPs). 

Testing an Anchor implementation currently requires manual Postman calls or fragmented scripts. `sep-pulse` packages these validations into a single CLI runner and web dashboard that automatically tests domain specs, verifies CORS headers, checks challenge transaction signatures, and generates structured compliance reports.

---

## Key Features

- **Automated SEP Validation:** One-command test execution against any Stellar Anchor domain (`sep-pulse run --domain example.com`).
- **SEP-1 `stellar.toml` Checker:** Verifies HTTPS availability, valid TOML formatting, required fields, and signing key resolution.
- **SEP-10 Challenge Auth Test:** Generates and validates challenge transactions against the Anchor auth endpoint.
- **SEP-24 & SEP-31 Flow Verification:** Asserts endpoint response schemas for deposit, withdrawal, fee info, and transaction status endpoints.
- **CI / CD Friendly:** Outputs standard JUnit XML and JSON compliance reports suitable for GitHub Actions integration.

---

## Supported SEPs

| SEP Standard | Name | Validation Scope |
|---|---|---|
| **SEP-0001** | Stellar TOML | TOML syntax, HTTPS headers, CORS, field completeness |
| **SEP-0010** | Stellar Web Auth | Challenge transaction generation, time bounds, signature validation |
| **SEP-0024** | Hosted Deposit & Withdrawal | Interactive flow endpoints (`/info`, `/deposit`, `/withdraw`) |
| **SEP-0031** | Cross-Border Payments | Direct remittance API schema compliance |
| **SEP-0038** | Anchor RFQ API | Quote generation and asset price query verification |

---

## Quickstart & Installation

### 1. Install CLI
```bash
npm install -g @sep-pulse/cli
```

### 2. Run Compliance Suite Against an Anchor Domain
```bash
sep-pulse run --domain anchor.example.com --seps 1,10,24
```

### 3. Generate HTML Compliance Report
```bash
sep-pulse run --domain anchor.example.com --output report.html
```

---

## Architecture Overview

```
                      +-------------------+
                      |   sep-pulse CLI   |
                      +---------+---------+
                                |
       +------------------------+------------------------+
       |                        |                        |
       v                        v                        v
+--------------+        +---------------+        +---------------+
| SEP-1 Runner |        | SEP-10 Runner |        | SEP-24 Runner |
| (toml spec)  |        | (Auth spec)   |        | (Deposit spec)|
+--------------+        +---------------+        +---------------+
       |                        |                        |
       +------------------------+------------------------+
                                |
                                v
                      +-------------------+
                      | Compliance Report |
                      |   (JSON / HTML)   |
                      +-------------------+
```

---

## Maintainers & Contact

| Maintainer | Role | Contact |
|---|---|---|
| **Abdulmalik Ojo** (`@tecmalik`) | Maintainer | [abdulmalikojo2@gmail.com](mailto:abdulmalikojo2@gmail.com) |
| **Hikmah Oladele ** (`@Hikmaholadele`) | Maintainer | [edit@gmail.com](mailto:edit.com) |
---

## License

MIT — see [`LICENSE`](./LICENSE).
