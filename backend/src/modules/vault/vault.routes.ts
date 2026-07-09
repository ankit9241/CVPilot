import { Router } from 'express';
import { vaultController } from './vault.controller';
import { authenticate } from '../../middleware/authenticate';

const router: Router = Router();
router.use(authenticate);

router.get('/', vaultController.get);

export default router;
export { router as vaultRouter };
