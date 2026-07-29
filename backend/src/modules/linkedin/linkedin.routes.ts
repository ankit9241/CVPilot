import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { linkedInController } from './linkedin.controller';
import { linkedInOptimizeSchema } from './linkedin.dto';

const router: Router = Router();
router.use(authenticate);

// Optimize resume content for LinkedIn profile
router.post('/optimize', validate(linkedInOptimizeSchema), linkedInController.optimize);

export default router;
export { router as linkedInRouter };
