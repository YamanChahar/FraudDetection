export const ROLES = {
  ANALYST: 'ANALYST',
  INVESTIGATOR: 'INVESTIGATOR',
  LEAD: 'LEAD',
  ADMIN: 'ADMIN',
};

export const PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard:view',
  TRANSACTIONS_VIEW: 'transactions:view',
  TRANSACTIONS_TEST: 'transactions:test',
  ALERTS_VIEW: 'alerts:view',
  ALERTS_ASSIGN: 'alerts:assign',
  ALERTS_INVESTIGATE: 'alerts:investigate',
  INVESTIGATIONS_CREATE: 'investigations:create',
  INVESTIGATIONS_REVIEW: 'investigations:review',
  TEAM_ANALYTICS_VIEW: 'analytics:team',
  WORKFLOWS_MANAGE: 'workflows:manage',
  USERS_MANAGE: 'users:manage',
  SETTINGS_MANAGE: 'settings:manage',
  AUDIT_VIEW: 'audit:view',
};

// Hierarchical / role permission mapping
export const ROLE_PERMISSIONS = {
  [ROLES.ANALYST]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.TRANSACTIONS_VIEW,
    PERMISSIONS.TRANSACTIONS_TEST,
    PERMISSIONS.ALERTS_VIEW,
  ],
  [ROLES.INVESTIGATOR]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.TRANSACTIONS_VIEW,
    PERMISSIONS.TRANSACTIONS_TEST,
    PERMISSIONS.ALERTS_VIEW,
    PERMISSIONS.ALERTS_ASSIGN,
    PERMISSIONS.ALERTS_INVESTIGATE,
    PERMISSIONS.INVESTIGATIONS_CREATE,
  ],
  [ROLES.LEAD]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.TRANSACTIONS_VIEW,
    PERMISSIONS.TRANSACTIONS_TEST,
    PERMISSIONS.ALERTS_VIEW,
    PERMISSIONS.ALERTS_ASSIGN,
    PERMISSIONS.ALERTS_INVESTIGATE,
    PERMISSIONS.INVESTIGATIONS_CREATE,
    PERMISSIONS.INVESTIGATIONS_REVIEW,
    PERMISSIONS.TEAM_ANALYTICS_VIEW,
    PERMISSIONS.WORKFLOWS_MANAGE,
  ],
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
};

/**
 * Checks if a user's role grants a specific permission.
 * @param {string} role - The user's role
 * @param {string} permission - The permission key to check
 * @returns {boolean}
 */
export function hasPermission(role, permission) {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}
