import { Router } from 'express';
import { userController } from '../controllers/profile.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { updateUserSchema } from '../validators/user.schema';

const router: Router = Router();

router.use(authenticate);
router.get('/me', userController.me);
router.patch('/me', validate(updateUserSchema), userController.update);
router.delete('/me', userController.remove);

export default router;
