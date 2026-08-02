# UI Flow

# DataDock

> User Journey & Screen Flow Documentation

---

## Document Information

| Field | Value |
|--------|-------|
| Product | DataDock |
| Version | 1.0 |
| Status | Final |
| Owner | Rajat Pandey |
| Related Documents | 01-PRD.md, 02-FRONTEND_ARCHITECTURE.md, 03-DESIGN_SYSTEM.md |

---

# 1. Product Navigation

The application is divided into two experiences.

## Public Experience

- Landing Page
- Features
- Pricing
- About
- Login
- Register

---

## Authenticated Experience

- Dashboard
- Files
- Folders
- Shared
- Starred
- Storage
- Trash
- Profile
- Settings
- Billing

---

# 2. Public User Flow

Landing Page
    ↓
Explore Features
    ↓
View Pricing
    ↓
Sign Up
    ↓
Email Verification
    ↓
Login
    ↓
Dashboard

---

# 3. Authentication Flow

Landing Page
    ↓
Register
    ↓
Email Verification
    ↓
Login
    ↓
Dashboard

Alternative

Landing Page
    ↓
Continue with Google
    ↓
Dashboard

Alternative

Landing Page
    ↓
Continue with GitHub
    ↓
Dashboard

Forgot Password

Login
    ↓
Forgot Password
    ↓
Enter Email
    ↓
Verify OTP
    ↓
Create New Password
    ↓
Login

---

# 4. Dashboard Flow

Dashboard Home

Contains

- Storage Overview
- Quick Upload
- Recent Files
- Recent Folders
- Activity Summary
- Upgrade Card

Navigation

Dashboard
    ↓
Files
    ↓
Folders
    ↓
Storage
    ↓
Shared
    ↓
Trash
    ↓
Settings

---

# 5. File Management Flow

Dashboard
    ↓
Files
    ↓
Upload File
    ↓
Upload Progress
    ↓
Upload Complete
    ↓
File Appears

Available Actions

Preview

Rename

Download

Move

Copy

Delete

Favorite

Share

---

# 6. Folder Management Flow

Dashboard
    ↓
Folders
    ↓
Create Folder
    ↓
Open Folder
    ↓
Nested Folder
    ↓
Upload Files

Folder Actions

Rename

Delete

Move

Share

---

# 7. Search Flow

Search Bar
    ↓
Live Suggestions
    ↓
Results
    ↓
Open File

Filters

Type

Date

Size

Recent

---

# 8. Sharing Flow

Select File
    ↓
Share
    ↓
Generate Link

Options

Public Link

Private Link

Password Protected

Expiration Date

Copy Link

---

# 9. Subscription Flow

Dashboard
    ↓
Storage Limit
    ↓
Upgrade Plan
    ↓
Pricing
    ↓
Checkout
    ↓
Subscription Active

---

# 10. Settings Flow

Settings

Sections

- Profile
- Security
- Appearance
- Notifications
- Connected Accounts
- Billing

---

# 11. Common UI States

Every screen should include appropriate states.

Loading

Skeleton Components

Empty

Illustration + Helpful CTA

Error

Friendly Error Message

Success

Toast Notification

Confirmation

Modal Dialog

---

# 12. Screen Inventory

## Public

Landing Page

Features

Pricing

About

Login

Register

Forgot Password

Verify Email

404

---

## Dashboard

Dashboard Home

Files

Folders

Folder Details

Shared

Starred

Storage

Trash

Profile

Settings

Billing

---

## Modals

Upload File

Create Folder

Rename

Delete Confirmation

Share File

Upgrade Plan

Preview File

---

## Drawers

Notifications

User Menu

Quick Upload

---

## Global Components

Navbar

Sidebar

Breadcrumb

Search

Command Palette (Future)

Footer

Toast

Loader

Empty State

Skeleton

Modal

Dropdown

Context Menu