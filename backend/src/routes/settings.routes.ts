import { Router } from 'express';
import { settingsController } from '../controllers/settings.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { settingsSchema } from '../validators/settings.schema';

const router: Router = Router();
router.use(authenticate);

router.get('/', settingsController.get);
router.patch('/', validate(settingsSchema), settingsController.update);

export default router;
