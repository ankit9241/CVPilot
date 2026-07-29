export { validateContextPrompt } from './validate-context';
export { analyzeJobDescriptionPrompt } from './analyze-job';
export { selectExperiencesPrompt } from './select-experiences';
export { selectProjectsPrompt } from './select-projects';
export { selectSkillsPrompt } from './select-skills';
export { summaryPrompt } from './summary';
export { experienceBulletsPrompt } from './experience-bullets';
export { projectBulletsPrompt } from './project-bullets';
export { resumeJsonPrompt } from './resume-json';
export { combinedAnalysisPrompt } from './combined-analysis';
export { combinedRewritePrompt } from './combined-rewrite';

// Shared prompt constants — import from './shared' directly in prompt files to avoid circular imports.
export { GLOBAL_RULES, DOCUMENT_PHILOSOPHY, CONTENT_BUDGET } from './shared';

// Bumped when any prompt text changes, so the LLM response cache invalidates.
export const PROMPT_VERSION = '5';
