# CVPilot - Product Requirements Document (PRD)

Version: 1.0

Status: Living Document

Owner: CVPilot

---

# 1. Vision

CVPilot is an AI-powered Career Operating System that helps software engineers create highly tailored, ATS-optimized resumes for every job application with minimal manual effort.

Unlike traditional resume builders, CVPilot maintains a permanent Master Profile and generates company-specific resumes on demand using AI.

The goal is to eliminate repetitive resume editing while maximizing interview conversion.

---

# 2. Mission

Help engineers spend less time editing resumes and more time getting interviews.

Every resume should feel handcrafted for the target company while remaining completely truthful to the user's experience.

---

# 3. Product Philosophy

CVPilot is NOT another resume builder.

Traditional resume builders:

- Edit one resume repeatedly
- Lose versions
- Manual copy/paste
- Static templates

CVPilot:

- Stores one complete Master Profile
- AI selects only relevant information
- Generates unlimited tailored resumes
- Maintains version history
- Produces deterministic PDF output
- Optimizes for ATS

---

# 4. Core Principles

## One Source of Truth

The Master Profile stores everything.

Every resume is generated from the Master Profile.

Users never edit generated resumes directly.

---

## AI Assists

AI helps users.

AI never fabricates.

AI rewrites.

AI prioritizes.

AI optimizes.

The user remains in control.

---

## Deterministic Rendering

AI generates structured JSON.

AI never generates LaTeX.

AI never generates HTML.

Templates are responsible for formatting.

---

## Version Everything

Every resume generation creates a new version.

Nothing is overwritten.

Users can always return to previous versions.

---

# 5. Target Users

Primary Users

- Software Engineers (0–7 YOE)
- Students
- New Graduates

Secondary Users

- Senior Engineers
- Engineering Managers
- Tech Leads

Future Users

- Product Managers
- Designers
- Data Scientists
- DevOps Engineers

---

# 6. User Problems

Current resume creation suffers from:

- Editing resumes repeatedly
- Maintaining multiple versions
- Forgetting achievements
- Missing keywords
- ATS rejection
- Poor formatting
- Manual tailoring
- Lost history

CVPilot solves these problems.

---

# 7. User Journey

## Step 1

Sign in using Google.

---

## Step 2

Create Master Profile.

Users can:

- Import Resume
- Import LinkedIn
- Enter manually

---

## Step 3

Paste Job Description.

Optionally choose:

- Company
- Target Role
- Template

---

## Step 4

AI analyzes:

- Resume
- Skills
- Projects
- Experience
- Job Description

---

## Step 5

LangGraph generates structured resume JSON.

---

## Step 6

Template Engine renders LaTeX.

---

## Step 7

PDF is generated.

---

## Step 8

Resume saved into Resume Vault.

---

# 8. Product Features

## Authentication

Google OAuth only.

No passwords.

No email verification.

JWT authentication.

Session persistence.

---

## Master Profile

Stores complete career history.

Sections:

- Personal Information
- Summary
- Social Links
- Experience
- Projects
- Skills
- Education
- Certificates
- Achievements
- Languages

The Master Profile is never optimized.

It remains exhaustive.

---

## Resume Import

Supported:

- PDF
- DOCX

Future:

- LinkedIn
- GitHub
- Portfolio Website
- JSON

---

## Resume Generation

Input:

Master Profile

-

Job Description

Output:

Generated Resume JSON

---

## Resume Vault

Stores:

- Generated Resume
- PDF
- LaTeX
- JSON
- Version History

Every generation becomes a new version.

---

## Templates

Multiple professional templates.

Examples:

- Modern
- Classic
- Jake
- Professional

Switching templates never calls AI.

Only rerenders.

---

## PDF Generation

Pipeline:

Generated Resume

↓

Template Engine

↓

LaTeX

↓

XeLaTeX

↓

PDF

↓

S3

---

## Resume Preview

Supports:

- Live Preview
- LaTeX View
- PDF Preview

---

## Settings

Google Account

Profile Settings

Preferences

Future Billing

---

# 9. Resume Philosophy

Master Profile

↓

AI selects only relevant content

↓

Generated Resume

The generated resume should never contain everything.

Default:

0–7 YOE

One Page

7+ YOE

Maximum Two Pages

Selection Rules

Experience

Top 3–4

Projects

Top 2–3

Skills

Top 12–15

Certificates

Only relevant

Achievements

Best 2–3

---

# 10. AI Philosophy

The AI must:

Understand the job.

Understand the company.

Understand the user.

Rewrite content.

Prioritize relevance.

Never fabricate.

Never invent.

Never exaggerate.

Never generate fake experience.

---

# 11. ATS Philosophy

ATS score should not be random.

Score should be calculated using:

Keyword Match

Skill Match

Experience Match

Formatting

Readability

Section Completeness

Action Verbs

Quantification

Recommendations should explain exactly why points were lost.

---

# 12. Template Philosophy

Templates own formatting.

AI owns content.

Template Engine owns layout.

PDF Generator owns rendering.

These responsibilities never overlap.

---

# 13. Import Philosophy

Users should never need to manually enter their entire career history.

Supported imports:

Resume

LinkedIn

Future:

GitHub

Portfolio

LeetCode

JSON

Every import goes through review before saving.

---

# 14. Success Metrics

Primary

Resume generation success rate

PDF generation success rate

Average generation time

Interview conversion improvement

Secondary

Resume imports

Daily active users

Resume versions created

Retention

---

# 15. Performance Goals

Authentication

< 1 second

Resume Generation

20–45 seconds

Template Switching

< 1 second

PDF Generation

< 5 seconds

Resume Preview

Instant

---

# 16. Security

Google OAuth

JWT

HTTPS

Input validation

Prisma parameterized queries

S3 private storage

Presigned URLs

No plaintext secrets

Rate limiting

Audit logging

---

# 17. Non Functional Requirements

Scalable

Modular

Type-safe

Observable

Testable

Maintainable

Cloud-ready

Provider-agnostic AI

Deterministic rendering

---

# 18. Current Tech Stack

Frontend

- React
- TanStack Start
- TanStack Router
- TanStack Query
- TailwindCSS

Backend

- Express
- Prisma
- PostgreSQL (Neon)

AI

- LangGraph
- OpenRouter

Storage

- AWS S3

Rendering

- XeLaTeX

Authentication

- Google OAuth

---

# 19. Future Roadmap

Near Term

- ATS Engine
- Optimization Loop
- Resume Import
- LinkedIn Import

Mid Term

- Cover Letters
- LinkedIn Optimization
- GitHub Import
- Portfolio Import

Long Term

- Interview Preparation
- Career Analytics
- Job Tracker
- Career Operating System

---

# 20. Out of Scope

The following are NOT part of the MVP:

- Job Board
- Resume Marketplace
- Social Network
- Recruiter CRM
- Applicant Tracking System
- Team Collaboration

These may be considered in future versions.

---

# 21. Product Success Definition

CVPilot succeeds when:

A software engineer can sign in, import their career history once, paste any job description, and receive a professionally formatted, truthful, ATS-friendly, company-specific PDF resume in under one minute without manually editing their resume.

That is the core promise of CVPilot.

---
