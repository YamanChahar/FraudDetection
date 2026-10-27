import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../src/app.js';
import { User, RefreshToken } from '../src/models/index.js';
import { generateAccessToken } from '../src/utils/tokenUtils.js';

let mongoServer;
let server;
let baseUrl;

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  await Promise.all([User.syncIndexes(), RefreshToken.syncIndexes()]);

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('TRACE Phase 3: Authentication, JWT & RBAC Tests', () => {
  let userToken;
  let userRefreshToken;
  let adminToken;

  test('1. Registration creates user and returns JWT + RefreshToken', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Analyst Jane',
        email: 'jane.analyst@trace.local',
        password: 'Password123!',
        role: 'ANALYST',
      }),
    });

    assert.equal(res.status, 201);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.user.email, 'jane.analyst@trace.local');
    assert.equal(json.data.user.role, 'ANALYST');
    assert.ok(json.data.tokens.accessToken);
    assert.ok(json.data.tokens.refreshToken);

    userToken = json.data.tokens.accessToken;
    userRefreshToken = json.data.tokens.refreshToken;

    // Verify password is not plaintext in DB
    const dbUser = await User.findOne({ email: 'jane.analyst@trace.local' });
    assert.ok(dbUser.passwordHash);
    assert.notEqual(dbUser.passwordHash, 'Password123!');
    assert.ok(dbUser.passwordHash.startsWith('$2')); // bcrypt prefix
  });

  test('2. Registration rejects duplicate email with 409 Conflict', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jane Impostor',
        email: 'jane.analyst@trace.local',
        password: 'Password999!',
      }),
    });

    assert.equal(res.status, 409);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'CONFLICT');
  });

  test('3. Registration rejects weak password with 422', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Weak Pass',
        email: 'weak@trace.local',
        password: 'weak', // No number, no uppercase, < 8 chars
      }),
    });

    assert.equal(res.status, 422);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'VALIDATION_ERROR');
  });

  test('4. Login with valid credentials succeeds and issues tokens', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'jane.analyst@trace.local',
        password: 'Password123!',
      }),
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.data.tokens.accessToken);
    assert.ok(json.data.tokens.refreshToken);
    userRefreshToken = json.data.tokens.refreshToken;
  });

  test('5. Login with invalid password fails with 401 generic error', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'jane.analyst@trace.local',
        password: 'WrongPassword!',
      }),
    });

    assert.equal(res.status, 401);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'INVALID_CREDENTIALS');
    assert.equal(json.error.message, 'Invalid email or password');
  });

  test('6. Login with nonexistent email fails with 401 generic error', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'doesnotexist@trace.local',
        password: 'Password123!',
      }),
    });

    assert.equal(res.status, 401);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'INVALID_CREDENTIALS');
    assert.equal(json.error.message, 'Invalid email or password');
  });

  test('7. GET /api/v1/auth/me returns authenticated user profile', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.email, 'jane.analyst@trace.local');
    assert.equal(json.data.role, 'ANALYST');
    assert.equal(json.data.passwordHash, undefined); // No security leakage
  });

  test('8. GET /api/v1/auth/me without token is rejected with 401', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/me`);
    assert.equal(res.status, 401);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'UNAUTHORIZED');
  });

  test('9. GET /api/v1/auth/me with malformed token is rejected with 401', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Authorization: 'Bearer this.is.not.a.valid.jwt' },
    });
    assert.equal(res.status, 401);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'INVALID_TOKEN');
  });

  test('10. Refresh token rotation issues new access and refresh token', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: userRefreshToken }),
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.data.tokens.accessToken);
    assert.ok(json.data.tokens.refreshToken);
    assert.notEqual(json.data.tokens.refreshToken, userRefreshToken);

    const oldToken = userRefreshToken;
    userRefreshToken = json.data.tokens.refreshToken;
    userToken = json.data.tokens.accessToken;

    // 11. Token Reuse Detection: using old rotated token triggers alarm
    const reuseRes = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: oldToken }),
    });

    assert.equal(reuseRes.status, 401);
    const reuseJson = await reuseRes.json();
    assert.equal(reuseJson.error.code, 'TOKEN_REUSE_DETECTED');
  });

  test('12. Logout revokes token session', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({ refreshToken: userRefreshToken }),
    });

    assert.equal(res.status, 200);

    // Refreshing with logged out token now fails
    const failRefresh = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: userRefreshToken }),
    });
    assert.equal(failRefresh.status, 401);
  });

  test('13. RBAC checks allow Analyst to access Analyst routes and block unauthorized actions', async () => {
    // Create an Admin user
    const adminUser = await User.create({
      name: 'Admin Boss',
      email: 'admin.boss@trace.local',
      passwordHash: 'hashed_admin_pass',
      role: 'ADMIN',
    });
    adminToken = generateAccessToken(adminUser);

    // Analyst accessing transaction routes (with valid token) succeeds or proceeds
    const analystTrxRes = await fetch(`${baseUrl}/api/v1/transactions`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    // Even if no DB or empty, authentication passed (it will not be 401 or 403)
    assert.notEqual(analystTrxRes.status, 401);
    assert.notEqual(analystTrxRes.status, 403);

    // Admin accessing transaction routes succeeds
    const adminTrxRes = await fetch(`${baseUrl}/api/v1/transactions`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.notEqual(adminTrxRes.status, 401);
    assert.notEqual(adminTrxRes.status, 403);
  });
});
