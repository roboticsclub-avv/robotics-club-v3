# Robotics Club AVV — Website V3.0

## 🚀 Version 3.0 — Production-Grade Upgrade

Built on the foundation of V2 (Next.js 16 + React 19 + Supabase), V3 introduces major improvements in security, SEO, error handling, and developer experience — while preserving the exact V2 UI.

---

## ✅ What's New in V3

| Feature | V2 | V3 |
|---|---|---|
| Admin writes | Direct client-side Supabase | **Secure API routes (server-side)** |
| Error handling | None | **`error.js`, `not-found.js`, Error Boundary** |
| Loading states | Manual spinners | **Route-level `loading.js` skeletons** |
| SEO | Basic title only | **Full OpenGraph, Twitter Cards, robots.txt, sitemap.xml** |
| Font loading | Google CDN | **`next/font` (optimized, no FOUT)** |
| Tailwind fonts | Hardcoded strings | **CSS variable mapping via `tailwind.config.js`** |
| Static export | `output: 'export'` (API routes broken) | **Node.js server mode (API routes enabled)** |

---

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19 + Tailwind CSS + CSS Modules
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Email**: EmailJS
- **3D**: Spline (`scene.splinecode`)

---

## ⚙️ Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
Copy `.env.local.example` to `.env.local` and fill in your values:
```
NEXT_PUBLIC_SUPABASE_URL=https://eeseizfyjbuleedynhlx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Run development server
```bash
npm run dev
```

---

## 🗄️ Database Tables

All tables exist in the Supabase project (`eeseizfyjbuleedynhlx`):

| Table | Purpose |
|---|---|
| `users` | Member applications and profiles |
| `events` | Club events |
| `hardware` | Hardware inventory items |
| `allocations` | Hardware lending records |
| `core_team` | Team members shown on homepage |
| `settings` | Site configuration (e.g. `is_recruiting`) |

SQL schema files are in the `/sql` directory.

---

## 🔐 Security Architecture (V3)

Admin write operations are protected by **Next.js API routes** that:
1. Verify the caller's Supabase session token
2. Check the caller has `role = 'admin'` in the database
3. Use the **Service Role Key** (server-side only) to perform privileged operations

| Operation | V2 | V3 |
|---|---|---|
| Accept/Reject applicants | Client writes directly | `/api/applicants/update-status` |
| Delete applicants | Client writes directly | `/api/applicants/delete` |

---

## 🚢 Deployment

Deploy to **Vercel** (recommended) or any Node.js host.

> ⚠️ **Do NOT deploy to GitHub Pages** — V3 removed `output: 'export'` to enable API routes. Static hosts are not compatible.

```bash
npm run build
npm run start
```
