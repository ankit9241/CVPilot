# Project Memory

This document contains persistent knowledge about CVPilot.

Every AI agent must read this before making changes.

---

# What is CVPilot?

CVPilot is NOT a traditional resume builder.

CVPilot is an AI-powered Career Operating System.

The goal is to help users maintain one complete career profile and generate unlimited company-specific resumes using AI.

---

# Product Philosophy

Users should never manually edit resumes repeatedly.

Users maintain one Master Profile.

Everything else is generated.

The Master Profile is permanent.

Generated resumes are temporary.

---

# Core Workflow

Google Login

↓

Master Profile

↓

Resume Import (optional)

↓

Paste Job Description

↓

ResumeContext Builder

↓

LangGraph

↓

LLM

↓

GeneratedResume JSON

↓

Template Engine

↓

LaTeX

↓

XeLaTeX

↓

PDF

↓

Resume Vault

---

# Architecture Philosophy

Feature-first architecture.

Thin Controllers.

Fat Services.

Repositories own database access.

AI remains completely isolated.

Template Engine is deterministic.

PDF generation is deterministic.

---

# AI Responsibilities

AI should:

- Understand the job description.
- Select the most relevant information.
- Rewrite professionally.
- Prioritize impact.
- Return structured JSON.

AI should NEVER:

- Invent experience.
- Hallucinate companies.
- Generate fake metrics.
- Output LaTeX.
- Output HTML.
- Access the database.

---

# Master Profile

The Master Profile stores EVERYTHING.

Examples:

- All experiences
- All projects
- All skills
- All certificates
- All achievements

Nothing is removed.

Nothing is optimized.

---

# Generated Resume

Generated resumes are subsets of the Master Profile.

They should include only the most relevant content for the target job.

Do not copy the entire profile.

Default limits:

Experience:

Top 3–4

Projects:

Top 2–3

Skills:

Top 12–15

Achievements:

Top 2–3

Certificates:

Only if relevant.

---

# Resume Philosophy

≤7 Years Experience

Target one page.

> 7 Years Experience

Maximum two pages.

Content quality is more important than quantity.

---

# LLM

Current provider:

OpenRouter

Architecture must remain provider-agnostic.

Future providers:

- OpenAI
- Claude
- Gemini
- Groq

Changing providers should require only environment variable changes.

---

# Template Philosophy

Templates own presentation.

AI owns content.

Template switching must NEVER call the LLM.

Only rerender.

---

# PDF Philosophy

GeneratedResume

↓

Template Engine

↓

LaTeX

↓

XeLaTeX

↓

PDF

No AI involvement.

---

# Resume Version Philosophy

Every generation creates a new ResumeVersion.

Each version stores:

- GeneratedResume JSON
- LaTeX
- PDF
- Template
- Company
- Target Role
- Job Description
- Generation Date
- LLM Provider
- LLM Model
- Token Usage

Nothing is overwritten.

---

# Resume Import

Users should not manually type their career history.

Supported:

- Resume PDF
- Resume DOCX

Planned:

- LinkedIn
- GitHub
- Portfolio
- JSON Import

Every import requires user review before saving.

---

# ATS Philosophy

ATS should not be random.

Scoring should consider:

- Keywords
- Skills
- Experience
- Readability
- Formatting
- Section completeness

LLM may explain results, but scoring logic should be deterministic wherever possible.

---

# UI Philosophy

Inspired by:

- Claude
- Apple
- Linear
- Vercel

Characteristics:

- Minimal
- Fast
- Clean
- Spacious
- Professional

Avoid visual clutter.

---

# Performance Goals

Authentication:

<1 second

Template switching:

Instant

PDF generation:

<5 seconds

Resume generation:

20–45 seconds

Avoid unnecessary API calls.

Avoid rerenders.

Stop polling after completion.

---

# Development Rules

Always:

- Reuse existing modules.
- Keep controllers thin.
- Keep business logic in services.
- Keep repositories database-only.
- Write strict TypeScript.
- Maintain modular architecture.

Never:

- Duplicate logic.
- Add business logic to React components.
- Query Prisma inside controllers.
- Couple AI with Express or Prisma.

---

# Current Project Status

Completed:

- Google Authentication
- Master Profile
- Resume Generation
- LangGraph Integration
- OpenRouter Integration
- Template Engine
- PDF Generation
- Resume Vault

In Progress:

- Resume Import

Planned:

- ATS Engine
- Resume Optimization Loop
- Cover Letters
- GitHub Import
- LinkedIn Import
- Portfolio Import

---

# Important Architectural Decisions

- AI outputs JSON only.
- Templates generate LaTeX.
- XeLaTeX generates PDFs.
- Master Profile is the single source of truth.
- Resume generation is deterministic.
- Resume versions are immutable.
- One user action should trigger one backend operation.

---

# Long-Term Vision

CVPilot should evolve from an AI Resume Builder into a complete Career Operating System.

Future capabilities include:

- ATS Optimization
- Cover Letters
- LinkedIn Optimization
- GitHub Analysis
- Interview Preparation
- Career Analytics
- Job Tracking
- AI Career Assistant

Every new feature should strengthen this vision rather than introduce unrelated functionality.
