# Phase S2 - Final Architecture Specification
## Robotics Club Website 3.0 — Architecture Freeze Document

This document is the official target architecture freeze specification for the Robotics Club Website 3.0. It integrates the functional business logic and Firestore database schemas from Version 1 with the Next.js App Router and visual styles of Version 2, while addressing architectural cleanups, provider structures, role models, helper hooks, schema validations, and team collaboration workflows.

---

## Revision 1 — Error Architecture Cleanup

In the Next.js App Router paradigm, custom static page routes for error handling (such as `app/error/page.js` or `app/not-found/page.js`) are redundant and break framework conventions. 

Next.js automatically captures and handles layout-level runtime crashes and missing route signals natively using specialized file names placed in route directories.

### App Router Error Standards
*   **`error.js` (Root Error Boundary)**: Acts as a React Error Boundary wrapping children nodes. Next.js automatically renders this page when an unhandled runtime error is thrown, passing down `error` and `reset` callbacks to retry execution.
*   **`not-found.js` (Route Fallback)**: Automatically rendered when a route is not defined in the folder tree, or when `notFound()` is invoked inside client/server page loaders.

### Cleaned Routing Structure
The redundant `/error` and `/not-found` folder directories are completely removed. The layout delegates all handlers to standard root error boundaries:

```
src/app/
├── globals.css
├── layout.js
├── page.js
├── error.js         # Core Global App Runtime Error Boundary
└── not-found.js     # Core Global 404 Route Fallback
```

---

## Revision 2 — Provider Layer Architecture

To prevent provider bloat inside Root Layouts and manage state context variables, V3 introduces a dedicated provider layer located at `src/providers/`.

```
[ Root Layout: app/layout.js ]
       └── [ AuthProvider ]
             └── [ ThemeProvider ]
                   └── [ AlertProvider ]
                         └── [ Page Components ]
```

### Provider Responsibilities & Data Scopes

1.  **`AuthProvider`**
    *   *Responsibility*: Tracks active client logins, resolves Firestore profile details, and exposes auth states to components.
    *   *Data Ownership*: Authenticated User object (UID, email) and user profile details (role, status, memberId).
    *   *Initialization Point*: Client-side mount, using Firebase Client SDK's `onAuthStateChanged`.
    *   *Dependency Chain*: Depends on `src/lib/firebase/client.js` and `src/lib/firebase/auth.js`.
2.  **`ThemeProvider`**
    *   *Responsibility*: Injects theme selector tags (`theme-cosmic`, `theme-aurora`, `theme-deepspace`) on root DOM layout elements.
    *   *Data Ownership*: Selected theme value string.
    *   *Initialization Point*: Client-side mount reading `localStorage`, matching the server-side cookie applied to the `<html>` tag.
    *   *Dependency Chain*: Depends on `src/lib/theme-store.js` (Zustand theme store).
3.  **`AlertProvider`**
    *   *Responsibility*: Listens to state signals and manages visibility updates for the global alert module.
    *   *Data Ownership*: Active popup configurations (type configurations, title headers, message details, action promises).
    *   *Initialization Point*: Renders `GlobalAlertContainer` at the bottom of the layout structure.
    *   *Dependency Chain*: Depends on `src/lib/alert-store.js` (Zustand alert store).

---

## Revision 3 — Firebase Layer Refactor

To cleanly separate operational responsibilities and secure admin tasks, client and server modules are organized under a single directory `src/lib/firebase/`.

```
               [ Client Configs ]                  [ Service Accounts / Keys ]
                       │                                       │
                       ▼                                       ▼
           [ src/lib/firebase/client.js ]        [ src/lib/firebase/admin.js ]
                  /            \                               │
                 ▼              ▼                              ▼
  [ firebase/auth.js ]    [ firebase/firestore.js ]     [ Next.js API Routes ]
         │                       │                             │
         ▼                       ▼                             ▼
  [ AuthProvider ]         [ Client Hooks ]             [ Secure DB Writes ]
```

### File Responsibilities & Scopes

1.  **`client.js`**
    *   *Responsibility*: Initializes the Firebase Client application.
    *   *Imports*: `initializeApp` from `"firebase/app"`.
    *   *Dependency Flow*: Consumed by `auth.js` and `firestore.js`.
2.  **`admin.js`**
    *   *Responsibility*: Initializes the Firebase Admin SDK securely for backend API Route Handlers.
    *   *Imports*: `initializeApp`, `cert`, `getApps` from `"firebase-admin/app"`, `"firebase-admin/auth"`, `"firebase-admin/firestore"`.
    *   *Dependency Flow*: Exposes initialized auth and db systems exclusively to server endpoints (`src/app/api/...`).
