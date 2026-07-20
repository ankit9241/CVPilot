# Development Phases

This document tracks the development roadmap of CVPilot.

---

# Phase 0 — Project Foundation ✅

## Goal

Set up the project architecture and development environment.

## Completed

- Monorepo structure
- Frontend (TanStack Start)
- Backend (Express)
- Prisma setup
- PostgreSQL (Neon)
- AWS S3 integration
- Google OAuth
- JWT Authentication
- Environment configuration
- ESLint + Prettier
- Build verification

Status: ✅ Completed

---

# Phase 1 — Authentication & User System ✅

## Goal

Allow users to securely access CVPilot.

## Completed

- Google OAuth
- JWT authentication
- Session persistence
- Silent refresh
- Protected routes
- User profile creation
- Logout
- Authentication middleware

Status: ✅ Completed

---

# Phase 2 — Master Profile ✅

## Goal

Build the single source of truth for every user's career.

## Completed

- Personal Information
- Experience CRUD
- Projects CRUD
- Skills CRUD
- Education CRUD
- Certificates CRUD
- Achievements CRUD
- Social Links
- React Query integration
- Optimistic updates
- Drag & Drop ordering

Status: ✅ Completed

---

# Phase 3 — Resume Context Builder ✅

## Goal

Convert the Master Profile into AI-ready structured data.

## Completed

- ResumeContext Builder
- Job Description parsing
- Company parsing
- Keyword extraction
- Relevance scoring
- Validation
- Data normalization
- Unit tests

Status: ✅ Completed

---

# Phase 4 — AI Resume Generation ✅

## Goal

Generate tailored resumes using LangGraph + LLM.

## Completed

- Official LangGraph integration
- OpenRouter support
- Provider abstraction
- Multi-node workflow
- Resume generation
- Generation sessions
- Workflow logs
- Token tracking
- ResumeVersion creation
- Save Draft
- Workflow timeline

Status: ✅ Completed

---

# Phase 5 — Template Engine ✅

## Goal

Convert GeneratedResume into deterministic LaTeX.

## Completed

- Template Engine
- Mustache renderer
- Template mappings
- Multiple templates
- Template switching
- Database-backed templates
- Live rerendering
- LaTeX preview

Status: ✅ Completed

---

# Phase 6 — PDF Generation ✅

## Goal

Generate professional ATS-friendly PDFs.

## Completed

- XeLaTeX integration
- PDF generation
- S3 upload
- ResumeVersion updates
- PDF preview
- PDF download
- PDF caching
- Template-aware regeneration
- Compiler error reporting

Status: ✅ Completed

---

# Phase 7 — Resume Import 🚧

## Goal

Populate the Master Profile automatically.

## Planned

- Resume PDF import
- Resume DOCX import
- LinkedIn PDF import
- Review screen
- Merge existing data
- Duplicate detection
- AI extraction
- Import progress UI

Status: 🚧 In Progress

---

# Phase 8 — ATS Engine ⏳

## Goal

Evaluate generated resumes.

## Planned

- Keyword matching
- Skill matching
- Experience scoring
- Formatting score
- Readability score
- Missing keyword detection
- Improvement suggestions
- ATS breakdown

Status: ⏳ Planned

---

# Phase 9 — Resume Optimization Loop ⏳

## Goal

Automatically improve resumes using ATS feedback.

## Planned

- ATS feedback
- Regeneration
- Score comparison
- Multiple optimization iterations
- Version comparison

Status: ⏳ Planned

---

# Phase 10 — Career Integrations ⏳

## Planned

- GitHub Import
- Portfolio Import
- LinkedIn Enhancements
- Resume JSON Import
- Developer Import

Status: ⏳ Planned

---

# Phase 11 — Cover Letter Generator ⏳

## Planned

- AI-generated cover letters
- Company-specific tailoring
- Template support
- PDF generation

Status: ⏳ Planned

---

# Phase 12 — Career OS ⏳

## Long-Term Vision

Transform CVPilot into a complete Career Operating System.

Future Features

- Interview Preparation
- Job Tracker
- LinkedIn Optimizer
- Career Analytics
- Application Tracker
- AI Career Coach
- Skill Gap Analysis
- Personalized Learning Suggestions

Status: ⏳ Future

---

# Current MVP Status

## Completed

- Authentication
- Master Profile
- Resume Generation
- LangGraph Workflow
- Template Engine
- PDF Generation
- Resume Vault

## In Progress

- Resume Import

## Planned

- ATS Engine
- Optimization Loop
- Career Integrations

---

# Release Milestones

## MVP

- Authentication
- Master Profile
- AI Resume Generation
- PDF Export
- Resume Vault

Status: ~95% Complete

---

## V1

Adds:

- Resume Import
- ATS Analysis
- Resume Optimization
- Better Templates

---

## V2

Adds:

- Cover Letters
- GitHub Integration
- LinkedIn Integration
- Portfolio Import

---

## V3

Career Operating System

- Interview Prep
- Job Tracking
- Career Analytics
- AI Career Assistant

---

# Guiding Principle

Every new feature must support the core workflow:

Import Profile

↓

Build Master Profile

↓

Paste Job Description

↓

Generate Tailored Resume

↓

Preview

↓

Download PDF

↓

Track & Improve

If a feature does not strengthen this workflow, it should not be prioritized.
