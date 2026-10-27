import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { generateAccessToken } from '../src/utils/tokenUtils.js';

let server;
let baseUrl;
let authToken;

before(async () => {
  authToken = generateAccessToken({
    id: '507f1f77bcf86cd799439011',
    email: 'validator@trace.local',
    role: 'ANALYST',
    name: 'Test Validator',
  });

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve) => {
    server.close(resolve);
  });
});

describe('TRACE Backend Validation & Endpoint Handlers', () => {
  test('POST /api/v1/transactions rejects missing externalTransactionId with 422', async () => {
    const res = await fetch(`${baseUrl}/api/v1/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        amount: 150.0,
        currency: 'USD',
      }),
    });
    assert.equal(res.status, 422);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'VALIDATION_ERROR');
    const fieldErrors = json.error.details.map((d) => d.field);
    assert.ok(fieldErrors.includes('externalTransactionId'));
  });

  test('POST /api/v1/transactions rejects negative amount with 422', async () => {
    const res = await fetch(`${baseUrl}/api/v1/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        externalTransactionId: 'TRX_TEST_NEG_01',
        amount: -45.5,
      }),
    });
    assert.equal(res.status, 422);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'VALIDATION_ERROR');
    const amountError = json.error.details.find((d) => d.field === 'amount');
    assert.ok(amountError);
    assert.ok(amountError.message.includes('positive number'));
  });

  test('POST /api/v1/transactions rejects invalid currency code with 422', async () => {
    const res = await fetch(`${baseUrl}/api/v1/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        externalTransactionId: 'TRX_TEST_CURR_01',
        amount: 99.0,
        currency: 'USDOLLAR_TOO_LONG',
      }),
    });
    assert.equal(res.status, 422);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'VALIDATION_ERROR');
  });

  test('GET /api/v1/transactions/:id rejects non-ObjectId parameter with 422', async () => {
    const res = await fetch(`${baseUrl}/api/v1/transactions/not-a-valid-objectid`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.equal(res.status, 422);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'VALIDATION_ERROR');
    assert.ok(json.error.details.some((d) => d.field === 'id'));
  });

  test('GET /api/v1/transactions rejects limit > 100 with 422', async () => {
    const res = await fetch(`${baseUrl}/api/v1/transactions?limit=250`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.equal(res.status, 422);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'VALIDATION_ERROR');
    assert.ok(json.error.details.some((d) => d.field === 'limit'));
  });

  test('GET /api/v1/models/:id rejects non-ObjectId parameter with 422', async () => {
    const res = await fetch(`${baseUrl}/api/v1/models/invalid-model-id`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.equal(res.status, 422);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'VALIDATION_ERROR');
  });
});
