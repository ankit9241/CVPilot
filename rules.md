# Development Rules

These rules are mandatory for every contribution to CVPilot.

---

# General Principles

- Preserve existing architecture.
- Prefer extending existing modules over creating new ones.
- Never duplicate logic.
- Keep implementations simple and maintainable.
- Write production-quality code only.
- No temporary hacks.
- No unnecessary abstractions.

---

# Architecture Rules

- Follow feature-first architecture.
- Every feature must live inside its own module.
- Do not mix unrelated features.
- Use Composition over Inheritance.
- Follow SOLID principles.
- Keep modules loosely coupled.

---

# Controller Rules

Controllers should only:

- Parse requests
- Validate input
- Call services
- Return responses

Controllers must NEVER:

- Query Prisma
- Contain business logic
- Call external APIs directly

---

# Service Rules

Services own all business logic.

Examples:

- Resume Generation
- Profile Management
- PDF Generation
- ATS Analysis
- Resume Import

Never move business logic into controllers.

---

# Repository Rules

Repositories are responsible only for database access.

Repositories:

- Use Prisma
- Execute queries
- Return data

Repositories must NEVER:

- Call LLMs
- Access Express
- Render templates
- Perform business logic

---

# AI Rules

The AI module must remain independent.

Never import:

- Express
- Prisma
- Controllers
- Services
- Database models

Input:

ResumeContext

Output:

GeneratedResume

AI never writes directly to the database.

---

# Resume Rules

Master Profile is the single source of truth.

Generated resumes are subsets.

AI should:

- Select relevant information
- Rewrite professionally
- Never fabricate information
- Never exaggerate experience

Default:

≤7 YOE → One page

> 7 YOE → Maximum two pages

---

# Template Rules

Templates own formatting.

LLM never generates:

- HTML
- LaTeX
- CSS
- PDF

Template Engine converts GeneratedResume into LaTeX.

---

# PDF Rules

PDF generation is deterministic.

Pipeline:

GeneratedResume

↓

Template Engine

↓

LaTeX

↓

XeLaTeX

↓

PDF

Never use AI for formatting PDFs.

---

# Database Rules

Always use Prisma.

No raw SQL unless necessary.

Use transactions for multi-step writes.

Soft delete where applicable.

Index foreign keys.

Never duplicate data.

---

# API Rules

RESTful endpoints only.

Always validate inputs.

Return meaningful error messages.

Never expose internal errors.

Keep response formats consistent.

---

# Frontend Rules

Use:

- TanStack Router
- TanStack Query

Server state belongs in React Query.

Avoid unnecessary local state.

Never duplicate API data.

---

# React Rules

Avoid unnecessary rerenders.

Avoid infinite useEffect loops.

Memoize expensive computations.

Stop polling after completion.

One user action should trigger one backend operation.

---

# Query Rules

Always invalidate affected queries after mutations.

Prefer optimistic updates where appropriate.

Rollback optimistic updates on failure.

---

# UI Rules

Design Philosophy:

Claude × Apple × Linear × Vercel

UI should feel:

- Clean
- Minimal
- Fast
- Modern

Avoid visual clutter.

Prefer whitespace.

---

# Component Rules

Components should be:

- Small
- Reusable
- Typed
- Focused

Avoid massive files.

Split complex logic into hooks/services.

---

# TypeScript Rules

Strict mode enabled.

Never use:

any

Prefer:

unknown

interfaces

utility types

generics

Fix types instead of suppressing them.

---

# Naming Rules

Use consistent naming.

Example:

ProfileService

ResumeRepository

WorkflowController

ResumeContextBuilder

Avoid abbreviations.

---

# Import Rules

Use absolute imports where configured.

Avoid circular dependencies.

Keep imports organized.

---

# Logging Rules

Log meaningful events only.

Examples:

Generation Started

Generation Completed

PDF Generated

Import Completed

Avoid noisy console logs.

---

# Error Handling

Always handle:

- Network failures
- LLM failures
- S3 failures
- Database failures
- Validation failures

Errors should be descriptive.

Never silently ignore failures.

---

# Resume Generation Rules

One click = one generation.

Prevent duplicate generation requests.

Stop polling after completion.

Do not rerender unnecessarily.

Resume generation should be deterministic.

---

# LLM Rules

Provider agnostic.

Never hardcode provider-specific logic.

Switch providers through environment variables only.

Support:

- OpenRouter
- OpenAI
- Claude
- Gemini
- Groq

---

# Security Rules

Never expose:

- API keys
- Secrets
- Tokens

Always validate uploads.

Escape user input.

Use presigned S3 URLs.

---

# Performance Rules

Avoid duplicate API calls.

Cache where appropriate.

Reuse generated PDFs when possible.

Avoid unnecessary LLM requests.

Template switching must never call the LLM.

---

# Testing Rules

Every major feature should verify:

- Happy path
- Validation errors
- Empty states
- Failure recovery

Build must pass before completion.

---

# Git Rules

Keep commits focused.

Do not mix unrelated changes.

Remove dead code.

Do not leave TODOs without reason.

---

# Documentation Rules

Whenever architecture changes:

Update:

- PRD.md
- Architecture.md
- phases.md
- memory.md

Documentation is part of the feature.

---

# Future Features

Upcoming modules:

- ATS Engine
- Optimization Loop
- Resume Import
- LinkedIn Import
- GitHub Import
- Cover Letters
- Interview Prep

Build new features without breaking existing architecture.

---

# Golden Rule

CVPilot is NOT a traditional resume builder.

It is an AI-powered Career Operating System.

Every change should move the product closer to that vision.
