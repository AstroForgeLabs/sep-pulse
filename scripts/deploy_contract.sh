#!/usr/bin/env bash
# scripts/deploy_contract.sh
# Deploy the SEP-Pulse SLA Registry smart contract to Soroban Testnet
#
# Prerequisites:
#   cargo install --locked stellar-cli
#   stellar keys generate --global admin --network testnet
#   stellar keys fund admin --network testnet   # fund via Friendbot
#
# Usage:
#   ./scripts/deploy_contract.sh [admin_key_name]
#
# The CONTRACT_ID will be printed and can be set in your .env as SOROBAN_CONTRACT_ID

set -euo pipefail

NETWORK="testnet"
ADMIN_KEY="${1:-admin}"
WASM_PATH="contracts/sla_registry/target/wasm32-unknown-unknown/release/sla_registry.wasm"

echo "=============================="
echo " SEP-Pulse Contract Deployer  "
echo "=============================="
echo ""

# 1. Build the WASM artifact
echo "[1/4] Building WASM release artifact..."
cargo build \
  --manifest-path contracts/sla_registry/Cargo.toml \
  --target wasm32-unknown-unknown \
  --release

echo "[2/4] Optimising WASM with stellar optimize..."
stellar contract optimize \
  --wasm "${WASM_PATH}" 2>/dev/null || echo "  (stellar optimize not available — using unoptimized WASM)"

# 2. Deploy the contract
echo "[3/4] Deploying contract to Soroban ${NETWORK}..."
CONTRACT_ID=$(stellar contract deploy \
  --wasm "${WASM_PATH}" \
  --source "${ADMIN_KEY}" \
  --network "${NETWORK}")

echo ""
echo "[4/4] Initializing contract with admin key '${ADMIN_KEY}'..."
ADMIN_ADDRESS=$(stellar keys address "${ADMIN_KEY}")

stellar contract invoke \
  --id "${CONTRACT_ID}" \
  --source "${ADMIN_KEY}" \
  --network "${NETWORK}" \
  -- \
  initialize \
  --admin "${ADMIN_ADDRESS}"

echo ""
echo "=============================="
echo " ✅ Deployment Complete!"
echo "=============================="
echo ""
echo "  Contract ID : ${CONTRACT_ID}"
echo "  Admin       : ${ADMIN_ADDRESS}"
echo "  Network     : ${NETWORK}"
echo ""
echo "  Add to your .env:"
echo "  SOROBAN_CONTRACT_ID=${CONTRACT_ID}"
echo ""
