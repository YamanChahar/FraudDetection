import api from './api';

export async function fetchAlerts(params = {}) {
  const response = await api.get('/alerts', { params });
  return response.data;
}

export async function fetchAlertById(id) {
  const response = await api.get(`/alerts/${id}`);
  return response.data;
}

export async function updateAlertStatus(id, status) {
  const response = await api.patch(`/alerts/${id}/status`, { status });
  return response.data;
}

export async function assignAlert(id, assignedToId) {
  const response = await api.post(`/alerts/${id}/assign`, { assignedToId });
  return response.data;
}

export async function recordInvestigationFinding(id, payload) {
  const response = await api.post(`/alerts/${id}/investigate`, payload);
  return response.data;
}
