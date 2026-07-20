import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middleware/authenticate';
import { authRateLimiter } from '../../middleware/rate-limiter';
import { validate } from '../../middleware/validate';
import { refreshSchema } from '../../validators/auth.schema';

const router: Router = Router();

router.get('/google', authRateLimiter, authController.initiateGoogle);
router.get('/google/callback', authRateLimiter, authController.googleCallback);

router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);

export default router;
export { router as authRouter };
