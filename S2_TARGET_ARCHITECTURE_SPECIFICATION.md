# Phase S2 - Target Architecture Specification

This document defines the final target architecture for the Robotics Club Website Version 3.0. It integrates the functional components and Firestore schemas from Version 1 with the modern Next.js App Router framework, styling principles, and performance models of Version 2, while completely removing Supabase dependencies.

---

## Section 1 — Final Folder Structure

The V3 codebase follows a unified Next.js App Router directory layout. All development will occur under `/current-v1` (which becomes the main repository root post-migration), while preserving standard workspace targets.

```
robotics-club-v3/
├── public/                         # Public static files
│   ├── media/                      # Ported V1 images (logos, student photos)
│   │   ├── logo.png
│   │   ├── desai.png
│   │   ├── Shashwat.jpg
│   │   ├── Yashashwini.jpeg
│   │   ├── Rithvik.jpeg
│   │   ├── Nishanth.jpeg
│   │   ├── Thaslim.jpg
│   │   └── Charitha.jpeg
│   ├── scene.splinecode            # 3D robot model from V2
│   ├── backgrounds/                # Video files and decorative assets
│   └── favicon.ico
└── src/
    ├── app/                        # App Router pathways
    │   ├── api/                    # Server-side API Route Handlers
    │   │   ├── register/           # POST registration endpoint
    │   │   │   └── route.js
    │   │   ├── applicants/         # Applicants status/role/delete APIs
    │   │   │   ├── update-status/
    │   │   │   │   └── route.js
    │   │   │   ├── update-role/
    │   │   │   │   └── route.js
    │   │   │   └── delete/
    │   │   │       └── route.js
    │   │   ├── events/             # Events CRUD API
    │   │   │   └── route.js
    │   │   ├── inventory/          # Inventory CRUD API
    │   │   │   └── route.js
    │   │   └── allocations/        # Allocation Issue/Return API
    │   │       └── route.js
    │   ├── dashboard/              # Admin dashboard layout and page
    │   │   ├── page.js
    │   │   └── layout.js
    │   ├── member/                 # Member portal page
    │   │   └── page.js
    │   ├── event/                  # Events listings view
    │   │   ├── page.js
    │   │   └── [id]/               # Dynamic event detail pages
    │   │       └── page.js
    │   ├── join-us/                # Typeform-style recruitment form
    │   │   └── page.js
    │   ├── login/                  # Credentials sign-in page
    │   │   └── page.js
    │   ├── error/                  # Error route fallback
    │   │   └── page.js
    │   ├── not-found/              # 404 route fallback
    │   │   └── page.js
    │   ├── globals.css             # Main styling, resets, keyframe animation variables
    │   ├── layout.js               # Root layout, Google fonts definition
    │   ├── error.js                # React global error boundaries
    │   └── not-found.js            # Next.js global not found boundary
    ├── components/                 # Page layouts and structural components
    │   ├── Navbar.js               # Main glass header with user account profile options
    │   ├── Hero.js                 # 3D Spline load-wrapper, fallback, typewriter animations
    │   ├── About.js                # About section
    │   ├── Projects.js             # Project spotlight cards
    │   ├── Training.js             # Flip card training modules
    │   ├── Events.js               # Dynamic homepage events slider
    │   ├── Gallery.js              # Masonry layout with lightbox modal overlay
    │   ├── Team.js                 # Team details with overlay triggers
    │   └── Footer.js               # Global footer menu
    ├── components/ui/              # Atomic reusable UI components
    │   ├── AlertPopup.jsx          # Local action overlay modal
    │   ├── GlobalAlertContainer.jsx# Global state-subscribed alert modal
    │   ├── ThemeSwitcher.jsx       # Theme toggle selector dropdown
    │   └── SkeletonLoader.jsx      # Generic loading placeholders
    ├── lib/                        # State stores, database scripts, configurations
    │   ├── firebase.js             # Client Firebase Web SDK initializations
    │   ├── firebase-admin.js       # Server Firebase Admin SDK initializations
    │   ├── alert-store.js          # Zustand store for alerts and confirmations
    │   ├── theme-store.js          # Zustand store for selected styling variables
    │   └── mail.js                 # Client-side EmailJS integration logic
    └── data/                       # Static JSON files (team portfolios, configs)
```

