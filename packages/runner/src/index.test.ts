import assert from 'node:assert';
import { test } from 'node:test';
import { runAnchorComplianceCheck } from './index';

test('runAnchorComplianceCheck returns a structured compliance report with real test results', async () => {
  const result = await runAnchorComplianceCheck({
    domain: 'testanchor.stellar.org',
    seps: [1, 10, 24],
    timeoutMs: 30000,
  });

  // Shape assertions
  assert.strictEqual(result.domain, 'testanchor.stellar.org');
  assert.ok(Array.isArray(result.assertions), 'assertions should be an array');
  assert.ok(result.assertions.length > 0, 'should have at least one assertion');
  assert.ok(typeof result.slaScore === 'number', 'slaScore should be a number');
  assert.ok(result.slaScore >= 0 && result.slaScore <= 100, 'slaScore must be 0-100');
  assert.ok(['HEALTHY', 'DEGRADED', 'DOWN'].includes(result.overallStatus), 'invalid overallStatus');
  assert.ok(typeof result.totalTests === 'number', 'totalTests should be a number');
  assert.ok(typeof result.skippedTests === 'number', 'skippedTests should be a number');
  assert.strictEqual(
    result.passedTests + result.failedTests,
    result.totalTests,
    'passed + failed must equal totalTests'
  );

  // Each assertion must have required fields
  for (const a of result.assertions) {
    assert.ok(typeof a.sep === 'number', 'assertion.sep must be a number');
    assert.ok(typeof a.testName === 'string', 'assertion.testName must be a string');
    assert.ok(typeof a.passed === 'boolean', 'assertion.passed must be a boolean');
    assert.ok(typeof a.skipped === 'boolean', 'assertion.skipped must be a boolean');
  }
});
