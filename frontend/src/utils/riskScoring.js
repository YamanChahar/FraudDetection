/**
 * TRACE Centralized Risk Engine Boundaries & Utility Functions (Frontend)
 *
 * Ground-truth boundaries:
 * - LOW:      0 – 30   (Auto-Approve)
 * - MEDIUM:  31 – 70   (Step-Up Authentication)
 * - HIGH:    71 – 89   (Analyst Review Hold)
 * - CRITICAL: 90 – 100 (Immediate Decline & Block)
 */

export const RISK_BOUNDARIES = {
  LOW: {
    min: 0,
    max: 30,
    label: 'Low Risk',
    action: 'APPROVE',
    actionTitle: 'Approve Transaction',
    actionDesc: 'Risk profile is fully aligned with historical legitimate baseline patterns. No secondary authorization needed.',
    badgeClass: 'badge-low',
    color: 'var(--status-low-fg)',
  },
  MEDIUM: {
    min: 31,
    max: 70,
    label: 'Medium Risk',
    action: 'STEP_UP',
    actionTitle: 'Step-Up Authentication Required',
    actionDesc: 'Moderate risk indicators detected. Trigger 3D Secure / biometric verification before authorizing payment.',
    badgeClass: 'badge-med',
    color: 'var(--status-med-fg)',
  },
  HIGH: {
    min: 71,
    max: 89,
    label: 'High Risk',
    action: 'MANUAL_REVIEW',
    actionTitle: 'Route to Fraud Analyst',
    actionDesc: 'Elevated transaction anomaly detected. Payment placed on temporary hold pending analyst verification.',
    badgeClass: 'badge-high',
    color: 'var(--status-high-fg)',
  },
  CRITICAL: {
    min: 90,
    max: 100,
    label: 'Critical Risk',
    action: 'IMMEDIATE_BLOCK',
    actionTitle: 'Decline & Block Transaction',
    actionDesc: 'Critical fraud vectors identified. High likelihood of card skimming, account takeover, or synthetic identity.',
    badgeClass: 'badge-critical',
    color: '#74170E',
  },
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
 * Returns recommendation metadata for a given risk score.
 * @param {number} score
 */
export function getRecommendation(score) {
  const level = calculateRiskLevel(score);
  const cfg = RISK_BOUNDARIES[level];
  return {
    action: cfg.action,
    color: cfg.color,
    title: cfg.actionTitle,
    desc: cfg.actionDesc,
  };
}
