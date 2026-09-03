#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol};

#[contracttype]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct SLARecord {
    pub anchor_domain: Symbol,
    pub last_updated: u64,
    pub healthy_checks: u32,
    pub total_checks: u32,
    pub avg_latency_ms: u32,
    pub sla_score: u32,
}

#[contracttype]
pub enum DataKey {
    Admin,
    AnchorSLA(Symbol),
}

#[contract]
pub struct SLARegistryContract;

#[contractimpl]
impl SLARegistryContract {
    /// Initialize the SLA Registry with an admin address.
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    /// Record a health attestation for a given Stellar anchor domain.
    pub fn record_attestation(
        env: Env,
        admin: Address,
        anchor_domain: Symbol,
        is_healthy: bool,
        latency_ms: u32,
    ) -> u32 {
        admin.require_auth();

        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Contract not initialized");
        if admin != stored_admin {
            panic!("Unauthorized admin address");
        }

        let key = DataKey::AnchorSLA(anchor_domain.clone());
        let mut record = env.storage().persistent().get(&key).unwrap_or(SLARecord {
            anchor_domain: anchor_domain.clone(),
            last_updated: 0,
            healthy_checks: 0,
            total_checks: 0,
            avg_latency_ms: 0,
            sla_score: 100,
        });

        record.total_checks += 1;
        if is_healthy {
            record.healthy_checks += 1;
        }

        record.last_updated = env.ledger().timestamp();
        
        // Calculate moving average latency
        if record.total_checks == 1 {
            record.avg_latency_ms = latency_ms;
        } else {
            record.avg_latency_ms = (record.avg_latency_ms + latency_ms) / 2;
        }

        // Compute integer percentage SLA score (0-100)
        record.sla_score = (record.healthy_checks * 100) / record.total_checks;

        // Save updated SLA record in persistent storage
        env.storage().persistent().set(&key, &record);

        // Emit telemetry event
        env.events().publish(
            (symbol_short!("attest"), anchor_domain),
            (is_healthy, record.sla_score, record.avg_latency_ms),
        );

        record.sla_score
    }

    /// Query the current SLA record for an anchor domain.
    pub fn get_sla(env: Env, anchor_domain: Symbol) -> Option<SLARecord> {
        let key = DataKey::AnchorSLA(anchor_domain);
        env.storage().persistent().get(&key)
    }
}

#[cfg(test)]
mod test;
