import { Router } from 'express';
import { workflowController } from './workflow.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { startWorkflowSchema } from '../../validators/workflow.schema';

const router: Router = Router();
router.use(authenticate);

// Initiate a new generation session
router.post('/', validate(startWorkflowSchema), workflowController.initiate);

// Get an existing session
router.get('/:id', workflowController.getSession);

// Get workflow logs for a session
router.get('/:id/logs', workflowController.getLogs);

// Execute the workflow and get prepared ResumeContext
router.post('/:id/execute', workflowController.execute);

export default router;
export { router as workflowRouter };
