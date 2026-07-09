import { Router } from 'express';
import { applicationController } from '../controllers/application.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { applicationSchema, updateApplicationStatusSchema } from '../validators/application.schema';

const router: Router = Router();
router.use(authenticate);

router.get('/', applicationController.list);
router.get('/board', applicationController.board);
router.post('/', validate(applicationSchema), applicationController.create);
router.get('/:id', applicationController.get);
router.patch('/:id', applicationController.update);
router.patch('/:id/status', validate(updateApplicationStatusSchema), applicationController.updateStatus);
router.delete('/:id', applicationController.remove);
router.get('/:id/stages', applicationController.stages);

export default router;