---

## Section 2 — Final Route Structure

### Frontend Pages (Client-Rendered Views)
*   **`/`** (Home Page): Serves public information. Loads dynamic modules and triggers session intros.
*   **`/login`**: Sign-in page. Evaluates role and status claims to select redirect pathways.
*   **`/join-us`**: Interactive steps wizard. Bypasses automatic login during auth registrations.
*   **`/dashboard`**: Protected Admin dashboard. Dynamically displays component control tabs.
*   **`/member`**: Protected Member portal. Displays account data and active allocations.
*   **`/event/[id]`**: Dynamic detail layout mapping specific events from Firestore.
*   **`/error`**: Critical error fallback interface.
*   **`/not-found`**: Custom 404 signal-lost screen.

### Backend Endpoints (Server API Route Handlers)
*   **`POST /api/register`**: Creates Firebase Authentication credentials and saves the user profile under `users/{uid}` in Firestore.
*   **`POST /api/applicants/update-status`**: Restricts updates to Admins. Sets application state to accepted or rejected, generates member IDs (`RC-XXXX`), and initiates status notification emails.
*   **`POST /api/applicants/update-role`**: Updates member role classifications.
*   **`POST /api/applicants/delete`**: Deletes applicant profile documents from Firestore.
*   **`GET/POST/PUT/DELETE /api/events`**: CRUD operations on the `events` collection.
*   **`GET/POST/PUT/DELETE /api/inventory`**: CRUD operations on the `inventory` collection.
*   **`GET/POST/PUT /api/allocations`**: Handles hardware allocations. Updates `availableQuantity` in the target hardware document using transaction-safe increments.

---

## Section 3 — Final Component Structure

V3 structures components into two distinct tiers: **Main Components** (coordinating sections and layouts) and **UI Components** (reusable atomic nodes).

```
[ Root Layout (globals.css, Fonts) ]
  ├── [ Navbar ] ➔ ProfileDropdown (Avatar lookup, allocations monitor)
  ├── [ GlobalAlertContainer ] ➔ Connected via Zustand alert-store
  ├── [ Main Body Pages ]
  │     ├── [ Home / ] ➔ [ Loader (Intro session) ]
  │     │                ➔ [ Hero (Spline canvas, cube fallback, typewriter) ]
  │     │                ➔ [ About ]
  │     │                ➔ [ Projects ( spotlight cards) ]
  │     │                ➔ [ Training ( flip modules) ]
  │     │                ➔ [ Events ( dynamic list) ]
  │     │                ➔ [ Gallery ( masonry layout, image lightbox modal) ]
  │     │                ➔ [ Team ( modals) ]
  │     ├── [ Join Us /join-us ] ➔ [ RecruitmentWizard ] (step slides flow, cards select)
  │     ├── [ Dashboard /dashboard ] ➔ [ DashboardTabs ] 
  │     │                               ├── ApplicantsTab ( review)
  │     │                               ├── EventsTab ( forms & lists)
  │     │                               ├── InventoryTab ( hardware logs)
  │     │                               └── AllocationsTab ( lending & returns search)
  │     └── [ Member Portal /member ] ➔ [ MemberHub ] (points check, loan table)
  └── [ Footer ]
```

---

## Section 4 — Final Firebase Architecture

### Firestore Collections

1.  **`users`**
    *   `uid` (string, doc ID)
    *   `email` (string)
    *   `name` (string)
    *   `phone` (string)
    *   `branch` (string)
    *   `year` (string)
    *   `section` (string)
    *   `interests` (string)
    *   `reason` (string)
    *   `role` (string): `'member'` | `'admin'`
    *   `status` (string): `'pending'` | `'accepted'` | `'rejected'`
    *   `memberId` (string): `'PENDING'` | `'RC-XXXX'`
    *   `createdAt` (string, ISO-8601)
2.  **`events`**
    *   Document ID (auto-generated)
    *   `title` (string)
    *   `date` (string)
    *   `comingSoon` (boolean)
    *   `image` (string, URL)
    *   `description` (string)
    *   `link` (string, URL)
    *   `createdAt` (string, ISO-8601)
    *   `updatedAt` (string, ISO-8601)
