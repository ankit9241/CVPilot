import { Router } from 'express';
import {
  achievementsController,
  certificatesController,
  educationController,
  experienceController,
  profileController,
  projectsController,
  skillsController,
  socialLinksController,
} from './profile.controller';
import multer from 'multer';
import { profileImportController } from './profile-import.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { idParam } from '../../validators/common.schema';
import { educationSchema } from '../../validators/education.schema';
import { experienceSchema } from '../../validators/experience.schema';
import { certificateSchema, certificateUpdateSchema } from '../../validators/certificate.schema';
import { achievementSchema, achievementUpdateSchema } from '../../validators/achievement.schema';
import { projectSchema } from '../../validators/project.schema';
import { skillSchema } from '../../validators/skill.schema';
import {
  patchProfileSchema,
  socialLinkSchema,
  socialLinkUpdateSchema,
  upsertProfileSchema,
} from '../../validators/profile.schema';
import { z } from 'zod';

const orderedIdsSchema = z.object({
  orderedIds: z.array(z.string().uuid()).min(1),
});

const router: Router = Router();
router.use(authenticate);

router.get('/', profileController.get);
router.put('/', validate(upsertProfileSchema), profileController.upsert);
router.patch('/', validate(patchProfileSchema), profileController.upsert);
router.get('/completion', profileController.completion);

// Social links
router.get('/social-links', socialLinksController.list);
router.post('/social-links', validate(socialLinkSchema), socialLinksController.create);
router.patch(
  '/social-links/:id',
  validate(idParam, 'params'),
  validate(socialLinkUpdateSchema),
  socialLinksController.update,
);
router.delete('/social-links/:id', validate(idParam, 'params'), socialLinksController.remove);

// Education
router.get('/education', educationController.list);
router.post('/education', validate(educationSchema), educationController.create);
router.patch(
  '/education/:id',
  validate(idParam, 'params'),
  validate(educationSchema.partial()),
  educationController.update,
);
router.delete('/education/:id', educationController.remove);

// Experience
router.get('/experience', experienceController.list);
router.post('/experience', validate(experienceSchema), experienceController.create);
router.patch(
  '/experience/:id',
  validate(idParam, 'params'),
  validate(experienceSchema.partial()),
  experienceController.update,
);
router.delete('/experience/:id', experienceController.remove);

// Projects
router.get('/projects', projectsController.list);
router.post('/projects', validate(projectSchema), projectsController.create);
router.patch(
  '/projects/:id',
  validate(idParam, 'params'),
  validate(projectSchema.partial()),
  projectsController.update,
);
router.delete('/projects/:id', projectsController.remove);

// Skills
router.get('/skills', skillsController.list);
router.post('/skills', validate(skillSchema), skillsController.create);
router.patch('/skills/reorder', validate(orderedIdsSchema), profileController.reorderSkills);
router.patch(
  '/skills/:id',
  validate(idParam, 'params'),
  validate(skillSchema.partial()),
  skillsController.update,
);
router.delete('/skills/:id', skillsController.remove);

// Certificates
router.get('/certificates', certificatesController.list);
router.post('/certificates', validate(certificateSchema), certificatesController.create);
router.patch(
  '/certificates/:id',
  validate(idParam, 'params'),
  validate(certificateUpdateSchema),
  certificatesController.update,
);
router.delete('/certificates/:id', certificatesController.remove);

// Achievements
router.get('/achievements', achievementsController.list);
router.post('/achievements', validate(achievementSchema), achievementsController.create);
router.patch(
  '/achievements/:id',
  validate(idParam, 'params'),
  validate(achievementUpdateSchema),
  achievementsController.update,
);
router.delete('/achievements/:id', achievementsController.remove);

// Profile Import routes
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

router.post('/import', upload.single('file'), profileImportController.importFile);
router.post('/import/merge', profileImportController.mergeProfile);

export default router;
export { router as profileRouter };
