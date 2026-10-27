/**
 * TRACE Centralized Risk Engine Boundaries & Utility Functions
 *
 * Ground-truth boundaries:
 * - LOW:      0 – 30   (Auto-Approve)
 * - MEDIUM:  31 – 70   (Step-Up Authentication)
 * - HIGH:    71 – 89   (Analyst Review Hold)
 * - CRITICAL: 90 – 100 (Immediate Decline & Block)
 */

export const RISK_BOUNDARIES = {
  LOW: { min: 0, max: 30, action: 'APPROVE', label: 'Low Risk' },
  MEDIUM: { min: 31, max: 70, action: 'STEP_UP', label: 'Medium Risk' },
  HIGH: { min: 71, max: 89, action: 'MANUAL_REVIEW', label: 'High Risk' },
  CRITICAL: { min: 90, max: 100, action: 'IMMEDIATE_BLOCK', label: 'Critical Risk' },
};

/**
 * Maps a numeric risk score (0 - 100) to its discrete RiskLevel category.
 * Strictly adheres to 0-30, 31-70, 71-89, 90-100 boundaries.
 *
 * @param {number} score
 * @returns {'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'}
 */
export function calculateRiskLevel(score) {
  const numericScore = typeof score === 'number' ? score : Number(score);
  if (isNaN(numericScore)) {
    return 'LOW';
  }

  const clamped = Math.max(0, Math.min(100, Math.round(numericScore)));

  if (clamped <= 30) {
    return 'LOW';
  } else if (clamped <= 70) {
    return 'MEDIUM';
  } else if (clamped <= 89) {
    return 'HIGH';
  } else {
    return 'CRITICAL';
  }
}

/**
 * Returns the recommended operational action for a given risk score.
 * @param {number} score
 * @returns {string}
 */
export function getRecommendedAction(score) {
  const level = calculateRiskLevel(score);
  return RISK_BOUNDARIES[level].action;
}