3.  **`inventory`**
    *   Document ID (auto-generated)
    *   `name` (string)
    *   `category` (string)
    *   `totalQuantity` (number)
    *   `availableQuantity` (number)
    *   `image` (string, URL, optional)
    *   `createdAt` (serverTimestamp)
    *   `updatedAt` (serverTimestamp)
4.  **`allocations`**
    *   Document ID (auto-generated)
    *   `userId` (string)
    *   `userName` (string)
    *   `memberId` (string)
    *   `itemId` (string)
    *   `itemName` (string)
    *   `expectedReturn` (string, date)
    *   `status` (string): `'issued'` | `'returned'`
    *   `issuedAt` (serverTimestamp)
    *   `returnedAt` (serverTimestamp, optional)

### Client vs Server SDK Responsibilities
*   **Firebase Client Web SDK**: Initialized at `src/lib/firebase.js`. It manages authentication state checks (`onAuthStateChanged`) and reads public information (such as homepage events and the gallery).
*   **Firebase Admin SDK**: Initialized at `src/lib/firebase-admin.js`. Restricts writing database actions (accept/reject status controls, updates, deletions) to secure API routes.

### Firestore Rules Correction
Corrects the mismatch in V1 rules by mapping rules directly to the `/inventory` collection path:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    match /users/{userId} {
      allow read: if request.auth != null && (request.auth.uid == userId || isAdmin());
      allow create: if request.auth != null && request.auth.uid == userId && request.resource.data.role == 'member' && request.resource.data.status == 'pending';
      allow update, delete: if isAdmin();
    }
    match /events/{eventId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /inventory/{hwId} { // Mismatch fixed: Changed /hardware to /inventory
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
    match /allocations/{allocationId} {
      allow read: if request.auth != null && (request.auth.uid == resource.data.userId || isAdmin());
      allow write: if isAdmin();
    }
  }
}
```

---

## Section 5 — Final API Architecture

V3 uses Next.js App Router API routes, checking credentials securely on the server before database write operations.

```
[ Client Request ] ➔ Include Bearer <idToken> in Authorization Header
                         │
                         ▼
             [ V3 API Route Handler ]
                         │
                         ▼
             [ Firebase Admin SDK ] ➔ Verify token and check Firestore role
                         │
                ┌────────┴────────┐
                ▼ (Valid Admin)   ▼ (Invalid / Member)
           [ Firestore ]      [ Return 403 Forbidden ]
         Execute DB Action
