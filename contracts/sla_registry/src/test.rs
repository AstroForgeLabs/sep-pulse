#![cfg(test)]

use super::*;
use soroban_sdk::{symbol_short, testutils::Address as _, Address, Env};

#[test]
fn test_sla_registry_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, SLARegistryContract);
    let client = SLARegistryContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin);

    let domain = symbol_short!("testanch");
    
    // Record healthy attestation
    let score1 = client.record_attestation(&admin, &domain, &true, &120);
    assert_eq!(score1, 100);

    // Record degraded check
    let score2 = client.record_attestation(&admin, &domain, &false, &400);
    assert_eq!(score2, 50);

    // Fetch SLA record
    let sla = client.get_sla(&domain).unwrap();
    assert_eq!(sla.total_checks, 2);
    assert_eq!(sla.healthy_checks, 1);
    assert_eq!(sla.sla_score, 50);
}
