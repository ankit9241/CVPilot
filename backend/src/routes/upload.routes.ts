import { Router } from 'express';
import { z } from 'zod';
import { uploadController } from '../controllers/upload.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';

const presignSchema = z.object({
  key: z.string().min(1).max(512),
  contentType: z.string().min(1).max(120),
});

const router: Router = Router();
router.use(authenticate);

router.post('/presign', validate(presignSchema), uploadController.presign);
router.get('/download/:key', uploadController.download);

export default router;
