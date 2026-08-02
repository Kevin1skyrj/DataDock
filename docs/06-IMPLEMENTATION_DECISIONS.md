# Implementation Decisions

# DataDock

> Implementation Decisions Before Frontend Development

---

## Purpose

This document answers the implementation questions raised during the project review.

These decisions should be treated as the source of truth during frontend implementation.

The objective is to eliminate ambiguity before any code is written.

---

# 1. Current Project Status

The current repository originally started as a backend learning project.

It contains:

- A basic Next.js frontend.
- A simple Express.js backend.
- Basic CRUD operations.

The existing backend is **not** the final DataDock backend.

It was created only for learning Node.js fundamentals.

The current focus of the project is **frontend development only**.

The backend will be rebuilt properly later while learning from the Node.js Backend course by Procodrr (Anurag Singh).

Therefore:

- Ignore the current backend architecture.
- Do not use the existing CRUD implementation as the final architecture.
- Build the frontend as if it will later connect to a production backend.

---

# 2. Frontend Folder Structure

Keep the existing project structure.

Do not remove the `src` directory.

Use:

client/
└── src/
    ├── app/
    ├── components/
    ├── hooks/
    ├── services/
    ├── lib/
    ├── utils/
    ├── constants/
    ├── providers/
    ├── styles/
    └── assets/

This matches the existing alias configuration and requires no unnecessary changes.

---

# 3. Frontend First

The implementation order is fixed.

Phase 1

- Landing Page
- Authentication UI
- Dashboard UI

Only after the entire frontend is complete will backend development begin.

Do not implement backend logic during frontend development.

Use mock data wherever necessary.

---

# 4. Design Source of Truth

The finalized Claude Design is the visual source of truth.

Implementation should match the design as closely as possible.

Extract directly from the design:

- Colors
- Typography
- Border Radius
- Shadows
- Spacing
- Component Dimensions
- Motion Style

Do not invent new design tokens.

---

# 5. Authentication

MVP Authentication

- Email Registration
- Email OTP Verification
- Login
- Forgot Password (OTP Based)
- Google Login

GitHub Login is not part of MVP.

It can be added in a future version.

---

# 6. Password Reset

Password reset will use:

Email OTP Verification

Flow

Forgot Password

↓

Enter Email

↓

Receive OTP

↓

Verify OTP

↓

Create New Password

↓

Login

This keeps the experience consistent with account verification.

---

# 7. Canonical Terminology

Use:

Starred

Do not use:

Favorites

Use "Starred" consistently for:

- Navigation
- Routes
- Icons
- Documentation
- Components

---

# 8. Dashboard Structure

Use one unified file browser.

Folders are part of the file hierarchy.

Use breadcrumbs for navigation.

Avoid separate top-level "Folders" functionality.

---

# 9. Theme

Dark Mode

Primary Experience

Light Mode

Secondary Experience

Users should be able to switch themes.

---

# 10. Accent Colors

Allow users to customize accent colors.

Default Accent

Blue

Additional Themes

- Purple
- Teal

Future Themes

Can be added later.

---

# 11. State Management

No global state management library will be introduced initially.

Start with:

- React Context
- Local Component State

Introduce Zustand only if a real requirement appears during development.

Avoid unnecessary complexity.

---

# 12. Payments

The project will use:

Razorpay

However, payment implementation is outside the current frontend scope.

Only build the UI.

---

# 13. API Layer

Backend APIs are not implemented yet.

Create a clean services layer.

Use mock services until the real backend is developed.

Keep components independent of API implementation.

---

# 14. Development Order

Build in this exact order.

1. Project Foundation
2. Shared Components
3. Theme System
4. Landing Page
5. Authentication
6. Dashboard Layout
7. Dashboard Pages
8. Responsive Pass
9. Accessibility Pass
10. Performance Pass

---

# 15. Backend Plan

The current backend is temporary.

After completing the frontend:

- Learn backend from the Procodrr course.
- Build a new production-ready backend.
- Replace mock services with real APIs.
- Integrate authentication.
- Integrate MongoDB.
- Integrate AWS S3.
- Integrate Redis.
- Integrate Razorpay.

Frontend architecture should make this transition straightforward.

---

# 16. Root CLAUDE.md

Create a root-level `CLAUDE.md`.

Its purpose is to ensure Claude Code automatically loads the project instructions in every session.

---

# Final Instruction

During frontend development:

- Do not redesign the UI.
- Follow the finalized Claude Design.
- Follow the project documentation.
- Keep components reusable.
- Keep the architecture clean.
- Explain implementation decisions when requested.

The goal is to build a production-quality frontend that will later integrate with a custom backend developed as part of the learning process.