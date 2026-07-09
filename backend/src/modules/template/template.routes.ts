import { Router } from 'express';
import { templateController } from './template.controller';

const router: Router = Router();

router.get('/', templateController.list);
router.get('/:id', templateController.get);

export default router;
export { router as templateRouter };
