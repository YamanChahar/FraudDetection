import mongoose from 'mongoose';
import { RefreshToken } from '../models/RefreshToken.model.js';

export class RefreshTokenRepository {
  /**
   * Persists a hashed refresh token
   */
  async create({ userId, tokenHash, expiresAt }) {
    const doc = await RefreshToken.create({
      userId: new mongoose.Types.ObjectId(userId),
      tokenHash,
      expiresAt,
    });
    return doc.toJSON();
  }

  /**
   * Finds a refresh token record by its hash
   */
  async findByTokenHash(tokenHash) {
    return RefreshToken.findOne({ tokenHash });
  }

  /**
   * Marks a specific token as revoked
   */
  async revokeToken(tokenHash) {
    return RefreshToken.updateOne({ tokenHash }, { $set: { revokedAt: new Date() } });
  }

  /**
   * Revokes all active refresh tokens for a user (e.g. on token reuse or logout everywhere)
   */
  async revokeAllForUser(userId) {
    const validUserId = new mongoose.Types.ObjectId(userId);
    return RefreshToken.updateMany(
      { userId: validUserId, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
  }
}

export const refreshTokenRepository = new RefreshTokenRepository();
