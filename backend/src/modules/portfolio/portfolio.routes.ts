import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { portfolioController } from './portfolio.controller';
import { portfolioGenerateSchema } from './portfolio.dto';

const router: Router = Router();
router.use(authenticate);

// Generate portfolio website content from resume
router.post('/generate', validate(portfolioGenerateSchema), portfolioController.generate);

export default router;
export { router as portfolioRouter };
