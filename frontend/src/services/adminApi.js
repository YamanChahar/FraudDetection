import api from './api';

export async function fetchAdminUsers() {
  const response = await api.get('/admin/users');
  return response.data;
}

export async function updateUserRole(userId, role) {
  const response = await api.patch(`/admin/users/${userId}/role`, { role });
  return response.data;
}

export async function fetchAuditLogs(limit = 50) {
  const response = await api.get(`/admin/audit-logs?limit=${limit}`);
  return response.data;
}
