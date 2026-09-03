# Contributing to SEP-Pulse

Thank you for your interest in contributing to **SEP-Pulse**! This project is part of the Stellar Wave ecosystem initiative aimed at advancing continuous anchor compliance, monitoring, and SLA attestations.

---

## Code of Conduct

We expect all contributors to adhere to a respectful, welcoming, and collaborative environment for everyone.

---

## How to Get Started

### 1. Prerequisites
- **Node.js**: v20 or higher
- **Rust & Cargo**: Latest stable toolchain (with `wasm32-unknown-unknown` target for Soroban smart contracts)
- **Stellar CLI**: Installed via `cargo install --locked stellar-cli`

### 2. Setting Up the Local Workspace
```bash
# Clone the repository
git clone https://github.com/SmartCraftGroup/sep-pulse.git
cd sep-pulse

# Install dependencies
npm install

# Build the packages
npm run build
```

---

## Development & Git Workflow Discipline

Following the **Stellar Wave Master Playbook**, we enforce strict git discipline:

1. **Specific Staging Only:** Never run `git add .` or batch stage indiscriminately. Stage specific modified files after review.
2. **Atomic Commits:** One logical change per commit (e.g., `feat(runner): add SEP-38 quote validation wrapper`).
3. **Conventional Commits:** All commit messages must follow standard format:
   - `feat(scope): ...`
   - `fix(scope): ...`
   - `docs(scope): ...`
   - `test(scope): ...`
   - `refactor(scope): ...`

---

## Submitting Pull Requests

1. Fork the repository and create your feature branch: `git checkout -b feat/your-feature-name`.
2. Run test suites locally before submitting:
   ```bash
   # Run JS/TS package tests
   npm test

   # Run Soroban contract tests
   cargo test --manifest-path contracts/sla_registry/Cargo.toml
   ```
3. Open a Pull Request referencing the GitHub issue you are addressing. Ensure CI passes cleanly.

---

## License

By contributing to SEP-Pulse, you agree that your contributions will be licensed under the MIT License.
