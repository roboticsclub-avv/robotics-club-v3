# Robotics Club Website 3.0

# Future Fixes Backlog

Status:
Deferred

Purpose:
These fixes are intentionally postponed because they do not block the current migration roadmap.

They should be implemented in appropriate future phases.

---

# Fix 1

## Convert Provider Files to JSX

Current:

src/providers/

- AuthProvider.js
- ThemeProvider.js
- AlertProvider.js

Recommended:

src/providers/

- AuthProvider.jsx
- ThemeProvider.jsx
- AlertProvider.jsx

Reason:

- Better React conventions
- Easier component recognition
- Improves maintainability

Priority:

Low

Suggested Phase:

P3 or later

---

# Fix 2

## Persist Theme Store

Current:

Theme state exists only in memory.

Current Store:

src/lib/theme-store.js

Required:

- Zustand persist middleware
- localStorage persistence
- theme restoration on refresh

Benefits:

- Theme survives browser refresh
- Better UX

Priority:

Medium

Suggested Phase:

Theme System Implementation

---

# Fix 3

## Production Firebase Admin Validation

Current:

src/lib/firebase/admin.js

contains fallback initialization:

```js
admin.initializeApp({
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
});
```

Required Before Production:

Fail build/startup if:

- FIREBASE_ADMIN_PRIVATE_KEY missing
- FIREBASE_ADMIN_CLIENT_EMAIL missing
- FIREBASE_ADMIN_PROJECT_ID missing

Reason:

Avoid silent production failures.

Priority:

High

Suggested Phase:

Pre-Deployment

---

# Fix 4

## Add Middleware Layer

Create:

src/middleware.js

Purpose:

Future route protection:

- /dashboard
- /member

Potential Usage:

- Session validation
- Auth checks
- Role checks
- Redirect handling

Priority:

Medium

Suggested Phase:

Authentication Hardening

---

# Fix 5

## Add Utility Expansion Layer

Current:

src/utils/

- constants.js
- formatters.js

Future Additions:

- generateMemberId.js
- validationHelpers.js
- dateHelpers.js
- roleHelpers.js

Priority:

Low

Suggested Phase:

Business Logic Migration

---

# Fix 6

## Schema Validation Upgrade

Current:

Plain JS schema definitions.

Future:

Migrate to Zod.

Target:

src/schemas/

Benefits:

- Runtime validation
- Type safety
- Cleaner API validation

Priority:

Medium

Suggested Phase:

API Hardening

---

# Fix 7

## Alert Store Improvements

Current:

Basic Promise-based alerts.

Future:

Add:

- Toast notifications
- Success notifications
- Error notifications
- Loading notifications

Priority:

Medium

Suggested Phase:

UI Polish

---

# Fix 8

## Theme Cookie Synchronization

Current:

ThemeProvider uses client-side updates.

Future:

Synchronize:

- localStorage
- cookies
- server rendering

Benefits:

Prevents theme flash during hydration.

Priority:

Medium

Suggested Phase:

Theme System Implementation

---

# Fix 9

## Package Audit

Review currently installed packages:

- three
- @react-three/fiber
- @react-three/drei
- @splinetool/react-spline
- motion
- lenis
- maath

Verify:

- actually used
- tree-shakeable
- version compatibility

Remove unused dependencies.

Priority:

Low

Suggested Phase:

Performance Optimization

---

# Fix 10

## Folder Naming Standardization

Current:

Mixed usage:

- .js
- .jsx

Future:

Standardize:

Components → .jsx

Hooks → .js

Stores → .js

Utilities → .js

Schemas → .js

Priority:

Low

Suggested Phase:

Code Cleanup

---

# Fix 11

## Environment Validation Layer

Create:

src/lib/env.js

Responsibilities:

Validate:

- Firebase Client Keys
- Firebase Admin Keys
- EmailJS Keys

Fail early if configuration invalid.

Priority:

High

Suggested Phase:

Pre-Deployment

---

# Fix 12

## Error Monitoring Preparation

Future Integration:

Choose one:

- Sentry
- LogRocket
- OpenReplay

Purpose:

Track:

- Runtime crashes
- API failures
- Authentication issues

Priority:

Low

Suggested Phase:

Production Monitoring

---

# Fix 13

## Role Expansion Framework

Current:

admin
member

Future:

- technical
- ops
- data
- secretary

Do NOT implement until:

- Phase 1 migration complete
- Dashboard stable

Priority:

Deferred

Suggested Phase:

Admin Platform v2

---

# Fix 14

## Team Collaboration Automation

Future:

Add:

- PR templates
- Issue templates
- CODEOWNERS file
- Branch protection rules

Priority:

Low

Suggested Phase:

Project Governance

---

# Fix 15

## Firebase Security Review

Before production launch:

Review:

- Firestore rules
- Role checks
- API permissions
- Token validation

Perform security audit.

Priority:

Critical

Suggested Phase:

Production Readiness Review