import { Router } from 'express';
import { templatesController } from '../controllers/resume.controller';

const router: Router = Router();

router.get('/', templatesController.list);
router.get('/:id', templatesController.get);

export default router;
