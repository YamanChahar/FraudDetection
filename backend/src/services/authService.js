import { userRepository } from '../repositories/userRepository.js';
import { refreshTokenRepository } from '../repositories/refreshTokenRepository.js';
import { auditService } from './auditService.js';
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} from '../utils/tokenUtils.js';
import { USER_ROLES } from '../models/User.model.js';

export class AuthService {
  /**
   * Registers a new user account
   */
  async register({ name, email, password, role = 'ANALYST' }, ipAddress = null, userAgent = null) {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await userRepository.findByEmail(normalizedEmail);
    if (existing) {
      const error = new Error('An account with this email address already exists');
      error.code = 'CONFLICT';
      error.status = 409;
      throw error;
    }

    const assignedRole = USER_ROLES.includes(role) ? role : 'ANALYST';
    const passwordHash = await hashPassword(password);

    const user = await userRepository.create({
      name,
      email: normalizedEmail,
      passwordHash,
      role: assignedRole,
      isActive: true,
    });

    const accessToken = generateAccessToken(user);
    const { rawToken: refreshToken, tokenHash, expiresAt } = generateRefreshToken();

    await refreshTokenRepository.create({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    await auditService.logAction({
      actorId: user.id,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: user.id,
      ipAddress,
      userAgent,
      metadata: { email: user.email, role: user.role },
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: '15m',
      },
    };
  }

  /**
   * Authenticates user credentials and issues new session tokens
   */
  async login({ email, password }, ipAddress = null, userAgent = null) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await userRepository.findByEmail(normalizedEmail);

    // Timing-safe check: use generic error message
    if (!user || !user.isActive) {
      const error = new Error('Invalid email or password');
      error.code = 'INVALID_CREDENTIALS';
      error.status = 401;
      throw error;
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      const error = new Error('Invalid email or password');
      error.code = 'INVALID_CREDENTIALS';
      error.status = 401;
      throw error;
    }

    await userRepository.updateLastLogin(user.id);

    const accessToken = generateAccessToken(user);
    const { rawToken: refreshToken, tokenHash, expiresAt } = generateRefreshToken();

    await refreshTokenRepository.create({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    await auditService.logAction({
      actorId: user.id,
      action: 'USER_LOGGED_IN',
      entityType: 'User',
      entityId: user.id,
      ipAddress,
      userAgent,
      metadata: { email: user.email },
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: '15m',
      },
    };
  }

  /**
   * Refreshes access token with rotation and reuse detection
   */
  async refresh({ refreshToken }, ipAddress = null, userAgent = null) {
    if (!refreshToken) {
      const error = new Error('Refresh token is required');
      error.code = 'TOKEN_REQUIRED';
      error.status = 400;
      throw error;
    }

    const tokenHash = hashToken(refreshToken);
    const tokenRecord = await refreshTokenRepository.findByTokenHash(tokenHash);

    if (!tokenRecord) {
      const error = new Error('Invalid or expired refresh token');
      error.code = 'INVALID_TOKEN';
      error.status = 401;
      throw error;
    }

    // Token reuse detection: if already revoked, compromise detected!
    if (tokenRecord.revokedAt) {
      await refreshTokenRepository.revokeAllForUser(tokenRecord.userId);
      await auditService.logAction({
        actorId: tokenRecord.userId.toString(),
        action: 'SECURITY_ALERT_TOKEN_REUSE',
        entityType: 'RefreshToken',
        entityId: tokenRecord._id.toString(),
        ipAddress,
        userAgent,
        metadata: { message: 'Attempted reuse of already revoked refresh token. All user sessions invalidated.' },
      });

      const error = new Error('Compromised token session detected. All active sessions have been terminated for security.');
      error.code = 'TOKEN_REUSE_DETECTED';
      error.status = 401;
      throw error;
    }

    // Check expiration
    if (new Date() > new Date(tokenRecord.expiresAt)) {
      const error = new Error('Refresh token has expired. Please log in again.');
      error.code = 'TOKEN_EXPIRED';
      error.status = 401;
      throw error;
    }

    // Revoke old token as part of rotation
    await refreshTokenRepository.revokeToken(tokenHash);

    const user = await userRepository.findById(tokenRecord.userId.toString());
    if (!user || !user.isActive) {
      const error = new Error('User account is inactive or no longer exists');
      error.code = 'USER_INACTIVE';
      error.status = 401;
      throw error;
    }

    // Issue rotated tokens
    const newAccessToken = generateAccessToken(user);
    const { rawToken: newRefreshToken, tokenHash: newTokenHash, expiresAt: newExpiresAt } = generateRefreshToken();

    await refreshTokenRepository.create({
      userId: user.id,
      tokenHash: newTokenHash,
      expiresAt: newExpiresAt,
    });

    await auditService.logAction({
      actorId: user.id,
      action: 'TOKEN_REFRESHED',
      entityType: 'User',
      entityId: user.id,
      ipAddress,
      userAgent,
      metadata: { rotated: true },
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: '15m',
      },
    };
  }

  /**
   * Logs out user session by revoking the refresh token
   */
  async logout({ refreshToken, userId = null }, ipAddress = null, userAgent = null) {
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await refreshTokenRepository.revokeToken(tokenHash);
    }

    if (userId) {
      await auditService.logAction({
        actorId: userId,
        action: 'USER_LOGGED_OUT',
        entityType: 'User',
        entityId: userId,
        ipAddress,
        userAgent,
      });
    }

    return { message: 'Logged out successfully' };
  }

  /**
   * Retrieves current authenticated user profile
   */
  async getCurrentUser(userId) {
    const user = await userRepository.findById(userId);
    if (!user || !user.isActive) {
      const error = new Error('User not found or account deactivated');
      error.code = 'USER_NOT_FOUND';
      error.status = 404;
      throw error;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }
}

export const authService = new AuthService();
