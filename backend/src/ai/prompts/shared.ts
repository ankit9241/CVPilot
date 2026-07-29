/**
 * Shared prompt constants for Prompt Architecture V2.
 *
 * Every generation node that writes resume content should prepend
 * DOCUMENT_PHILOSOPHY and GLOBAL_RULES to its system prompt.
 *
 * Nodes that only validate or extract structured data (validate-context,
 * analyze-job) skip these — they have no writing responsibility.
 *
 * Import from this file directly (not from ./index) to avoid circular imports.
 */

/**
 * Establishes the whole-document mindset before any section-level work begins.
 * Inject in every selection and generation prompt.
 */
export const DOCUMENT_PHILOSOPHY = `\
=== DOCUMENT PHILOSOPHY ===
This resume is a single document, not a collection of isolated sections.
Every selection and every word must serve the whole:
- The summary previews what the experience section proves.
- The skills section mirrors what appears in experience and project bullets.
- Projects complement — never duplicate — experience.
- Every section must reinforce the same professional narrative.
Optimize for the complete document, not for individual sections in isolation.`;

/**
 * Fixed space budget for every section of the resume.
 * Inject in every prompt that generates or assembles resume content.
 * These numbers are hard limits — the AI must never exceed them.
 */
export const CONTENT_BUDGET = `\
=== CONTENT BUDGET (HARD LIMITS) ===
The resume has a fixed space budget. Allocate intelligently — never generate unlimited content.

  Summary        : 30–45 words. Never fewer than 30, never more than 45.
  Experience     : max 3 bullets per entry · 15–20 words each
  Projects       : max 3 bullets per entry · 15–20 words each
  Achievements   : max 2 items total
  Certificates   : max 3 items total
  Technical Skills: never remove valid skills — group into categories instead
  Project Stack  : max 5 technologies per project

COMPRESSION PRIORITY (apply in this order if content is too long):
  1. Tighten the summary to the lower bound (30 words)
  2. Shorten project bullets (cut to 15 words each)
  3. Tighten experience wording (cut to 15 words per bullet)
  4. Trim achievements to the 2-item limit

NEVER remove:
  - Experience entries
  - Project entries
  - Technical skills (group them, never delete)`;

/**
 * Single source of truth for all writing rules.
 * Inject in every prompt that generates or rewrites resume content.
 */
export const GLOBAL_RULES = `\
=== GLOBAL WRITING RULES ===
These rules apply to every section without exception.

TRUTHFULNESS
- Never hallucinate, invent, or fabricate any information.
- Never invent metrics, percentages, or numbers not present in the source.
- Never invent technologies, tools, or certifications not present in the source.
- Preserve 100% factual accuracy from the provided input at all times.

WRITING QUALITY
- Use strong action verbs: Architected, Engineered, Optimized, Automated, Launched, Led, Scaled, Delivered, Designed, Reduced, Increased, Streamlined.
- Never use weak phrases: "worked on", "responsible for", "helped with", "participated in", "assisted with", "involved in".
- Remove filler words: "various", "some", "approximately", "a number of", "etc.".
- Write in active voice. Avoid passive constructions.
- Keep a consistent professional tone throughout the entire document.
- Prefer concise, recruiter-friendly language over verbose explanations.
- Prioritize clarity over verbosity — every word must earn its place.

ATS COMPATIBILITY
- Maintain ATS-parseable structure and language.
- Include relevant keywords naturally in context — never stuff keywords or repeat them mechanically.
- Mirror the exact terminology used in the job description where truthful and relevant.

ONE-PAGE AWARENESS
The target output is a single printed page. Write with that constraint active at all times.

When content risks overflowing the page, compress wording — never sacrifice important experience.
Compression toolkit (use in this order, stop when the page fits):
  1. Shorten the summary toward 30 words.
  2. Remove unnecessary adjectives and adverbs from bullets.
  3. Cut repeated technology names already mentioned earlier in the same section.
  4. Merge two similar ideas into one tighter bullet.
  5. Strip filler words ("leveraged", "utilized", "various", "a wide range of").
  6. Tighten project bullets before touching experience bullets.

Hard rules:
- Never write paragraphs. Bullets only.
- Never exceed 20 words per bullet. Target 15–18.
- Prefer one precise word over two imprecise words.
- Every word must earn its place on the page.

CONSISTENCY & NON-REDUNDANCY
- Do not repeat the same achievement, technology, or phrase across different sections.
- Do not repeat a company name, project name, or role title inside a bullet point.
- Skills listed in the skills section should appear naturally in experience/project bullets — not verbatim copied.
- Each bullet must be fully independent and self-contained.`;
