import { Router } from 'express';
import { atsController } from './ats.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { analyzeAtsSchema, diffSchema, interviewPrepSchema, coverLetterSchema } from './ats.dto';

const router: Router = Router();
router.use(authenticate);

// Analyze a resume version against a job description
router.post('/analyze', validate(analyzeAtsSchema), atsController.analyze);

// Get the latest ATS report for a saved resume
router.get('/latest/:resumeId', atsController.latest);

// Senior-recruiter persona review (distinct from ATS score)
router.post('/recruiter-review', validate(analyzeAtsSchema), atsController.recruiterReview);

// Intelligent job tailoring — reorder, reword, emphasize by JD relevance
router.post('/tailor', validate(analyzeAtsSchema), atsController.tailor);

// Resume writing quality analysis (job-agnostic, NOT ATS scoring)
router.post('/quality', validate(analyzeAtsSchema), atsController.quality);

// Compare two resume versions — meaningful content changes only
router.post('/diff', validate(diffSchema), atsController.diff);

// Health dashboard — aggregated quality signals (cached)
router.post('/health', validate(analyzeAtsSchema), atsController.health);

// AI interview prep — grounded in resume content
router.post('/interview-prep', validate(interviewPrepSchema), atsController.interviewPrep);

// Cover letter generation — personalized to company and role
router.post('/cover-letter', validate(coverLetterSchema), atsController.coverLetter);

export default router;
export { router as atsRouter };
