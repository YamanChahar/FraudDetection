import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { validateRequest } from '../middleware/validator.js';
import { authenticate } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
} from '../schemas/authSchemas.js';

const router = Router();

// Public Authentication Endpoints
router.post(
  '/register',
  authRateLimiter,
  validateRequest({ body: registerSchema }),
  authController.register.bind(authController)
);

router.post(
  '/login',
  authRateLimiter,
  validateRequest({ body: loginSchema }),
  authController.login.bind(authController)
);

router.post(
  '/refresh',
  validateRequest({ body: refreshSchema }),
  authController.refresh.bind(authController)
);

router.post(
  '/logout',
  validateRequest({ body: logoutSchema }),
  authController.logout.bind(authController)
);

// Protected Identity Endpoint
router.get(
  '/me',
  authenticate,
  authController.getMe.bind(authController)
);

export default router;
