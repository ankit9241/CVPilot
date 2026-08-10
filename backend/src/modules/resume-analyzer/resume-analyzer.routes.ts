import { Router } from 'express';
import multer from 'multer';
import { resumeAnalyzerController } from './resume-analyzer.controller';
import { authenticate } from '../../middleware/authenticate';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const router: Router = Router();
router.use(authenticate);

// Standalone ATS resume checker — upload PDF/DOCX, get full analysis.
// Does NOT touch Vault, Studio, versions, or the Master Profile.
router.post('/analyze', upload.single('resumeFile'), resumeAnalyzerController.analyze);
router.post('/analyze-stream', upload.single('resumeFile'), resumeAnalyzerController.analyzeStream);

export default router;
export { router as resumeAnalyzerRouter };
