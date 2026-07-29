# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend (`cd backend`)
```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev     
npm run dev                
npm run build              
npm run db:seed            
```

### Frontend (`cd frontend`)
```bash
bun install
bun run dev
```

There is no root-level dev script — start each side independently.

## Architecture

### Monorepo (no workspace tooling)
Two fully independent apps that communicate over REST. No shared packages. The root `package.json` is not a workspace root.

### Backend: `backend/src/`

**Express app** (`index.ts`): Middleware stack → routes → `initializeAIModule()` (fatal on failure) → `connectDatabase()` + `seedTemplates()`. Falls into "dummy mode" if DB is unavailable — controllers return static fixtures from `constants/dummy-data.ts` rather than crashing.

**Module layout** — feature code lives under `src/modules/{feature}/`:
```
auth/  profile/  resume/  vault/  workflow/  template/  application/  settings/  ats/
```
Each module owns its own routes, controller, service, and repository. The root `routes/index.ts` mounts all modules under their URL prefix.

**AI Pipeline** (`src/ai/`):
- **LLM abstraction** (`llm/client.ts`): `LLMClient` interface with `setLLMClient`/`getLLMClient`. Concrete providers: `llm/providers/gemini.ts`, `llm/providers/openrouter.ts`. Graph nodes never import a concrete provider directly.
- **LangGraph workflow** (`graph/langgraph-workflow.ts`): `StateGraph` with these sequential nodes: `validateContext → analyzeJob → selectExperiences + selectProjects + selectSkills → generateSummary → experienceBullets → projectBullets → generateResumeJson`. Each node lives in `graph/nodes/`.
- **Prompts** (`ai/prompts/`): 11 modules, one per concern. `PROMPT_VERSION` in `prompts/index.ts` must be bumped when prompt text changes (used to bust response caches).

**Template Engine** (`src/templates/`):
- 5 templates: `modern`, `classic`, `jake`, `professional`, `compact`.
- Each template folder has `template.tex`, `metadata.json`, `mapping.ts`.
- Shared components in `src/templates/components/` (header, education, experience, project, skills, footer partials).
- `commonMapping.ts` → `mapResumeToVariables()` used by every template mapper.
- `TemplateEngineService.render()` in `templates/index.ts`: preprocess/budget → mapper → render shared component partials → render main `.tex` → returns LaTeX string.
- `preprocessAndBudgetResume()` truncates sections to fit 1-page (≤7 YoE) or 2-page budgets before mapping.
- LaTeX special chars are escaped via `escapeLatex()` (uses null-byte placeholder to avoid double-escaping backslashes). All template variables go through it; `{{{raw}}}` syntax skips it.
- On startup, `seedTemplates(prisma)` upserts all template `.tex` files into the DB.

**Custom template renderer** (`templates/index.ts → renderTemplate`): Mustache-like but not Mustache. Supports `{{var}}`, `{{{raw}}}`, `{{#list}}...{{/list}}` (loops + conditionals), and dot-path access.

### Frontend: `frontend/src/`

**TanStack Start** (SSR, Vite 8, React 19). File-based routing via TanStack Router; generated route tree is at `src/routeTree.gen.ts` — do not edit manually.

Key dependencies: Radix UI (full suite), Tailwind v4, Zustand (state), Zod + react-hook-form, Framer Motion, `@xyflow/react` (flow/graph visualization, likely the workflow step UI), Recharts (analytics), `react-dropzone` (file upload).

### Path aliases
- Backend: `@/*` → `src/*` (tsconfig paths, CommonJS module)
- Frontend: `@/*` → `src/*` (bundler resolution)

### Environment
Backend reads config from `src/config/env.ts`. Requires a `.env` file (copy from `.env.example`). Key vars include DB connection string, JWT secret, Google AI / provider API keys, AWS S3 credentials, and `API_PREFIX`.
