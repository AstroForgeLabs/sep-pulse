import React, { useCallback, useEffect, useState } from 'react';
import Head from 'next/head';

interface AnchorStatus {
  domain: string;
  timestamp: string;
  overallStatus: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  slaScore: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  averageLatencyMs: number;
  sepsTested: number[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function Dashboard() {
  const [anchors, setAnchors] = useState<AnchorStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchAnchors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/anchors`);
      if (!res.ok) throw new Error(`API responded with HTTP ${res.status}`);
      const data = await res.json();
      setAnchors(data.anchors ?? []);
      setLastRefreshed(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to reach SEP-Pulse API');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount, then refresh every 60 seconds
  useEffect(() => {
    fetchAnchors();
    const interval = setInterval(fetchAnchors, 60_000);
    return () => clearInterval(interval);
  }, [fetchAnchors]);

  const healthyCount = anchors.filter((a) => a.overallStatus === 'HEALTHY').length;
  const avgSla =
    anchors.length > 0
      ? Math.round(anchors.reduce((acc, c) => acc + c.slaScore, 0) / anchors.length)
      : 0;
  const avgLatency =
    anchors.length > 0
      ? Math.round(anchors.reduce((acc, c) => acc + c.averageLatencyMs, 0) / anchors.length)
      : 0;

  const systemStatus =
    anchors.length === 0
      ? 'UNKNOWN'
      : anchors.every((a) => a.overallStatus === 'HEALTHY')
      ? 'HEALTHY'
      : anchors.some((a) => a.overallStatus === 'DOWN')
      ? 'DOWN'
      : 'DEGRADED';

  return (
    <>
      <Head>
        <title>SEP-Pulse — Stellar Anchor Observability &amp; SLA Dashboard</title>
        <meta
          name="description"
          content="Continuous compliance testing, uptime monitoring, and SLA attestations for Stellar SEPs."
        />
      </Head>

      <div className="container">
        <header className="header">
          <div className="brand">
            <div className="brand-logo">SP</div>
            <div className="brand-title">
              <h1>SEP-Pulse Observability</h1>
              <p>Continuous Stellar Anchor Compliance &amp; Soroban SLA Registry</p>
            </div>
          </div>
          <div
            className={`badge ${
              systemStatus === 'HEALTHY'
                ? 'badge-healthy'
                : systemStatus === 'DEGRADED'
                ? 'badge-degraded'
                : systemStatus === 'DOWN'
                ? 'badge-down'
                : 'badge-degraded'
            }`}
          >
            <span className="pulse-dot"></span>
            {systemStatus === 'HEALTHY'
              ? 'System Operational'
              : systemStatus === 'DEGRADED'
              ? 'Partial Degradation'
              : systemStatus === 'DOWN'
              ? 'System Down'
              : 'Connecting…'}
          </div>
        </header>

        <section className="stats-grid">
          <div className="card">
            <div className="card-title">Monitored Anchors</div>
            <div className="card-value">{loading ? '—' : anchors.length}</div>
          </div>
          <div className="card">
            <div className="card-title">System Average SLA</div>
            <div className="card-value" style={{ color: '#00f2fe' }}>
              {loading ? '—' : `${avgSla}%`}
            </div>
          </div>
          <div className="card">
            <div className="card-title">Healthy Endpoints</div>
            <div className="card-value" style={{ color: '#10b981' }}>
              {loading ? '—' : `${healthyCount} / ${anchors.length}`}
            </div>
          </div>
          <div className="card">
            <div className="card-title">Avg Latency (ms)</div>
            <div className="card-value">{loading ? '—' : `${avgLatency}ms`}</div>
          </div>
        </section>

        <section className="table-card">
          <div className="table-header">
            <h2>Live Anchor Health Matrix</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {lastRefreshed && (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  Last updated: {lastRefreshed.toLocaleTimeString()}
                </span>
              )}
              <button
                id="refresh-btn"
                onClick={fetchAnchors}
                disabled={loading}
                style={{
                  background: 'rgba(0,242,254,0.1)',
                  border: '1px solid rgba(0,242,254,0.3)',
                  color: '#00f2fe',
                  padding: '0.4rem 1rem',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                {loading ? 'Checking…' : '↻ Refresh'}
              </button>
            </div>
          </div>

          {error && (
            <div
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.4)',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1rem',
                color: '#f87171',
                fontSize: '0.9rem',
              }}
            >
              ⚠ API Error: {error} — make sure the sep-pulse API server is running on port 3001.
            </div>
          )}

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
                    Running live SEP compliance checks…
                  </td>
                </tr>
              ) : anchors.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No anchor data available. Check the API connection.
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
                    <td>{anchor.averageLatencyMs > 0 ? `${anchor.averageLatencyMs} ms` : 'N/A'}</td>
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
