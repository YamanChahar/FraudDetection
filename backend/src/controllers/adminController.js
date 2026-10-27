import { User } from '../models/User.model.js';
import { AuditLog } from '../models/AuditLog.model.js';
import { auditService } from '../services/auditService.js';
import { successResponse } from '../utils/responseEnvelope.js';

export class AdminController {
  /**
   * Lists registered users (Admin only)
   */
  async listUsers(req, res, next) {
    try {
      const users = await User.find()
        .select('name email role isActive lastLoginAt createdAt')
        .sort({ createdAt: -1 })
        .lean();

      res.status(200).json(
        successResponse(
          users.map((u) => ({ ...u, id: u._id.toString() })),
          { requestId: req.id }
        )
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates user role (Admin only)
   */
  async updateUserRole(req, res, next) {
    try {
      const { role } = req.body;
      const validRoles = ['ANALYST', 'INVESTIGATOR', 'LEAD', 'ADMIN'];
      if (!role || !validRoles.includes(role.toUpperCase())) {
        return res.status(422).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: `Invalid role. Allowed: ${validRoles.join(', ')}` },
        });
      }

      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'User not found' },
        });
      }

      const previousRole = user.role;
      user.role = role.toUpperCase();
      await user.save();

      // Audit role change
      await auditService.logAction({
        actorId: req.user.id,
        action: 'USER_ROLE_UPDATED',
        entityType: 'User',
        entityId: user._id,
        metadata: { targetUserEmail: user.email, previousRole, newRole: user.role },
      });

      res.status(200).json(
        successResponse(
          {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
          },
          { requestId: req.id }
        )
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lists immutable audit logs (Admin & Lead)
   */
  async listAuditLogs(req, res, next) {
    try {
      const { limit = 50 } = req.query;
      const logs = await AuditLog.find()
        .populate('actorId', 'name email role')
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .lean();

      res.status(200).json(
        successResponse(
          logs.map((l) => ({
            id: l._id.toString(),
            action: l.action,
            entityType: l.entityType,
            entityId: l.entityId,
            actor: l.actorId ? { name: l.actorId.name, email: l.actorId.email, role: l.actorId.role } : null,
            metadata: l.metadata,
            createdAt: l.createdAt,
          })),
          { requestId: req.id }
        )
      );
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
