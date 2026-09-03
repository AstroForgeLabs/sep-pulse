import React, { useEffect, useState } from 'react';
import Head from 'next/head';

interface AnchorStatus {
  domain: string;
  timestamp: string;
  overallStatus: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  slaScore: number;
  totalTests: number;
  passedTests: number;
  averageLatencyMs: number;
  sepsTested: number[];
}

export default function Dashboard() {
  const [anchors, setAnchors] = useState<AnchorStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated initial telemetry state for demonstration & testing
    const defaultData: AnchorStatus[] = [
      {
        domain: 'testanchor.stellar.org',
        timestamp: new Date().toISOString(),
        overallStatus: 'HEALTHY',
        slaScore: 100,
        totalTests: 6,
        passedTests: 6,
        averageLatencyMs: 112,
        sepsTested: [1, 10, 24, 31, 38],
      },
      {
        domain: 'ultrastellar.com',
        timestamp: new Date().toISOString(),
        overallStatus: 'HEALTHY',
        slaScore: 98,
        totalTests: 6,
        passedTests: 6,
        averageLatencyMs: 145,
        sepsTested: [1, 10, 24],
      },
      {
        domain: 'clabe.salamex.app',
        timestamp: new Date().toISOString(),
        overallStatus: 'DEGRADED',
        slaScore: 83,
        totalTests: 6,
        passedTests: 5,
        averageLatencyMs: 340,
        sepsTested: [1, 10, 24, 31],
      },
    ];

    setAnchors(defaultData);
    setLoading(false);
  }, []);

  const healthyCount = anchors.filter((a) => a.overallStatus === 'HEALTHY').length;
  const avgSla = anchors.length > 0 ? Math.round(anchors.reduce((acc, c) => acc + c.slaScore, 0) / anchors.length) : 0;
  const avgLatency = anchors.length > 0 ? Math.round(anchors.reduce((acc, c) => acc + c.averageLatencyMs, 0) / anchors.length) : 0;

  return (
    <>
      <Head>
        <title>SEP-Pulse — Stellar Anchor Observability & SLA Dashboard</title>
        <meta name="description" content="Continuous compliance testing, uptime monitoring, and SLA attestations for Stellar SEPs." />
      </Head>

      <div className="container">
        <header className="header">
          <div className="brand">
            <div className="brand-logo">SP</div>
            <div className="brand-title">
              <h1>SEP-Pulse Observability</h1>
              <p>Continuous Stellar Anchor Compliance & Soroban SLA Registry</p>
            </div>
          </div>
          <div className="badge badge-healthy">
            <span className="pulse-dot"></span>
            System Operational
          </div>
        </header>

        <section className="stats-grid">
          <div className="card">
            <div className="card-title">Monitored Anchors</div>
            <div className="card-value">{anchors.length}</div>
          </div>
          <div className="card">
            <div className="card-title">System Average SLA</div>
            <div className="card-value" style={{ color: '#00f2fe' }}>{avgSla}%</div>
          </div>
          <div className="card">
            <div className="card-title">Healthy Endpoints</div>
            <div className="card-value" style={{ color: '#10b981' }}>{healthyCount} / {anchors.length}</div>
          </div>
          <div className="card">
            <div className="card-title">Avg Latency (ms)</div>
            <div className="card-value">{avgLatency}ms</div>
          </div>
        </section>

        <section className="table-card">
          <div className="table-header">
            <h2>Live Anchor Health Matrix</h2>
          </div>

          <table>
            <thead>
              <tr>
                <th>Anchor Domain</th>
                <th>Status</th>
                <th>SLA Score</th>
                <th>Avg Latency</th>
                <th>Validated SEPs</th>
                <th>Last Check</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>
                    Loading SLA telemetry...
                  </td>
                </tr>
              ) : (
                anchors.map((anchor) => (
                  <tr key={anchor.domain}>
                    <td>
                      <span className="domain-name">{anchor.domain}</span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          anchor.overallStatus === 'HEALTHY'
                            ? 'badge-healthy'
                            : anchor.overallStatus === 'DEGRADED'
                            ? 'badge-degraded'
                            : 'badge-down'
                        }`}
                      >
                        <span className="pulse-dot"></span>
                        {anchor.overallStatus}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{anchor.slaScore}%</td>
                    <td>{anchor.averageLatencyMs} ms</td>
                    <td>
                      {anchor.sepsTested.map((sep) => (
                        <span key={sep} className="sep-tag">
                          SEP-{sep}
                        </span>
                      ))}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {new Date(anchor.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
    </>
  );
}
