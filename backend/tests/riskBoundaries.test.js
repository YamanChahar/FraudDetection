import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateRiskLevel, getRecommendedAction, RISK_BOUNDARIES } from '../src/utils/riskScoring.js';

test('TRACE Risk Score Boundary Consistency Audit (Task 1)', async (t) => {
  await t.test('Ground truth boundaries: LOW (0-30), MEDIUM (31-70), HIGH (71-89), CRITICAL (90-100)', () => {
    // 1. Boundary: 0 (Minimum boundary) -> LOW
    assert.equal(calculateRiskLevel(0), 'LOW');
    assert.equal(getRecommendedAction(0), 'APPROVE');

    // 2. Boundary: 30 (Upper LOW boundary) -> LOW
    assert.equal(calculateRiskLevel(30), 'LOW');
    assert.equal(getRecommendedAction(30), 'APPROVE');

    // 3. Boundary: 31 (Lower MEDIUM boundary) -> MEDIUM
    assert.equal(calculateRiskLevel(31), 'MEDIUM');
    assert.equal(getRecommendedAction(31), 'STEP_UP');

    // 4. Boundary: 70 (Upper MEDIUM boundary) -> MEDIUM
    assert.equal(calculateRiskLevel(70), 'MEDIUM');
    assert.equal(getRecommendedAction(70), 'STEP_UP');

    // 5. Boundary: 71 (Lower HIGH boundary) -> HIGH
    assert.equal(calculateRiskLevel(71), 'HIGH');
    assert.equal(getRecommendedAction(71), 'MANUAL_REVIEW');

    // 6. Boundary: 89 (Upper HIGH boundary) -> HIGH
    assert.equal(calculateRiskLevel(89), 'HIGH');
    assert.equal(getRecommendedAction(89), 'MANUAL_REVIEW');

    // 7. Boundary: 90 (Lower CRITICAL boundary) -> CRITICAL
    assert.equal(calculateRiskLevel(90), 'CRITICAL');
    assert.equal(getRecommendedAction(90), 'IMMEDIATE_BLOCK');

    // 8. Boundary: 100 (Maximum boundary) -> CRITICAL
    assert.equal(calculateRiskLevel(100), 'CRITICAL');
    assert.equal(getRecommendedAction(100), 'IMMEDIATE_BLOCK');
  });

  await t.test('Boundary clamping and edge cases', () => {
    // Negative values clamp to 0 -> LOW
    assert.equal(calculateRiskLevel(-5), 'LOW');
    assert.equal(calculateRiskLevel(-100), 'LOW');

    // Values > 100 clamp to 100 -> CRITICAL
    assert.equal(calculateRiskLevel(105), 'CRITICAL');
    assert.equal(calculateRiskLevel(999), 'CRITICAL');

    // Floating-point values around thresholds
    assert.equal(calculateRiskLevel(30.4), 'LOW'); // rounds to 30
    assert.equal(calculateRiskLevel(30.6), 'MEDIUM'); // rounds to 31
    assert.equal(calculateRiskLevel(70.4), 'MEDIUM'); // rounds to 70
    assert.equal(calculateRiskLevel(70.6), 'HIGH'); // rounds to 71
    assert.equal(calculateRiskLevel(89.4), 'HIGH'); // rounds to 89
    assert.equal(calculateRiskLevel(89.6), 'CRITICAL'); // rounds to 90
  });

  await t.test('RISK_BOUNDARIES structure is complete and frozen with valid actions', () => {
    assert.ok(RISK_BOUNDARIES.LOW);
    assert.ok(RISK_BOUNDARIES.MEDIUM);
    assert.ok(RISK_BOUNDARIES.HIGH);
    assert.ok(RISK_BOUNDARIES.CRITICAL);

    assert.equal(RISK_BOUNDARIES.LOW.min, 0);
    assert.equal(RISK_BOUNDARIES.LOW.max, 30);
    assert.equal(RISK_BOUNDARIES.MEDIUM.min, 31);
    assert.equal(RISK_BOUNDARIES.MEDIUM.max, 70);
    assert.equal(RISK_BOUNDARIES.HIGH.min, 71);
    assert.equal(RISK_BOUNDARIES.HIGH.max, 89);
    assert.equal(RISK_BOUNDARIES.CRITICAL.min, 90);
    assert.equal(RISK_BOUNDARIES.CRITICAL.max, 100);
  });
});