```

### Flow of Verification
1.  **Authorization Header Check**: Clients query API endpoints with headers format: `Authorization: Bearer <idToken>`.
2.  **Auth Token Decryption**: API routes decode tokens via the Admin SDK:
    ```javascript
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;
    ```
3.  **Permissions Match Check**: API routes look up user records (`users/{uid}`) to verify administrative credentials (`role === 'admin'`).
4.  **Database Write execution**: On verification, API routes execute Firestore changes (such as approvals or event deletions) and return standard success or error JSON payloads.

---

## Section 6 — Theme Architecture

### Styling Strategy
*   **Core CSS Layout**: Uses global variables configured inside `src/app/globals.css`, combined with CSS modules (`*.module.css`) to define styling boundaries on specific pages.
*   **Tailwind Base Classes**: Leverages utility class structures for responsive layouts.

### Dynamic Theme Toggles
*   Themes are applied via dynamic classes (`theme-cosmic`, `theme-aurora`, `theme-deepspace`) injected into the root `<html>` tag.
*   **Cosmic Premium**: Dark purple base, neon orange highlight glows, futuristic interface variables.
*   **Aurora Light**: Soft white background theme, aurora light green gradients, dark text variables.
*   **Deep Space**: Dark space backdrop, bright cyan highlights, high-contrast border styles.

### Selection Persistence
*   User theme preferences are saved in `localStorage` on the client, and set in a session cookie. Next.js Root Layout reads the cookie to apply the matching theme class during server rendering, preventing layout shift or flashing on page loads.

---

## Section 7 — Authentication Architecture

*   **Authentication Provider**: A client-side Context (`AuthProvider`) wraps the root application layout. It monitors changes via `onAuthStateChanged` and updates global authentication states.
*   **Client Routes protection**:
    *   `/dashboard`: Protected page route. Displays checking animations while loading. Redirects to `/login` if credentials do not match admin roles.
    *   `/member`: Verifies user profile state. Redirects to `/login` if `status !== 'accepted'`.
    *   `/login` / `/join-us`: Redirects authenticated users to home or profile portal routes.
*   **Server Actions protection**: Handles token extraction and verifies identity credentials before executing backend transactions.

---

## Section 8 — Dashboard Architecture

The dashboard adapts role-based access to limit page components based on user roles:

| Access Role | Available Tabs | Permission Scope |
| :--- | :--- | :--- |
| **Admin** | Applicants, Team, Events, Inventory, Allocations | Full write permission, approves applicants, modifies roles, deletes items. |
| **Technical** | Core Team, Inventory | Updates team details and views hardware specs. |
| **Ops** | Event Management | Full event publishing and update controls. |
| **Data** | Hardware Inventory, Allocations | Catalog entries, issues hardware, updates return logs. |
| **Secretary** | Core Team | Views logs and coordinates team notes. |

---

## Section 9 — State Management Architecture

### Evaluation: Context API vs Zustand

*   **Context API**: Built-in React solution. Avoids external dependencies, but causes re-renders across all child components when parent contexts update. In Next.js, it requires wrapping components in Client Providers.
*   **Zustand**: Lightweight, decoupled state manager. High performance, restricts updates strictly to components subscribing to changed keys, and exposes access tools outside React contexts (such as in standalone Javascript files).

### Chosen Solution: Zustand
Zustand is chosen as the standard state manager for V3.

### Choice Rationale
1.  **Store Decoupling**: Global configuration states (such as active alerts, loaders, and user preferences) are stored in modular stores (e.g. `alert-store.js`, `theme-store.js`). This allows them to be updated directly from standard helper functions without React Provider trees.
2.  **Optimized Rendering**: Subscribing to specific keys prevents child elements from re-rendering on unrelated state changes (for example, updating theme variables does not re-render the global alert container).
3.  **Next.js Alignment**: Fits Next.js App Router conventions by maintaining lightweight client states while allowing pages to render on the server.

---

## Section 10 — Migration Dependencies

The diagram below outlines the build order and dependencies for the migration phases:

```
[ Step 1: Base Config ] ➔ Initial setup, Next.js root layout, Tailwind configs, SDK initializers.
        │
        ▼
[ Step 2: Global Styling ] ➔ Design tokens variables, Global alert states, Theme wrappers.
        │
        ▼
[ Step 3: Auth & APIs ] ➔ Login pages, verify state hooks, basic API route authentication.
        │
        ▼
[ Step 4: Join Us Wizard ] ➔ React implementation of V1 Typeform steps recruitment wizard.
        │
        ▼
[ Step 5: Member Portal ] ➔ Portal routes (/member), allocations table, points display.
        │
        ▼
[ Step 6: Admin Dashboard ] ➔ Tab modules (ApplicantsTab, EventsTab, InventoryTab, AllocationsTab).
        │
        ▼
[ Step 7: Visual Polish ] ➔ Spline 3D loader, typewriter tagline, masonry gallery with lightbox.
        │
        ▼
[ Step 8: SEO & Deploy ] ➔ Metadata definitions, sitemaps, production builds deployment.
```

---

## Section 11 — Future Expansion Strategy

The V3 architecture lays the foundation for future platforms:

### Member Portal
*   **Interactive Booking**: Allows members to request hardware loans directly from the portal, creating pending allocations for admins to review.
*   **Points Logs**: Tracks participation points, meeting attendances, and project contributions.
*   **Project Workspace**: Allows members to submit project profiles, upload image assets, and catalog development logs.

### Advanced Dashboard
*   **Analytics Control**: Renders charts summarizing hardware inventory status, return deadlines, and membership branch stats.
*   **Automated Audit Engine**: Automatically checks return deadlines and generates reminders for overdue items.
*   **Notification Integration**: Supports webhooks to post notifications directly to Discord or Slack channels on action events.

### Team Collaboration Platform
*   **Rosters Schedule**: Shared event calendars and workspace meeting trackers.
*   **Task Boards**: Lightweight task allocation boards to assign project sub-tasks to members.
