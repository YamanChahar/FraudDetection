import api from './api';

export async function fetchTransactions(params = {}) {
  const response = await api.get('/transactions', { params });
  return response.data;
}

export async function fetchTransactionById(id) {
  const response = await api.get(`/transactions/${id}`);
  return response.data;
}

export async function submitTransactionAnalysis(payload) {
  const response = await api.post('/transactions', payload);
  return response.data;
}
