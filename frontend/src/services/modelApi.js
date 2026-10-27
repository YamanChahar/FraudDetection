import api from './api';

export async function fetchModels(params = {}) {
  const response = await api.get('/models', { params });
  return response.data;
}

export async function fetchModelById(id) {
  const response = await api.get(`/models/${id}`);
  return response.data;
}
