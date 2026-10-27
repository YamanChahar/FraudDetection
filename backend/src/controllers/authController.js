import { authService } from '../services/authService.js';
import { successResponse } from '../utils/responseEnvelope.js';

export class AuthController {
  /**
   * POST /api/v1/auth/register
   */
  async register(req, res, next) {
    try {
      const result = await authService.register(
        req.body,
        req.ip,
        req.headers['user-agent']
      );

      res.status(201).json(
        successResponse(result, {
          requestId: req.id,
          message: 'User registered successfully',
        })
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/login
   */
  async login(req, res, next) {
    try {
      const result = await authService.login(
        req.body,
        req.ip,
        req.headers['user-agent']
      );

      res.status(200).json(
        successResponse(result, {
          requestId: req.id,
          message: 'Authentication successful',
        })
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/refresh
   */
  async refresh(req, res, next) {
    try {
      const result = await authService.refresh(
        req.body,
        req.ip,
        req.headers['user-agent']
      );

      res.status(200).json(
        successResponse(result, {
          requestId: req.id,
          message: 'Tokens rotated and refreshed successfully',
        })
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/logout
   */
  async logout(req, res, next) {
    try {
      const result = await authService.logout(
        {
          refreshToken: req.body?.refreshToken,
          userId: req.user?.id || null,
        },
        req.ip,
        req.headers['user-agent']
      );

      res.status(200).json(
        successResponse(result, {
          requestId: req.id,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/auth/me
   */
  async getMe(req, res, next) {
    try {
      const profile = await authService.getCurrentUser(req.user.id);
      res.status(200).json(
        successResponse(profile, {
          requestId: req.id,
        })
      );
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
