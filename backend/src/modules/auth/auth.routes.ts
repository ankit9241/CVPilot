import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate, attachUserIfPresent } from '../../middleware/authenticate';
import { authRateLimiter } from '../../middleware/rate-limiter';
import { validate } from '../../middleware/validate';
import { refreshSchema } from '../../validators/auth.schema';

const router: Router = Router();

router.get('/google', authRateLimiter, authController.initiateGoogle);
router.get('/google/callback', authRateLimiter, authController.googleCallback);

router.post('/refresh', validate(refreshSchema), authController.refresh);
// attachUserIfPresent: even an inactivity-expired user must be able to clear cookies.
router.post('/logout', attachUserIfPresent, authController.logout);
router.get('/me', authenticate, authController.me);

export default router;
export { router as authRouter };
