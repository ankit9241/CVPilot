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
} from '../controllers/profile.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { idParam } from '../validators/common.schema';
import { educationSchema } from '../validators/education.schema';
import { experienceSchema } from '../validators/experience.schema';
import { projectSchema } from '../validators/project.schema';
import { skillSchema } from '../validators/skill.schema';
import { socialLinkSchema, upsertProfileSchema } from '../validators/profile.schema';

const router: Router = Router();
router.use(authenticate);

router.get('/', profileController.get);
router.put('/', validate(upsertProfileSchema), profileController.upsert);
router.get('/completion', profileController.completion);

// Social links
router.get('/social-links', socialLinksController.list);
router.post('/social-links', validate(socialLinkSchema), socialLinksController.create);
router.patch('/social-links/:id', validate(idParam, 'params'), socialLinksController.update);
router.delete('/social-links/:id', validate(idParam, 'params'), socialLinksController.remove);

// Education
router.get('/education', educationController.list);
router.post('/education', validate(educationSchema), educationController.create);
router.patch('/education/:id', educationController.update);
router.delete('/education/:id', educationController.remove);

// Experience
router.get('/experience', experienceController.list);
router.post('/experience', validate(experienceSchema), experienceController.create);
router.patch('/experience/:id', experienceController.update);
router.delete('/experience/:id', experienceController.remove);

// Projects
router.get('/projects', projectsController.list);
router.post('/projects', validate(projectSchema), projectsController.create);
router.patch('/projects/:id', projectsController.update);
router.delete('/projects/:id', projectsController.remove);

// Skills
router.get('/skills', skillsController.list);
router.post('/skills', validate(skillSchema), skillsController.create);
router.patch('/skills/:id', skillsController.update);
router.delete('/skills/:id', skillsController.remove);

// Certificates
router.get('/certificates', certificatesController.list);
router.post('/certificates', certificatesController.create);
router.patch('/certificates/:id', certificatesController.update);
router.delete('/certificates/:id', certificatesController.remove);

// Achievements
router.get('/achievements', achievementsController.list);
router.post('/achievements', achievementsController.create);
router.patch('/achievements/:id', achievementsController.update);
router.delete('/achievements/:id', achievementsController.remove);

export default router;
