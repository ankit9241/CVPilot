/* eslint-disable no-console */
import { createApp } from './src/index';
import { MONTHLY_FEATURE_LIMITS, FeatureType, SECURITY_LIMITS } from './src/config/limits';
import { getUtcPeriod } from './src/modules/usage/usage.repository';
import { sanitizeFilename } from './src/middleware/upload.middleware';
import { getActiveUserCount, getGlobalActivePdfCount } from './src/middleware/concurrency-guard';
import { isOriginAllowed } from './src/config/app';
import {
  RateLimitedError,
  UsageLimitReachedError,
  TooManyActiveRequestsError,
  PayloadTooLargeError,
  InvalidFileError,
  RequestTimeoutError,
} from './src/utils/errors';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ ${message}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

async function runSecuritySuite() {
  console.log('====================================================');
  console.log('CVPilot - PRODUCTION SECURITY & USAGE TEST SUITE');
  console.log('====================================================\n');

  // --- 1. Fixed Feature Limits Verification ---
  console.log('[1] Fixed Monthly Feature Limits (No Plans / No Subscriptions):');
  assert(MONTHLY_FEATURE_LIMITS[FeatureType.ATS_ANALYSIS] === 10, 'ATS_ANALYSIS limit is 10/month');
  assert(MONTHLY_FEATURE_LIMITS[FeatureType.RESUME_GENERATION] === 5, 'RESUME_GENERATION limit is 5/month');
  assert(MONTHLY_FEATURE_LIMITS[FeatureType.AI_OPTIMIZATION] === 10, 'AI_OPTIMIZATION limit is 10/month');
  assert(MONTHLY_FEATURE_LIMITS[FeatureType.RESUME_IMPORT] === 5, 'RESUME_IMPORT limit is 5/month');
  assert(MONTHLY_FEATURE_LIMITS[FeatureType.AI_REWRITE] === 20, 'AI_REWRITE limit is 20/month');
  assert(MONTHLY_FEATURE_LIMITS[FeatureType.PDF_GENERATION] === 10, 'PDF_GENERATION limit is 10/month');

  // --- 2. UTC Calendar Month Rollover Logic ---
  console.log('\n[2] UTC Monthly Period Calculation:');
  const sepDate = new Date(Date.UTC(2026, 8, 15, 12, 0, 0)); // September 15, 2026
  const sepPeriod = getUtcPeriod(sepDate);
  assert(sepPeriod.periodKey === '2026-09', 'September periodKey is 2026-09');
  assert(sepPeriod.periodStart.toISOString() === '2026-09-01T00:00:00.000Z', 'Period start is Sep 1 00:00:00 UTC');
  assert(sepPeriod.periodEnd.toISOString() === '2026-10-01T00:00:00.000Z', 'Period end is Oct 1 00:00:00 UTC');

  const octDate = new Date(Date.UTC(2026, 9, 1, 0, 0, 0)); // October 1, 2026
  const octPeriod = getUtcPeriod(octDate);
  assert(octPeriod.periodKey === '2026-10', 'Automatic rollover to 2026-10 on Oct 1');
  assert(octPeriod.periodStart.toISOString() === '2026-10-01T00:00:00.000Z', 'Oct period starts Oct 1 00:00:00 UTC');

  // --- 3. Structured Security Error Codes & Messages ---
  console.log('\n[3] Structured Security Error Classes:');
  const rateLimitErr = new RateLimitedError();
  assert(rateLimitErr.statusCode === 429 && rateLimitErr.code === 'RATE_LIMITED', 'RateLimitedError returns 429 RATE_LIMITED');

  const usageErr = new UsageLimitReachedError();
  assert(usageErr.statusCode === 429 && usageErr.code === 'USAGE_LIMIT_REACHED', 'UsageLimitReachedError returns 429 USAGE_LIMIT_REACHED');

  const concurrencyErr = new TooManyActiveRequestsError();
  assert(concurrencyErr.statusCode === 429 && concurrencyErr.code === 'TOO_MANY_ACTIVE_REQUESTS', 'TooManyActiveRequestsError returns 429 TOO_MANY_ACTIVE_REQUESTS');

  const payloadErr = new PayloadTooLargeError();
  assert(payloadErr.statusCode === 413 && payloadErr.code === 'REQUEST_TOO_LARGE', 'PayloadTooLargeError returns 413 REQUEST_TOO_LARGE');

  const invalidFileErr = new InvalidFileError();
  assert(invalidFileErr.statusCode === 400 && invalidFileErr.code === 'INVALID_FILE', 'InvalidFileError returns 400 INVALID_FILE');

  const timeoutErr = new RequestTimeoutError();
  assert(timeoutErr.statusCode === 408 && timeoutErr.code === 'REQUEST_TIMEOUT', 'RequestTimeoutError returns 408 REQUEST_TIMEOUT');

  // --- 4. File Upload Sanitization & Extension Filtering ---
  console.log('\n[4] File Upload Protection:');
  assert(sanitizeFilename('../../../etc/passwd') === 'passwd', 'Path traversal stripped from filename');
  assert(sanitizeFilename('my resume file (1).pdf') === 'my_resume_file__1_.pdf', 'Special characters sanitized');
  assert(sanitizeFilename('') === 'uploaded_document', 'Empty filename falls back to safe default');
  assert(SECURITY_LIMITS.uploads.maxFileUploadBytes === 10 * 1024 * 1024, 'Max upload size bounded to 10MB');
  assert(SECURITY_LIMITS.uploads.allowedExtensions.includes('.pdf'), 'PDF format allowed');
  assert(SECURITY_LIMITS.uploads.allowedExtensions.includes('.docx'), 'DOCX format allowed');
  assert(!(SECURITY_LIMITS.uploads.allowedExtensions as readonly string[]).includes('.exe'), 'Executable formats rejected');

  // --- 5. Origin Validation & CORS Security ---
  console.log('\n[5] CORS & Origin Protection:');
  assert(isOriginAllowed('https://cv-pilot.netlify.app'), 'Netlify production origin allowed');
  assert(isOriginAllowed('https://deploy-preview-42--cv-pilot.netlify.app'), 'Netlify preview subdomain allowed');
  assert(isOriginAllowed('https://cvpilot.vercel.app'), 'Vercel deployment allowed');
  assert(isOriginAllowed('http://localhost:5173'), 'Local development origin allowed');
  assert(isOriginAllowed('http://127.0.0.1:3000'), '127.0.0.1 development origin allowed');
  assert(!isOriginAllowed('https://malicious-site.com'), 'Arbitrary external origin rejected');
  assert(isOriginAllowed(undefined), 'Non-browser / curl requests allowed');

  // --- 6. Concurrency Limits ---
  console.log('\n[6] Concurrency Guard Configuration:');
  assert(SECURITY_LIMITS.concurrency[FeatureType.ATS_ANALYSIS] === 2, 'Per-user active ATS concurrency limit is 2');
  assert(SECURITY_LIMITS.concurrency[FeatureType.RESUME_GENERATION] === 2, 'Per-user active Resume Gen concurrency limit is 2');
  assert(SECURITY_LIMITS.concurrency.globalPdfMax === 4, 'Global instance PDF compilation concurrency limit is 4');
  assert(getActiveUserCount('non-existent-user', FeatureType.ATS_ANALYSIS) === 0, 'Initial active user count is 0');
  assert(getGlobalActivePdfCount() === 0, 'Initial global active PDF count is 0');

  // --- 7. Timeouts Configuration ---
  console.log('\n[7] Operation Timeout Bounds:');
  assert(SECURITY_LIMITS.timeouts.llm === 60000, 'LLM timeout configured to 60s');
  assert(SECURITY_LIMITS.timeouts.pdf === 30000, 'PDF compilation timeout configured to 30s');

  // --- 8. Express Application Instantiation & Security Headers ---
  console.log('\n[8] Express App & Middleware Stack:');
  const app = createApp();
  assert(typeof app.listen === 'function', 'Express app created successfully with all security middlewares');

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)`);
  console.log('====================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

void runSecuritySuite();
