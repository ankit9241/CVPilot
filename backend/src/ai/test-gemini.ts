#!/usr/bin/env node
/**
 * Test script for Gemini LLM integration with LangGraph workflow
 * Run: npx ts-node src/ai/test-gemini.ts
 */

import { initializeAIModule, checkAIModuleHealth } from './init';
import { langGraphResumeGenerationGraph } from './graph';
import type { ResumeContext } from '../modules/workflow';
import 'dotenv/config';

/**
 * Create a sample ResumeContext for testing
 */
function createSampleResumeContext(): ResumeContext {
  return {
    personalInfo: {
      fullName: 'Alice Johnson',
      headline: 'Full-Stack Software Engineer',
      phone: '+1-555-0100',
      location: 'San Francisco, CA',
    },
    professionalSummary:
      'Passionate about building high-performance systems. Expert in React, Node.js, and cloud architecture.',
    experiences: [
      {
        id: 'exp-1',
        companyName: 'TechCorp Inc',
        role: 'Senior Software Engineer',
        location: 'San Francisco, CA',
        startDate: new Date('2021-01-15'),
        isCurrent: true,
        description: 'Led development of microservices architecture handling 1M+ requests/day',
        technologiesUsed: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'AWS'],
        achievements: [
          'Reduced API latency by 40% through caching optimization',
          'Mentored 3 junior engineers',
          'Architected real-time notification system',
        ],
        relevanceScore: 0.95,
      },
      {
        id: 'exp-2',
        companyName: 'StartupXYZ',
        role: 'Full-Stack Developer',
        location: 'Remote',
        startDate: new Date('2019-03-01'),
        endDate: new Date('2020-12-30'),
        isCurrent: false,
        description: 'Built MVP from scratch, grew to 10k active users',
        technologiesUsed: ['React', 'Express', 'MongoDB'],
        achievements: ['Grew user base to 10k', 'Implemented payment integration'],
        relevanceScore: 0.75,
      },
    ],
    projects: [
      {
        id: 'proj-1',
        name: 'Real-time Analytics Dashboard',
        description: 'Dashboard processing 100k+ events per minute',
        role: 'Tech Lead',
        stack: ['React', 'TypeScript', 'WebSocket', 'PostgreSQL'],
        featured: true,
        achievements: ['Sub-second query latency', 'Real-time updates', '99.99% uptime'],
        relevanceScore: 0.9,
      },
      {
        id: 'proj-2',
        name: 'Open Source ORM Library',
        description: 'Popular TypeScript ORM library',
        role: 'Creator',
        stack: ['TypeScript', 'PostgreSQL', 'Node.js'],
        featured: false,
        achievements: ['5k GitHub stars', 'Used by 1k+ projects'],
        relevanceScore: 0.7,
      },
    ],
    skills: [
      { id: 'sk-1', name: 'TypeScript', category: 'LANGUAGE', level: 5 },
      { id: 'sk-2', name: 'React', category: 'FRAMEWORK', level: 5 },
      { id: 'sk-3', name: 'Node.js', category: 'FRAMEWORK', level: 4 },
      { id: 'sk-4', name: 'PostgreSQL', category: 'DATABASE', level: 4 },
      { id: 'sk-5', name: 'AWS', category: 'CLOUD', level: 4 },
      { id: 'sk-6', name: 'Docker', category: 'DEVOPS', level: 3 },
    ],
    educations: [
      {
        id: 'edu-1',
        school: 'University of California',
        degree: 'BS',
        field: 'Computer Science',
        startDate: new Date('2015-09-01'),
        endDate: new Date('2019-05-31'),
        gpa: '3.8',
        description: undefined,
      },
    ],
    certificates: [
      {
        id: 'cert-1',
        name: 'AWS Solutions Architect',
        issuer: 'Amazon',
        issuedAt: new Date('2022-01-15'),
        expiresAt: new Date('2025-01-15'),
        credentialUrl: 'https://aws.amazon.com/certification',
      },
    ],
    achievements: [
      {
        id: 'ach-1',
        title: 'Speaker at ReactConf 2023',
        context: 'Keynote on performance optimization',
        description: undefined,
        date: new Date('2023-06-15'),
        url: 'https://example.com',
      },
    ],
    company: {
      id: undefined,
      name: 'Google',
      description: 'Tech giant building search and cloud infrastructure',
      industry: 'Technology',
    },
    targetRole: 'Senior Full-Stack Engineer',
    jobDescription: {
      raw: `We are looking for a Senior Full-Stack Engineer with 5+ years of experience building scalable web applications.

Requirements:
- 5+ years of full-stack development experience
- Strong TypeScript and React skills
- Experience with cloud platforms (AWS, GCP, or Azure)
- SQL database experience (PostgreSQL preferred)
- Experience with microservices architecture
- Good communication and mentoring skills

Responsibilities:
- Lead technical design of new features
- Mentor junior engineers
- Contribute to architecture decisions
- Write clean, testable code
- Participate in code reviews

Nice to have:
- Open source contributions
- Speaking experience
- GraphQL experience
- Kubernetes experience`,
      title: undefined,
      company: 'Google',
      location: 'Mountain View, CA',
      requirements: [
        '5+ years of full-stack development experience',
        'Strong TypeScript and React skills',
        'Experience with cloud platforms (AWS, GCP, or Azure)',
        'SQL database experience',
      ],
      responsibilities: [
        'Lead technical design of new features',
        'Mentor junior engineers',
        'Contribute to architecture decisions',
      ],
      keywords: [
        'TypeScript',
        'React',
        'AWS',
        'PostgreSQL',
        'Microservices',
        'GraphQL',
        'Kubernetes',
      ],
    },
    extractedKeywords: [
      'TypeScript',
      'React',
      'AWS',
      'PostgreSQL',
      'Microservices',
      'Node.js',
      'Leadership',
      'Full-stack',
    ],
    generationSessionId: 'test-session-123',
    createdAt: new Date(),
  };
}

