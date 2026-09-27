import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { safeUploadSingle } from '../middleware/upload.middleware';
import { fileUploadRateLimiter } from '../middleware/rate-limiter';
import { idParam } from '../validators/common.schema';
import { storageCompleteSchema, storageListQuerySchema, storagePresignSchema } from './storage.dto';
import { storageController } from './storage.controller';

const router: Router = Router();
router.use(authenticate);

router.get('/', validate(storageListQuerySchema, 'query'), storageController.list);
router.post('/presign', validate(storagePresignSchema), storageController.presign);
router.post('/complete', validate(storageCompleteSchema), storageController.complete);
router.post('/upload', fileUploadRateLimiter, safeUploadSingle('file'), storageController.upload);
router.post(
  '/:id/replace',
  fileUploadRateLimiter,
  validate(idParam, 'params'),
  safeUploadSingle('file'),
  storageController.replace,
);
router.get('/:id/url', validate(idParam, 'params'), storageController.url);
router.delete('/:id', validate(idParam, 'params'), storageController.remove);

export default router;
export { router as storageRouter };