3.  **`auth.js`**
    *   *Responsibility*: Exposes Firebase Client Auth functions (login, logout, registration) and state listeners.
    *   *Imports*: `getAuth` from `"firebase/auth"`, `client.js`.
    *   *Dependency Flow*: Consumed by `src/providers/AuthProvider` and client pages (`/login`, `/join-us`).
4.  **`firestore.js`**
    *   *Responsibility*: Exposes Firebase Client Firestore handles.
    *   *Imports*: `getFirestore` from `"firebase/firestore"`, `client.js`.
    *   *Dependency Flow*: Consumed by client hooks and components for real-time reads.

---

## Revision 4 — Dashboard Role Simplification

### Evaluation against V1
V1 maps users to two operational roles: `admin` (access to dashboard.html) and `member` (redirect to index.html). Implementing the multiple roles defined in the V2 reference database (`admin`, `technical`, `ops`, `data`, `secretary`) in V3 Phase 1 introduces premature complexity, increasing verification checks before the baseline migration is stable.

### V3 Phase 1 Recommendation
*   **Operational Principle**: Maintain V1's simplified security model.
*   **Role Setup**: Standardize on two operational roles: `admin` and `member`.
*   **Dashboard Access Gate**: Restrict the `/dashboard` route exclusively to users with `role: 'admin'`. The admin will have full visibility across all operational dashboard tabs (Applicants, Events, Inventory, Allocations).
*   **Portal Access Gate**: Restrict `/member` portal access to standard members with `status: 'accepted'`.

### Future Role Expansion Plan
*   **Phase 2 Rollout**: Defer granular role permissions until Phase 1 functional migration is completed.
*   **Dynamically Mapped Tabs**: In Phase 2, map dashboard tabs dynamically to roles via a role-to-tab configuration object:
    ```javascript
    const DASHBOARD_TABS = {
      applicants: { roles: ['admin'] },
      inventory:  { roles: ['admin', 'data'] },
      events:     { roles: ['admin', 'ops'] },
      allocations: { roles: ['admin', 'data'] }
    };
    ```

---

## Revision 5 — Hooks Architecture

Custom React hooks inside `src/hooks/` abstract Firebase interactions and state stores from UI page components.

### V3 Hook Catalog

1.  **`useAuth`**
    *   *Purpose*: Accesses current user information and authorization state from `AuthProvider`.
    *   *Inputs*: None.
    *   *Outputs*: `user` (auth object), `profile` (Firestore document data), `loading` (boolean), `isAdmin` (boolean), `logout` (function).
    *   *Consumers*: `Navbar.jsx`, `/dashboard`, `/member` pages.
2.  **`useTheme`**
    *   *Purpose*: Wraps theme toggling, selection hooks, and saves current values to Zustand store.
    *   *Inputs*: None.
    *   *Outputs*: `currentTheme` (string), `setTheme` (function), `themes` (array of strings).
    *   *Consumers*: `ThemeSwitcher.jsx` UI button toggler.
3.  **`useEvents`**
    *   *Purpose*: Fetches event listing records from API endpoints or real-time Firestore client query.
    *   *Inputs*: Optional query criteria (e.g. `limit`, `upcomingOnly`).
    *   *Outputs*: `events` (array), `loading` (boolean), `error` (string), `refresh` (function).
    *   *Consumers*: `Events.jsx` homepage slider, `/event` landing pages.
4.  **`useAllocations`**
    *   *Purpose*: Fetches hardware allocation records for the logged-in member.
    *   *Inputs*: `memberId` (string).
    *   *Outputs*: `allocations` (array), `loading` (boolean), `error` (string).
    *   *Consumers*: `MemberHub` component, profile dropdowns.

---

## Revision 6 — Validation and Schema Layer

V3 establishes standard schema models inside `src/schemas/` to govern data shapes before they are written to Firestore.

### Required Schema Definitions

*   **`user.schema.js`**: Restricts profile configurations:
    ```javascript
    {
      name: String, email: String, phone: String, branch: String,
      year: String, section: String, interests: String, reason: String,
      role: 'member' | 'admin', status: 'pending' | 'accepted' | 'rejected', memberId: String
    }
    ```
*   **`event.schema.js`**: Validates event details:
    ```javascript
    {
      title: String, date: String, comingSoon: Boolean, image: String, description: String, link: String
    }
    ```
*   **`inventory.schema.js`**: Validates hardware details:
    ```javascript
    {
      name: String, category: String, totalQuantity: Number, availableQuantity: Number, image: String
    }
    ```
*   **`allocation.schema.js`**: Validates loan operations details:
    ```javascript
    {
      userId: String, userName: String, memberId: String, itemId: String, itemName: String, expectedReturn: String, status: 'issued' | 'returned'
    }
    ```

