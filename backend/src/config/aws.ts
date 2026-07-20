import { env } from './env';

export const awsConfig = {
  region: env.aws.region,
  credentials:
    env.aws.accessKeyId && env.aws.secretAccessKey
      ? { accessKeyId: env.aws.accessKeyId, secretAccessKey: env.aws.secretAccessKey }
      : undefined,
  bucket: env.aws.bucket,
  paths: {
    profileImages: 'profile-images',
    uploadedResumes: 'uploaded-resumes',
    generatedResumes: 'generated-resumes',
    generatedDocx: 'generated-docx',
    generatedLatex: 'generated-latex',
    templates: 'templates',
  },
} as const;
