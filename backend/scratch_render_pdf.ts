import { prisma } from './src/prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

async function run() {
  const db = prisma as any;
  
  // Get the session from DB
  const sessionId = '917d3ef8-cc51-4d16-86fe-5d12b6d5db09';
  const versionId = '82fe1413-e1cf-4636-9ac0-8af813df6eb8'; // latest version
  
  const version = await db.resumeVersion.findUnique({
    where: { id: versionId },
    include: { session: true },
  });
  
  if (!version) { console.log('Version not found'); return; }
  
  console.log('Got version, resumeJson keys:', Object.keys(version.resumeJson || {}));
  
  // Step 1: Render
  console.log('\n--- Step 1: Template Render ---');
  let latexCode: string;
  try {
    const profile = await db.profile.findUnique({
      where: { userId: version.session.userId },
      include: { socialLinks: true },
    });
    console.log('Profile found:', !!profile);
    
    const { templateEngineService } = await import('./src/templates');
    latexCode = await templateEngineService.render(version.resumeJson, 'tpl-modern', profile);
    console.log('LaTeX rendered, length:', latexCode.length);
  } catch (err: any) {
    console.error('RENDER FAILED:', err.message);
    return;
  }
  
  // Step 2: Compile
  console.log('\n--- Step 2: LaTeX Compile ---');
  let pdfBuffer: Buffer;
  try {
    const { latexService } = await import('./src/pdf/latex.service');
    pdfBuffer = await latexService.compile(latexCode);
    console.log('PDF compiled, size:', pdfBuffer.length, 'bytes');
  } catch (err: any) {
    console.error('COMPILE FAILED:', err.message);
    // Show first 500 chars of error
    console.error(err.message?.slice(0, 500));
    return;
  }
  
  // Step 3: Upload
  console.log('\n--- Step 3: S3 Upload ---');
  try {
    const { uploadObject, presignGetUrl } = await import('./src/storage/s3');
    const crypto = await import('crypto');
    const storageKey = `generated-resumes/${version.session.userId}/${versionId}-debug-${crypto.randomUUID()}.pdf`;
    await uploadObject(storageKey, pdfBuffer, 'application/pdf');
    console.log('Uploaded to S3:', storageKey);
    
    // Update DB
    await db.resumeVersion.update({
      where: { id: versionId },
      data: { latexCode, pdfUrl: storageKey },
    });
    console.log('Updated DB with pdfUrl');
    
    const signedUrl = await presignGetUrl(storageKey);
    console.log('\nSigned URL (expires 1hr):\n', signedUrl.slice(0, 120) + '...');
  } catch (err: any) {
    console.error('UPLOAD FAILED:', err.message);
  }
}

run().catch(console.error);
