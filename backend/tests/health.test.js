import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

let server;
let baseUrl;

before(async () => {
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

describe('TRACE Backend Health Endpoints (Phase 2)', () => {
  test('GET /health returns 200 with operational/degraded summary', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.data.status === 'OPERATIONAL' || json.data.status === 'DEGRADED');
    assert.equal(json.data.service, 'trace-api');
    assert.ok(json.data.services.backend);
    assert.ok(json.data.services.database);
    assert.ok(json.data.services.mlService);
    assert.ok(json.meta.timestamp);
    assert.ok(res.headers.get('x-request-id'));
  });

  test('GET /api/v1/health returns 200 with matching envelope', async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.services.backend.status, 'UP');
  });

  test('GET /api/v1/health/database reflects actual database status', async () => {
    const res = await fetch(`${baseUrl}/api/v1/health/database`);
    const json = await res.json();
    if (res.status === 200) {
      assert.equal(json.success, true);
      assert.equal(json.data.connected, true);
      assert.equal(json.data.status, 'UP');
    } else {
      assert.equal(res.status, 503);
      assert.equal(json.success, false);
      assert.equal(json.error.code, 'DATABASE_UNAVAILABLE');
    }
  });

  test('GET /non-existent-route returns 404 with error envelope', async () => {
    const res = await fetch(`${baseUrl}/non-existent-route`);
    assert.equal(res.status, 404);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'RESOURCE_NOT_FOUND');
    assert.ok(json.error.message.includes('not found'));
  });
});
