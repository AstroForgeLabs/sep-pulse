import assert from 'node:assert';
import { test } from 'node:test';
import { runAnchorComplianceCheck } from './index';

test('runAnchorComplianceCheck returns structured compliance report', async () => {
  const result = await runAnchorComplianceCheck({
    domain: 'testanchor.stellar.org',
    seps: [1, 10, 24],
    timeoutMs: 5000,
  });

  assert.strictEqual(result.domain, 'testanchor.stellar.org');
  assert.ok(Array.isArray(result.assertions));
  assert.ok(result.totalTests > 0);
  assert.ok(typeof result.slaScore === 'number');
});
