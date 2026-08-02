# Claude Development Guidelines

# DataDock

> AI Development Instructions

---

# Purpose

This document provides permanent instructions for Claude Design and Claude Code while working on the DataDock project.

Claude should treat this document as the primary development guide before generating designs or writing code.

If this document conflicts with a prompt, ask for clarification instead of making assumptions.

---

# Project Overview

DataDock is a premium desktop-inspired cloud storage SaaS.

Tagline:

> Store smarter. Organize beautifully.

The application focuses on:

- Beautiful user experience
- Productivity
- Performance
- Simplicity
- Modern SaaS design

The goal is not to recreate Google Drive.

The goal is to build an original premium cloud storage platform.

---

# Read These Documents First

Before generating any UI or code, always understand the following documents in order:

1. 01-PRD.md
2. 02-FRONTEND_ARCHITECTURE.md
3. 03-DESIGN_SYSTEM.md
4. 04-UI_FLOW.md

Do not begin implementation until these documents are understood.

---

# Tech Stack

Framework

- Next.js (App Router)

Language

- JavaScript

Styling

- Tailwind CSS

UI Components

- shadcn/ui

Animation

- Framer Motion
- GSAP

Icons

- Lucide React

Theme

- next-themes

Forms

- React Hook Form

HTTP Client

- Axios

Notifications

- Sonner

---

# UI Philosophy

The interface should feel like a premium desktop application.

Design Inspiration

Primary

- Raycast

Motion Inspiration

- Trionn

Secondary

- Linear
- Vercel
- Notion

These are references only.

Never copy layouts, branding, or assets.

Create an original design language.

---

# UI Development Rules

Always:

- Build reusable components.
- Keep components modular.
- Maintain consistent spacing.
- Follow the design system.
- Use semantic HTML.
- Keep layouts responsive.
- Use meaningful component names.

Never:

- Duplicate code.
- Hardcode unnecessary values.
- Use inconsistent spacing.
- Introduce random colors.
- Add unnecessary dependencies.
- Build large monolithic components.

---

# Component Rules

Prefer:

- Small reusable components.
- Composition over large components.
- Shared UI where possible.

Each component should have one responsibility.

---

# Animation Rules

Landing Page

Use:

- GSAP
- Framer Motion

Dashboard

Use:

- Framer Motion

Animation should:

- Guide attention.
- Improve usability.
- Feel premium.
- Remain performant.

Never animate for decoration alone.

---

# External Libraries

Primary

- shadcn/ui

Additional libraries may be used when they improve the experience:

- Magic UI
- ReactBits
- Aceternity UI
- Motion Primitives
- Origin UI

Every imported component should be customized to match the DataDock design language.

Never copy another product directly.

---

# Code Quality

Write production-ready code.

Avoid placeholders.

Avoid fake content.

Avoid TODO comments unless requested.

Use meaningful naming.

Organize files cleanly.

Keep components readable.

---

# Responsiveness

Support:

- Mobile
- Tablet
- Laptop
- Desktop

No broken layouts.

No horizontal scrolling.

---

# Accessibility

Follow accessibility best practices.

Include:

- Semantic HTML
- Keyboard navigation
- Focus states
- Proper labels
- Sufficient contrast

---

# Performance

Prioritize:

- Fast rendering
- Lazy loading where appropriate
- Optimized images
- Efficient animations

Never sacrifice performance for visual effects.

---

# When Designing

Before generating a screen:

- Understand the user goal.
- Follow the PRD.
- Follow the UI Flow.
- Follow the Design System.

Design should be consistent across all pages.

---

# When Writing Code

Before coding:

- Understand the screen.
- Break the UI into reusable components.
- Reuse existing components before creating new ones.

Code should be easy to maintain and extend.

---

# If Requirements Are Unclear

Do not guess.

Instead:

- Explain the ambiguity.
- Suggest reasonable options.
- Wait for confirmation if the decision affects architecture or user experience.

---

# Definition of Done

A feature is complete only if it is:

- Functional
- Responsive
- Accessible
- Reusable
- Consistent
- Visually polished
- Production-ready

---

# Project Goal

The final product should feel like a modern SaaS built by a professional product team.

Every decision should support the DataDock philosophy:

> Store smarter. Organize beautifully.