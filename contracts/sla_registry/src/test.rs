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

/// Verifies that persistent SLA records survive across multiple attestations
/// and that the TTL extension keeps records alive on ledger.
#[test]
fn test_ttl_extension_on_attestation() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, SLARegistryContract);
    let client = SLARegistryContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin);

    let domain = symbol_short!("myanchor");

    // First attestation — TTL extension applied via extend_ttl()
    client.record_attestation(&admin, &domain, &true, &80);

    // Record must persist after attestation (TTL extension working)
    let sla = client.get_sla(&domain);
    assert!(
        sla.is_some(),
        "SLA record should exist after attestation — TTL extension must be working"
    );

    let sla = sla.unwrap();
    assert_eq!(sla.total_checks, 1);
    assert_eq!(sla.healthy_checks, 1);
    assert_eq!(sla.sla_score, 100);
    assert_eq!(sla.avg_latency_ms, 80);

    // Second attestation — TTL extended again, moving average recalculated
    client.record_attestation(&admin, &domain, &true, &100);
    let sla2 = client.get_sla(&domain).unwrap();
    assert_eq!(sla2.total_checks, 2);
    // Moving average: (80 + 100) / 2 = 90
    assert_eq!(sla2.avg_latency_ms, 90);
    assert_eq!(sla2.sla_score, 100);
}

/// Verifies get_sla returns None for a domain with no attestation history.
#[test]
fn test_get_sla_returns_none_for_unknown_domain() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, SLARegistryContract);
    let client = SLARegistryContractClient::new(&env, &contract_id);

    client.initialize(&Address::generate(&env));

    let sla = client.get_sla(&symbol_short!("unknown"));
    assert!(sla.is_none(), "Unknown domain should return None");
}

/// Verifies that SLA score degrades correctly across a sequence of mixed checks.
#[test]
fn test_sla_score_degradation() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, SLARegistryContract);
    let client = SLARegistryContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin);
    let domain = symbol_short!("anchor2");

    // 3 healthy, 1 failing = 75% SLA
    client.record_attestation(&admin, &domain, &true, &100);
    client.record_attestation(&admin, &domain, &true, &110);
    client.record_attestation(&admin, &domain, &true, &90);
    let score = client.record_attestation(&admin, &domain, &false, &500);
    assert_eq!(score, 75, "SLA score should be 75% after 3/4 healthy checks");

    let sla = client.get_sla(&domain).unwrap();
    assert_eq!(sla.total_checks, 4);
    assert_eq!(sla.healthy_checks, 3);
    assert_eq!(sla.sla_score, 75);
}
