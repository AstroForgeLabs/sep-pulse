/**
 * SEP-Pulse Runner Package
 * Wrapper engine for executing real Stellar SEP compliance validations
 * using @stellar/anchor-tests and publishing SLA telemetry.
 */

import { run, Config, TestRun, SEP } from '@stellar/anchor-tests';

export interface TestAssertionResult {
  sep: number;
  testName: string;
  passed: boolean;
  skipped: boolean;
  durationMs: number;
  error?: string;
}

export interface AnchorComplianceResult {
  domain: string;
  timestamp: string;
  overallStatus: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  slaScore: number; // 0 to 100
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  averageLatencyMs: number;
  sepsTested: number[];
  assertions: TestAssertionResult[];
}

export interface RunnerOptions {
  domain: string;
  seps?: number[];
  timeoutMs?: number;
  verbose?: boolean;
}

/**
 * Executes real SEP compliance validation against an Anchor domain
 * using the official @stellar/anchor-tests library.
 */
export async function runAnchorComplianceCheck(
  options: RunnerOptions
): Promise<AnchorComplianceResult> {
  const { domain, seps = [1, 10, 24, 31, 38], verbose = false } = options;
  const assertions: TestAssertionResult[] = [];

  // Filter to only the SEPs supported by the anchor-tests library
  const supportedSEPs: SEP[] = [1, 6, 10, 12, 24, 31, 38];
  const sepsToTest = seps.filter((s): s is SEP =>
    supportedSEPs.includes(s as SEP)
  );

  const config: Config = {
    homeDomain: domain,
    seps: sepsToTest,
    verbose,
  };

  try {
    for await (const testRun of run(config)) {
      assertions.push(mapTestRun(testRun));
    }
  } catch (err: any) {
    // If the runner fails catastrophically (e.g. network unreachable),
    // record a single synthetic failure so the caller gets meaningful data.
    assertions.push({
      sep: 1,
      testName: 'Anchor Reachability',
      passed: false,
      skipped: false,
      durationMs: 0,
      error: err?.message || 'Failed to connect to anchor',
    });
  }

  return buildResult(domain, seps, assertions);
}

/**
 * Maps a raw TestRun from @stellar/anchor-tests to our internal assertion shape.
 */
function mapTestRun(testRun: TestRun): TestAssertionResult {
  const { test, result } = testRun;
  const skipped = result.skipped === true;
  const passed = !skipped && result.failure == null;

  const latencyMs =
    result.networkCalls.reduce((acc: number, call) => {
      // Each NetworkCall may expose timing via headers or we fall back to 0
      const timing = (call as any)?.durationMs ?? 0;
      return acc + timing;
    }, 0) || 0;

  return {
    sep: test.sep,
    testName: `${test.group} › ${test.assertion}`,
    passed,
    skipped,
    durationMs: latencyMs,
    error: result.failure
      ? result.failure.text(result.failure as any)
      : undefined,
  };
}

/**
 * Aggregates assertion results into the final AnchorComplianceResult.
 */
function buildResult(
  domain: string,
  requestedSeps: number[],
  assertions: TestAssertionResult[]
): AnchorComplianceResult {
  const nonSkipped = assertions.filter((a) => !a.skipped);
  const passedTests = nonSkipped.filter((a) => a.passed).length;
  const totalTests = nonSkipped.length;
  const failedTests = totalTests - passedTests;
  const skippedTests = assertions.filter((a) => a.skipped).length;

  const slaScore = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

  const latencies = nonSkipped.map((a) => a.durationMs).filter((d) => d > 0);
  const averageLatencyMs =
    latencies.length > 0
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : 0;

  let overallStatus: 'HEALTHY' | 'DEGRADED' | 'DOWN' = 'HEALTHY';
  if (slaScore < 50) {
    overallStatus = 'DOWN';
  } else if (slaScore < 90) {
    overallStatus = 'DEGRADED';
  }

  return {
    domain,
    timestamp: new Date().toISOString(),
    overallStatus,
    slaScore,
    totalTests,
    passedTests,
    failedTests,
    skippedTests,
    averageLatencyMs,
    sepsTested: requestedSeps,
    assertions,
  };
}
