import { Router } from 'express';
import { usageController } from './usage.controller';
import { authenticate } from '../../middleware/authenticate';

const router: Router = Router();
router.use(authenticate);

// Get monthly feature usage quotas and remaining credits for the authenticated user
router.get('/', usageController.getSummary);

export default router;
export { router as usageRouter };
