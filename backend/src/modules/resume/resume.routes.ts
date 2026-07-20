import { Router } from 'express';
import { atsController, resumeController } from './resume.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import {
  createResumeSchema,
  createResumeVersionSchema,
  updateResumeSchema,
} from '../../validators/resume.schema';

const router: Router = Router();
router.use(authenticate);

router.get('/dashboard-stats', resumeController.getDashboardStats);
router.get('/', resumeController.list);
router.post('/', validate(createResumeSchema), resumeController.create);
router.get('/:id', resumeController.get);
router.patch('/:id', validate(updateResumeSchema), resumeController.update);
router.delete('/:id', resumeController.remove);

router.get('/:id/versions', resumeController.listVersions);
router.post('/:id/versions', validate(createResumeVersionSchema), resumeController.createVersion);
router.post('/versions/:versionId/render', resumeController.render);

router.get('/:resumeId/ats', atsController.latest);
router.post('/:resumeId/ats', atsController.analyze);

export default router;
export { router as resumeRouter };
