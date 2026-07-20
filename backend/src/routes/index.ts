import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import profileRoutes from '../modules/profile/profile.routes';
import resumeRoutes from '../modules/resume/resume.routes';
import vaultRoutes from '../modules/vault/vault.routes';
import workflowRoutes from '../modules/workflow/workflow.routes';
import templateRoutes from '../modules/template/template.routes';
import applicationRoutes from '../modules/application/application.routes';
import settingsRoutes from '../modules/settings/settings.routes';
import userRoutes from './user.routes';
import storageRoutes from '../storage/storage.routes';
import uploadRoutes from './upload.routes';
import atsRoutes from '../modules/ats/ats.routes';

const api: Router = Router();

api.get('/health', (_req, res) =>
  res.json({ success: true, data: { status: 'ok', at: new Date().toISOString() } }),
);

api.use('/auth', authRoutes);
api.use('/users', userRoutes);
api.use('/profile', profileRoutes);
api.use('/resumes', resumeRoutes);
api.use('/vault', vaultRoutes);
api.use('/templates', templateRoutes);
api.use('/workflow', workflowRoutes);
api.use('/applications', applicationRoutes);
api.use('/settings', settingsRoutes);
api.use('/storage', storageRoutes);
api.use('/uploads', uploadRoutes);
api.use('/ats', atsRoutes);

export default api;
