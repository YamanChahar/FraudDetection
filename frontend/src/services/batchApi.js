import api from './api';

export async function createBatchJob(payload) {
  const response = await api.post('/batch/jobs', payload);
  return response.data;
}

export async function fetchBatchJobs() {
  const response = await api.get('/batch/jobs');
  return response.data;
}

export async function fetchBatchJobById(id) {
  const response = await api.get(`/batch/jobs/${id}`);
  return response.data;
}
