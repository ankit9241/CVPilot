import assert from 'assert';
import { prisma } from '../../../prisma/client';
import { resumeContextBuilderService } from './resume-context-builder.service';

async function runTests() {
  console.log('🧪 Starting ResumeContextBuilderService Unit Tests...');

  // Mock profile data
  const mockProfile: any = {
    id: 'profile-1',
    userId: 'user-1',
    fullName: 'Test Candidate',
    headline: 'Software Architect',
    phone: '1234567890',
    location: 'New York, NY',
    summary: 'Experienced developer building scalable software systems.',
    experiences: [
      {
        id: 'exp-old',
        companyName: 'Old Corp',
        role: 'Developer',
        startDate: new Date('2020-01-01'),
        endDate: new Date('2021-01-01'),
        isCurrent: false,
        technologiesUsed: ['JavaScript'],
        achievements: ['Wrote code'],
      },
      {
        id: 'exp-new',
        companyName: 'New Corp',
        role: 'Senior Developer',
        startDate: new Date('2022-01-01'),
        isCurrent: true,
        technologiesUsed: ['TypeScript', 'Node.js'],
        achievements: ['Led team', 'Optimized APIs'],
      },
    ],
    projects: [
      {
        id: 'proj-regular',
        name: 'Regular Project',
        description: 'A basic project',
        role: 'Contributor',
        stack: ['React'],
        impact: 'Medium',
        achievements: ['Fixed bugs'],
        featured: false,
        startDate: new Date('2021-06-01'),
      },
      {
        id: 'proj-featured',
        name: 'Featured Project',
        description: 'A great project',
        role: 'Lead Architect',
        stack: ['Next.js', 'Go'],
        impact: 'High',
        achievements: ['Designed system', 'Scaled DB'],
        featured: true,
        startDate: new Date('2022-01-01'),
      },
    ],
    skills: [
      {
        id: 'skill-react-dup',
        name: 'React',
        category: 'FRONTEND',
        level: 4,
        sortOrder: 2,
        createdAt: new Date('2021-01-01'),
      },
      {
        id: 'skill-ts',
        name: 'TypeScript',
        category: 'LANGUAGE',
        level: 5,
        sortOrder: 1,
        createdAt: new Date('2021-01-01'),
      },
      {
        id: 'skill-react',
        name: 'React',
        category: 'FRONTEND',
        level: 5,
        sortOrder: 2,
        createdAt: new Date('2020-01-01'),
      },
    ],
    educations: [
      {
        id: 'edu-1',
        school: 'University',
        degree: 'BS CS',
        field: 'Computer Science',
        gpa: '3.9',
        startDate: new Date('2016-09-01'),
        endDate: new Date('2020-05-01'),
      },
    ],
    certificates: [
      {
        id: 'cert-1',
        name: 'AWS Solutions Architect',
        issuer: 'Amazon',
        issuedAt: new Date('2021-05-01'),
      },
    ],
    achievements: [
      {
        id: 'ach-1',
        title: 'Hackathon Winner',
        description: '1st place',
        date: new Date('2020-10-01'),
      },
    ],
    socialLinks: [
      {
        id: 'sl-1',
        platform: 'GITHUB',
        url: 'https://github.com/test',
      },
    ],
  };

  // Mock Prisma findUnique
  prisma.profile.findUnique = (async (args: any) => {
    if (args.where.userId === 'user-1') {
      return mockProfile;
    }
    return null;
  }) as any;

  const jobDescription = `
Role: Senior TypeScript Engineer
We are looking for a Senior Developer at Stripe.
Requirements:
- Strong experience with TypeScript and Node.js
- Experience with React and AWS
Responsibilities:
- Build high scale APIs and developer workflows
  `;

  // Test 1: Successful builder execution and normalization
  console.log('  1. Running build success and normalization test...');
  const context = await resumeContextBuilderService.build(
    'user-1',
    'Stripe',
    'Payment infrastructure company',
    jobDescription,
  );

  // Assert basic fields
  assert.strictEqual(context.personalInfo.fullName, 'Test Candidate');
  assert.strictEqual(context.company.name, 'Stripe');
  assert.strictEqual(context.company.description, 'Payment infrastructure company');
  assert.strictEqual(context.targetRole, 'Senior TypeScript Engineer');

  // Assert Experience recency sorting (exp-new should be first because startDate is 2022)
  assert.strictEqual(context.experiences.length, 2);
  assert.strictEqual(context.experiences[0].id, 'exp-new');
  assert.strictEqual(context.experiences[1].id, 'exp-old');

  // Assert Project featured + date sorting (proj-featured should be first)
  assert.strictEqual(context.projects.length, 2);
  assert.strictEqual(context.projects[0].id, 'proj-featured');
  assert.strictEqual(context.projects[1].id, 'proj-regular');

  // Assert duplicate skills removal and sorting (TypeScript has sortOrder 1, React has sortOrder 2)
  assert.strictEqual(context.skills.length, 2);
  assert.strictEqual(context.skills[0].id, 'skill-ts');
  assert.strictEqual(context.skills[1].name, 'React'); // Duplicate 'React' removed

  // Assert socialLinks present
  assert.ok(context.personalInfo.socialLinks);
  assert.strictEqual(context.personalInfo.socialLinks.length, 1);
  assert.strictEqual(context.personalInfo.socialLinks[0].platform, 'GITHUB');

  console.log('  ✅ Build success and normalization test passed!');

  // Test 2: Validation errors for missing master profile
  console.log('  2. Running missing profile validation test...');
  await assert.rejects(
    async () => {
      await resumeContextBuilderService.build('user-missing', 'Stripe', undefined, jobDescription);
    },
    {
      message: 'Master Profile not found. Please complete your profile first.',
    },
  );
  console.log('  ✅ Missing profile validation test passed!');

  // Test 3: Validation errors for missing required experiences
  console.log('  3. Running missing experiences validation test...');
  const emptyExpProfile = { ...mockProfile, experiences: [] };
  prisma.profile.findUnique = (async () => emptyExpProfile) as any;
  await assert.rejects(
    async () => {
      await resumeContextBuilderService.build('user-1', 'Stripe', undefined, jobDescription);
    },
    {
      message: 'Profile experiences are missing. Please add at least one experience.',
    },
  );
  console.log('  ✅ Missing experiences validation test passed!');

  console.log('🎉 All tests completed successfully!');
}

runTests().catch((err) => {
  console.error('❌ Test execution failed:', err);
  process.exit(1);
});
