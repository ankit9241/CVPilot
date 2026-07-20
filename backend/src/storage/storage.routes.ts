import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { idParam } from '../validators/common.schema';
import { storageCompleteSchema, storageListQuerySchema, storagePresignSchema } from './storage.dto';
import { storageController } from './storage.controller';
import { MAX_GENERATED_BYTES } from '../constants/paths';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_GENERATED_BYTES },
});

const router: Router = Router();
router.use(authenticate);

router.get('/', validate(storageListQuerySchema, 'query'), storageController.list);
router.post('/presign', validate(storagePresignSchema), storageController.presign);
router.post('/complete', validate(storageCompleteSchema), storageController.complete);
router.post('/upload', upload.single('file'), storageController.upload);
router.post(
  '/:id/replace',
  validate(idParam, 'params'),
  upload.single('file'),
  storageController.replace,
);
router.get('/:id/url', validate(idParam, 'params'), storageController.url);
router.delete('/:id', validate(idParam, 'params'), storageController.remove);

export default router;
export { router as storageRouter };
