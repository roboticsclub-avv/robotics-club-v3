# Phase PH1 - Environment Validation Layer Report

This report documents the implementation of the centralized Environment Validation Layer (PH1) for the Robotics Club Website 3.0.

---

## 1. Files Created & Modified

### Files Created:
1. **[env.js](file:///c:/Hackathons/robotics-club-v3/current-v1/src/lib/env.js)**: Centralized source of truth for environment variable configuration and validation logic.

### Files Modified:
1. **[client.js](file:///c:/Hackathons/robotics-club-v3/current-v1/src/lib/firebase/client.js)**: Consumes config from `env.js` and calls explicit client environment checks.
2. **[admin.js](file:///c:/Hackathons/robotics-club-v3/current-v1/src/lib/firebase/admin.js)**: Consumes config from `env.js` and calls explicit server environment checks.
3. **[mail.js](file:///c:/Hackathons/robotics-club-v3/current-v1/src/lib/mail.js)**: Consumes EmailJS key configuration from `env.js`.
4. **[.env.example](file:///c:/Hackathons/robotics-club-v3/.env.example)**: Updated to include placeholders and descriptions for the newly validated EmailJS keys.

---

## 2. Environment Audit Table

Below is the complete audit of environment variables used across the `src/` codebase:

| Variable Name | File Location | Purpose | Required/Optional |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `src/lib/firebase/client.js` | Firebase Client configuration initialization | **Required** |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `src/lib/firebase/client.js` | Firebase Client configuration initialization | **Required** |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `src/lib/firebase/client.js`, `src/lib/firebase/admin.js` | Firebase Client/Admin fallback initialization | **Required** |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `src/lib/firebase/client.js` | Firebase Client configuration initialization | **Required** |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `src/lib/firebase/client.js` | Firebase Client configuration initialization | **Required** |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `src/lib/firebase/client.js` | Firebase Client configuration initialization | **Required** |
| `FIREBASE_ADMIN_PROJECT_ID` | `src/lib/firebase/admin.js` | Firebase Admin SDK initialization | **Required** (Server-only) |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | `src/lib/firebase/admin.js` | Firebase Admin SDK initialization | **Required** (Server-only) |
| `FIREBASE_ADMIN_PRIVATE_KEY` | `src/lib/firebase/admin.js` | Firebase Admin SDK initialization | **Required** (Server-only) |
| `EMAILJS_PUBLIC_KEY` / `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY` | `src/lib/mail.js` | EmailJS browser SDK initialization | **Required** (Server-only check) |
| `EMAILJS_SERVICE_ID` / `NEXT_PUBLIC_EMAILJS_SERVICE_ID` | `src/lib/mail.js` | EmailJS service selection | **Required** (Server-only check) |
| `EMAILJS_TEMPLATE_ID` / templates | `src/lib/mail.js` | EmailJS template mapping | **Required** (Server-only check) |
| `NEXT_PUBLIC_BASE_PATH` | `src/components/...` | Optional path routing prefix for deployments | *Optional* |
| `NEXT_PUBLIC_SUPABASE_URL` | `src/lib/supabase.js` | Supabase URL endpoint configuration | *Excluded from PH1* |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `src/lib/supabase.js` | Supabase Anon Key configuration | *Excluded from PH1* |

---

## 3. Validation Architecture

To prevent silent failures at build or runtime while respecting Next.js's split client/server execution environments:

```
                  [ Entry Points: client.js / admin.js ]
                                    │
                                    ▼ (Explicit Call)
                       [ validateEnvironment() ]
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼ (Client Context)                  ▼ (Server Context)
         Validate:                           Validate:
         - Firebase Client Keys              - Firebase Client Keys
                                             - Firebase Admin Keys
                                             - EmailJS Keys
```

- **Centralized Map**: `env.js` aggregates and structures environment variables. Components import `env` from `src/lib/env.js` instead of directly accessing `process.env`.
- **Environment Distinction**:
  - **Client-side (`typeof window !== 'undefined'`)**: The validation layer only checks client-accessible `NEXT_PUBLIC_FIREBASE_*` variables.
  - **Server-side (`typeof window === 'undefined'`)**: The validation layer checks all keys: Firebase Client, Firebase Admin private keys, and EmailJS keys (which can be prefixed or prefix-less).

---

## 4. Development vs. Production Behavior

### Development Mode (`NODE_ENV !== 'production'`)
- **Behavior**: Warning.
- **Action**: When variables are missing, the validation layer prints a warning with a detailed diagnostics table to `console.warn`. The application does not crash, allowing offline development or setup debugging.

### Production Mode (`NODE_ENV === 'production'`)
- **Behavior**: Hard Failure.
- **Action**: The validation layer throws a descriptive error immediately. This aborts page prerendering during builds or halts dynamic route processing at runtime, preventing silent partial deployments.

---

## 5. Risks Discovered & Mitigated

- **Prerendering Failures**: If server-side configurations are validated on client-side compilation, builds will fail statically.
  *Mitigation*: Kept secret keys validation strictly wrapped inside server-only checks.
- **Prefix-less vs. Prefixed EmailJS Variables**: Existing code relied on prefixing (e.g., `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY`), whereas requirements specified prefix-less names (`EMAILJS_PUBLIC_KEY`).
  *Mitigation*: The validation checks both naming formats, resolving to whichever is defined, and reports missing only if neither is present.

---

## 6. Testing Results

### A. Missing Required Variables in Production
Running `npm run build` with missing environment configurations correctly threw the following error:
```bash
Generating static pages using 3 workers (0/8) ...
Error occurred prerendering page "/_not-found".
Error: [CRITICAL ERROR] Missing required environment variables:

=========================================
ENVIRONMENT VALIDATION DIAGNOSTICS
=========================================
Status: FAILED (Production Hard Failure)
Context: Server-side
Environment: production

Missing Required Variables:
 - [MISSING] NEXT_PUBLIC_FIREBASE_API_KEY
 - [MISSING] NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
 ...
 - [MISSING] FIREBASE_ADMIN_PRIVATE_KEY
 - [MISSING] EMAILJS_TEMPLATE_ID

Optional Variables:
 - NEXT_PUBLIC_BASE_PATH: Not configured (Using default: '')
=========================================
```
The build process exited immediately with code `1`.

### B. Confirmed Configuration Present
When all required variables were supplied (via temporary `.env` file), running `npm run build` compiled successfully without any errors:
```bash
▲ Next.js 16.1.6 (Turbopack)
- Environments: .env

  Creating an optimized production build ...
✓ Compiled successfully in 29.4s
✓ Generating static pages using 3 workers (8/8) in 1950.5ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /dashboard
├ ○ /event
├ ○ /join-us
├ ○ /login
└ ○ /member
```