/**
 * Main test function
 */
async function runTest(): Promise<void> {
  console.log('🚀 Starting Gemini LLM + LangGraph Workflow Test\n');
  console.log('='.repeat(60));

  try {
    // Step 0: Verify configuration
    console.log('\n0️⃣  Verifying Gemini configuration...');
    const configuredModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const configuredTemp = parseFloat(process.env.GEMINI_TEMPERATURE || '0.7');
    const configuredTokens = parseInt(process.env.GEMINI_MAX_TOKENS || '4096', 10);
    const hasApiKey = Boolean(process.env.GEMINI_API_KEY);

    console.log(`   Model: ${configuredModel}`);
    console.log(`   Temperature: ${configuredTemp}`);
    console.log(`   Max Tokens: ${configuredTokens}`);
    console.log(`   API Key: ${hasApiKey ? '✓ Configured' : '✗ NOT SET'}`);

    if (!hasApiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    if (configuredModel !== 'gemini-2.5-flash') {
      console.warn(`   ⚠️  WARNING: Not using gemini-2.5-flash (using: ${configuredModel})`);
    } else {
      console.log(`   ✓ Using gemini-2.5-flash as expected`);
    }

    // Step 1: Initialize AI module
    console.log('\n1️⃣  Initializing AI module with Gemini...');
    initializeAIModule();

    // Step 2: Check health
    console.log('\n2️⃣  Checking AI module health...');
    const health = await checkAIModuleHealth();
    console.log(`   Status: ${health.message}`);
    if (!health.healthy) {
      throw new Error('AI module is not healthy');
    }

    // Step 3: Create sample ResumeContext
    console.log('\n3️⃣  Loading sample ResumeContext...');
    const resumeContext = createSampleResumeContext();
    console.log(`   ✓ Loaded context for: ${resumeContext.personalInfo.fullName}`);
    console.log(`   ✓ Target role: ${resumeContext.targetRole}`);
    console.log(`   ✓ Company: ${resumeContext.company.name}`);
    console.log(`   ✓ Experiences: ${resumeContext.experiences.length}`);
    console.log(`   ✓ Projects: ${resumeContext.projects.length}`);
    console.log(`   ✓ Skills: ${resumeContext.skills.length}`);

    // Step 4: Execute LangGraph workflow
    console.log('\n4️⃣  Executing LangGraph workflow...');
    const startTime = Date.now();
    const generatedResume = await langGraphResumeGenerationGraph.execute(resumeContext);
    const duration = Date.now() - startTime;

    console.log(`   ✓ Workflow completed in ${(duration / 1000).toFixed(2)}s`);

    // Step 5: Validate output
    console.log('\n5️⃣  Validating GeneratedResume...');
    console.log(`   ✓ Summary length: ${generatedResume.summary.length} chars`);
    console.log(`   ✓ Experiences: ${generatedResume.experiences.length}`);
    console.log(`   ✓ Projects: ${generatedResume.projects.length}`);
    console.log(`   ✓ Skills: ${generatedResume.skills.length}`);
    console.log(`   ✓ Education: ${generatedResume.education.length}`);
    console.log(`   ✓ Certificates: ${generatedResume.certificates.length}`);
    console.log(`   ✓ Achievements: ${generatedResume.achievements.length}`);

    // Step 6: Print GeneratedResume JSON
    console.log('\n6️⃣  GeneratedResume JSON Output:');
    console.log('='.repeat(60));
    console.log(JSON.stringify(generatedResume, null, 2));

    // Step 7: Print summary stats
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Execution Summary:');
    console.log(`   Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log(`   Generated Summary: ${generatedResume.summary.length} characters`);
    console.log(
      `   Total Bullet Points: ${
        generatedResume.experiences.reduce((sum, exp) => sum + exp.bulletPoints.length, 0) +
        generatedResume.projects.reduce((sum, proj) => sum + proj.bulletPoints.length, 0)
      }`,
    );
    console.log(
      `   Selection Rationale: ${generatedResume.metadata.selectionRationale.substring(0, 100)}...`,
    );

    console.log('\n✅ Test completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run test
runTest();
