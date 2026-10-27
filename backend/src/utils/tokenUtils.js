import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';

const BCRYPT_SALT_ROUNDS = 12;

/**
 * Hashes a plaintext password securely using bcrypt.
 * @param {string} password
 * @returns {Promise<string>}
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Verifies a plaintext password against a bcrypt hash.
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Generates a short-lived signed JWT access token.
 * @param {object} user - User document or object with _id, email, role, name
 * @returns {string} Signed JWT
 */
export function generateAccessToken(user) {
  const payload = {
    sub: user.id || user._id.toString(),
    email: user.email,
    role: user.role,
    name: user.name,
  };

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    algorithm: 'HS256',
  });
}

/**
 * Verifies and decodes a JWT access token.
 * @param {string} token
 * @returns {object} Decoded payload
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] });
}

/**
 * Generates an opaque cryptographically random refresh token and its SHA-256 hash.
 * @returns {{ rawToken: string, tokenHash: string, expiresAt: Date }}
 */
export function generateRefreshToken() {
  const rawToken = crypto.randomBytes(40).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + env.JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

  return {
    rawToken,
    tokenHash,
    expiresAt,
  };
}

/**
 * Computes deterministic SHA-256 hash of a token string for database indexing.
 * @param {string} token
 * @returns {string} Hex hash
 */
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
