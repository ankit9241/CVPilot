import { Router } from 'express';
import { settingsController } from './settings.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { settingsSchema } from '../../validators/settings.schema';

const router: Router = Router();
router.use(authenticate);

router.get('/', settingsController.get);
router.put('/', validate(settingsSchema), settingsController.upsert);

export default router;
export { router as settingsRouter };