### Schema Rationale & API Validation Strategy
*   **Data Integrity**: Client validations check user input errors dynamically, while server validation shields database updates against unauthorized structures.
*   **Future Zod compatibility**: Structures schemas as standard declarative configurations, which can easily be replaced by Zod validation schemas (`z.object({...}).parse()`) in future phases.
*   **Validation Flow**: Before executing database writes, API handlers validate request payloads against matching schemas. Rejects requests with `400 Bad Request` if payload validation checks fail.

---

## Revision 7 — Migration Dependency Reordering

To ensure dependency safety, minimize staging breakage, and prevent developer conflicts, the migration order is re-prioritized:

```
[ Step 1: Firebase SDK & Schemas ] ➔ Config lib/firebase SDKs, correct rules files, configure env keys.
                │
                ▼
[ Step 2: Global Providers & CSS ] ➔ Create src/providers/, globals.css tokens, layout wrappers.
                │
                ▼
[ Step 3: Auth & Identity Gate API ] ➔ Login pages layout, verify auth hooks, /api/register APIs.
                │
                ▼
[ Step 4: Recruitment Wizard ] ➔ React implementation of V1 Typeform steps recruitment wizard.
                │
                ▼
[ Step 5: Member Portal page ] ➔ Client allocations table reads, user details dashboard.
                │
                ▼
[ Step 6: Admin Dashboard Core ] ➔ Modular component tabs, verification check middleware.
                │
                ▼
[ Step 7: Admin CRUD API routes ] ➔ CRUD routes for events, inventory, and hardware allocations.
                │
                ▼
[ Step 8: Visual Polish & SEO ] ➔ Spline 3D viewport observing, typewriter tagline, gallery lightbox.
```

### Dependency Reasoning
1.  **Firebase & Schemas First**: Setting up client/server SDK configurations and schemas establishes the data interface that all subsequent modules (Auth, Portal, Dashboard) depend on.
2.  **Global Providers Second**: Wrapping layouts in CSS variables and providers ensures that migrated page components have immediate access to themes and auth contexts.
3.  **Auth Before Pages**: Developing the `/login` routes and auth hooks early unblocks access control testing on protected routes (/dashboard, /member).
4.  **Dashboard UI before Dashboard CRUD**: Visualizing tab pages allows developers to verify layouts before writing database transaction routes.

---

## Revision 8 — Team Collaboration Architecture

To enable parallel progress between Platform Engineer (Shashwat) and Experience Engineer (Nishanth) with minimal merge conflicts, we establish a structured branch and directory boundary strategy:

### Operational Layout Boundaries
*   **Shashwat (Platform Engineer)**: Focuses on server-side logic and integrations.
    *   *Path Scope*: `src/lib/firebase/`, `src/app/api/`, `src/schemas/`, `firestore.rules`.
*   **Nishanth (Experience Engineer)**: Focuses on user interface, layouts, and styles.
    *   *Path Scope*: `src/components/`, `src/providers/`, `src/hooks/`, `src/app/globals.css`.

### Git Workflow Rules

1.  **Branch Strategy**:
    *   `main`: Protected production branch (requires clean build tests, no direct commits).
    *   `staging`: Integration staging branch. Feature branches merge into `staging` via PRs.
2.  **PR Merging Rules**:
    *   Each PR must focus on a single phase (e.g. `feature/p3-auth-gate`).
    *   PRs require 1 code review approval from the other engineer before merging.
3.  **Conflict Prevention Workflow**:
    *   *No Cross-Edits*: Do not edit files outside assigned layout boundaries without prior coordination.
    *   *Frequent Syncing*: Pull updates from `staging` into local branches daily to resolve potential conflicts early.
    *   *Static Mocking*: Share mock data JSON files (`src/data/`) so UI components can be built and styled before database APIs are fully integrated.

---

## Revision 9 — Architecture Freeze Checklist

Before coding begins, the following technical components must be approved and locked:

### Verification Checklist

*   [ ] **Firebase Layer**:
    *   Is `src/lib/firebase/client.js` isolated from `src/lib/firebase/admin.js`?
    *   Are the correct Firestore security rules mapped to `/inventory/{hwId}`?
*   [ ] **API Layer**:
    *   Do administrative API routes enforce token verification using headers?
    *   Are the database payload structures mapped to the validation schemas?
*   [ ] **Routing**:
    *   Are the redundant `/error` and `/not-found` folder directories removed?
    *   Are the App Router root boundaries (`error.js` and `not-found.js`) configured?
*   [ ] **Component Architecture**:
    *   Are UI components (modals, alerts, popups) separated from page layouts?
    *   Is the V1 Typeform-style split layout wizard experience confirmed for recruitment?
*   [ ] **Theme System**:
    *   Are theme variables configured as CSS tokens?
    *   Is selection persistence configured via session cookies to prevent style flash?
*   [ ] **Dashboard Scope**:
    *   Is access strictly restricted to the `admin` role for Phase 1?
*   [ ] **Migration Order**:
    *   Is the dependency migration sequence verified?
