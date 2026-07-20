# Design System

## Design Philosophy

CVPilot follows a clean, minimal interface inspired by:

- Claude
- Apple
- Linear
- Vercel

The UI should feel calm, premium, fast, and distraction-free.

Every screen should prioritize content over decoration.

---

# Core Principles

- Minimal UI
- Maximum whitespace
- Consistent spacing
- Smooth animations
- Fast interactions
- Accessible by default

---

# Theme

Primary Theme:

Light

Dark Mode:

Supported later with the same design language.

---

# Color Palette

Primary:

- Black
- White

Accent:

- Blue

Success:

- Green

Warning:

- Yellow

Error:

- Red

Neutral:

- Gray scale

Avoid excessive gradients.

Avoid flashy colors.

---

# Typography

Use a modern sans-serif font.

Hierarchy:

H1

Page titles

H2

Section titles

H3

Card titles

Body

Normal text

Caption

Helper text

Always prioritize readability.

---

# Layout

Maximum content width:

1280px

Spacing:

Use an 8px spacing system.

Examples:

8
16
24
32
40
48
64

Avoid inconsistent spacing.

---

# Components

## Buttons

Variants:

- Primary
- Secondary
- Ghost
- Destructive

Buttons should:

- Have clear hover states
- Loading state
- Disabled state

---

## Cards

Rounded corners

Soft border

Light shadow

Large padding

Cards should never feel cramped.

---

## Inputs

Rounded

Clean

Simple

Support:

- Validation
- Helper text
- Error state

---

## Dialogs

Centered

Minimal

No unnecessary animations

Easy keyboard dismissal

---

## Sidebar

Persistent

Collapsible

Minimal icons

Current page clearly highlighted.

---

## Navigation

Simple hierarchy.

Avoid nested navigation.

Maximum 2 levels.

---

# Dashboard

Should answer:

"What should I do next?"

Display:

- Resume history
- Recent activity
- Suggestions
- Quick actions

Avoid unnecessary charts.

---

# Master Profile

Organize into clear sections.

Examples:

- Personal
- Experience
- Projects
- Skills
- Education
- Certificates
- Achievements

Each section should support:

- Add
- Edit
- Delete
- Reorder

---

# Resume Studio

Main workspace.

Contains:

- Job Description
- Company Details
- Template Selection
- Resume Preview
- PDF Preview

Generation should feel like a workflow.

---

# Workflow Page

Display live progress.

Show:

- Current step
- Completed steps
- Errors
- Duration
- Token usage

Stop polling after completion.

---

# Resume Preview

Three tabs:

- Visual
- LaTeX
- PDF

Switching tabs should be instant.

---

# Resume Vault

Grid/List toggle.

Each resume card displays:

- Company
- Role
- Template
- Date
- ATS Score (future)

Actions:

- View
- Download
- Duplicate
- Delete

---

# Empty States

Every page should have meaningful empty states.

Examples:

"No resumes generated yet."

"Import your profile to get started."

Always include a primary action.

---

# Loading States

Never leave blank screens.

Use:

- Skeleton loaders
- Progress indicators
- Step updates

Avoid spinning loaders for long tasks.

---

# Notifications

Use toast notifications.

Categories:

- Success
- Error
- Warning
- Info

Keep messages concise.

---

# Animations

Fast.

Subtle.

150–250ms.

Avoid excessive motion.

---

# Icons

Use a single icon library.

Icons should always support text.

Never rely on icons alone.

---

# Accessibility

Support:

- Keyboard navigation
- Focus states
- Screen readers
- Proper contrast
- Semantic HTML

---

# Mobile

Responsive by default.

Desktop-first.

Support tablets.

Critical flows must work on mobile.

---

# Resume Design

Professional.

ATS-friendly.

No graphics.

No unnecessary colors.

Readable in print.

One page by default.

Maximum two pages for experienced users.

---

# Future Design Goals

- Dark mode
- Multiple themes
- Custom branding
- Premium templates
- Accessibility improvements

---

# User Experience Goals

The product should feel:

- Fast
- Professional
- Intelligent
- Reliable
- Minimal

Every interaction should reduce effort, not increase it.

If a feature adds complexity without improving user value, it should not be implemented.
