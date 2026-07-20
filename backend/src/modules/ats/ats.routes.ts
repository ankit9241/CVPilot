import { Router } from 'express';
import { atsController } from './ats.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { analyzeAtsSchema } from './ats.dto';

const router: Router = Router();
router.use(authenticate);

// Analyze a resume version against a job description
router.post('/analyze', validate(analyzeAtsSchema), atsController.analyze);

// Get the latest ATS report for a saved resume
router.get('/latest/:resumeId', atsController.latest);

export default router;
export { router as atsRouter };
