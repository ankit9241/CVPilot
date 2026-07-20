# Architecture

## Overview

CVPilot follows a feature-first modular architecture with strict separation of concerns.

```
Frontend (TanStack Start)
        │
        ▼
Backend API (Express)
        │
        ▼
Services (Business Logic)
        │
        ▼
Repositories
        │
        ▼
Prisma ORM
        │
        ▼
PostgreSQL (Neon)
```

External Services:

- Google OAuth
- OpenRouter (LLM)
- AWS S3
- XeLaTeX

---

# Folder Structure

```
frontend/
backend/

backend/src/
    modules/
    common/
    ai/
    templates/
    pdf/
    prisma/
    database/
```

Every feature lives inside its own module.

Example:

```
profile/
    controller
    service
    repository
    dto
    routes
    types
```

---

# Backend Layers

## Controller

- Handles HTTP
- Validation
- Response mapping

No business logic.

---

## Service

Contains all business logic.

Responsible for:

- Resume generation
- Profile management
- Template rendering
- ATS (future)

---

## Repository

Only talks to Prisma.

No business logic.

---

## AI Module

Completely isolated.

Never imports:

- Express
- Prisma
- Controllers
- Services

Input:

ResumeContext

Output:

GeneratedResume

---

# Resume Generation Flow

```
Master Profile
        │
        ▼
ResumeContext Builder
        │
        ▼
LangGraph
        │
        ▼
LLM
        │
        ▼
GeneratedResume JSON
        │
        ▼
Template Engine
        │
        ▼
LaTeX
        │
        ▼
XeLaTeX
        │
        ▼
PDF
        │
        ▼
S3
        │
        ▼
Resume Vault
```

---

# AI Responsibilities

AI only:

- Reads ResumeContext
- Understands Job Description
- Selects relevant content
- Rewrites professionally
- Returns structured JSON

AI never:

- Generates HTML
- Generates LaTeX
- Generates PDFs
- Accesses database

---

# Template Engine

Input:

GeneratedResume

Output:

Rendered LaTeX

Templates contain:

- metadata.json
- mapping.ts
- template.tex

Changing templates never calls the LLM.

---

# PDF Engine

Responsible for:

- Compile LaTeX
- Generate PDF
- Upload to S3
- Update ResumeVersion

Nothing else.

---

# Master Profile

Stores complete career history.

Includes:

- Personal Info
- Experience
- Projects
- Skills
- Education
- Certificates
- Achievements
- Social Links

Never optimized.

---

# Generated Resume

Generated resume is always a subset of the Master Profile.

Default limits:

- 1 page (≤7 YOE)
- 2 pages (>7 YOE)

---

# Resume Vault

Each generation creates a ResumeVersion.

Stores:

- JSON
- LaTeX
- PDF
- Template
- Company
- Target Role
- Tokens
- Model
- Generation Date

Nothing is overwritten.

---

# Authentication

- Google OAuth only
- JWT authentication
- Refresh token support

No password login.

---

# Database

PostgreSQL (Neon)

Prisma ORM

Feature-first repositories.

Soft deletes where applicable.

---

# Storage

AWS S3

Stores:

- PDFs
- Uploaded resumes

Uses presigned URLs.

---

# LLM

Provider-agnostic.

Current:

OpenRouter

Future:

- OpenAI
- Claude
- Gemini
- Groq

Switch provider via environment variables.

---

# Design Principles

- Feature-first architecture
- Composition over inheritance
- Thin controllers
- Fat services
- Repository pattern
- Strict TypeScript
- Deterministic rendering
- AI generates content only
- Templates own formatting

---

# Future Modules

- ATS Engine
- Optimization Loop
- Cover Letter Generator
- LinkedIn Optimizer
- GitHub Import
- Portfolio Import
- Interview Preparation

---

# Goal

A user should:

1. Sign in
2. Build or import Master Profile
3. Paste a Job Description
4. Generate a tailored resume
5. Download a professional PDF

Everything else supports this workflow.
