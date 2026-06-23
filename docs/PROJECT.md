# Reunion Registration App — Project Documentation

> **Last updated:** 2026-06-24  
> **Purpose:** A single-page Next.js application for managing registrations for a high school reunion program. All data and labels are in Bangla.

---

## 1. Overview

A public-facing website where alumni can register for a reunion event. The event hosting committee can view and search participant records, edit/delete them (once authenticated as admin), and export the full list to Excel. Admin access is granted manually by the developer via the database; users can submit a request form to ask for admin privileges.

### Current access model

| Action | Public | Authenticated Admin |
|--------|--------|---------------------|
| View participant list | ✅ | ✅ |
| Search / filter | ✅ | ✅ |
| Register new participant | ✅ | ✅ |
| Edit existing record | ❌ | ✅ |
| Delete record | ❌ | ✅ |
| Export Excel | ✅ | ✅ |
| Submit admin request | ✅ (planned) | — |

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router, Turbopack) | 16.2.9 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | v4 |
| Database | PostgreSQL (Neon serverless) | — |
| DB Client | `pg` | 8.22.0 |
| Excel Export | `xlsx` (SheetJS) | 0.18.5 |
| Auth | HMAC-signed cookies + `scrypt` password hashing | Node.js native crypto |

---

## 3. Project File Structure

```
reunion_site/
├── .env.local                        # DATABASE_URL (Neon PG connection string)
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
├── src/
│   ├── lib/
│   │   ├── db.ts                     # PostgreSQL pool (Neon)
│   │   └── auth.ts                   # Session sign/verify, password hash, cookie helpers
│   └── app/
│       ├── layout.tsx                 # Root layout (lang="bn", minimal)
│       ├── globals.css                # Tailwind import + dark theme vars
│       ├── page.tsx                   # Main page — form + table + search + export
│       └── api/
│           ├── init-db/
│           │   └── route.ts          # GET — creates all 3 DB tables
│           ├── participants/
│           │   ├── route.ts          # GET (list), POST (create — public)
│           │   ├── [id]/
│           │   │   └── route.ts      # PUT (update), DELETE — both admin-only
│           │   └── export/
│           │       └── route.ts      # GET — Excel download
│           └── admin/
│               └── login/
│                   └── route.ts      # POST — login with username+password
└── docs/
    └── PROJECT.md                    # This file
```

---

## 4. Database Schema

All tables live in the Neon PostgreSQL database. Run `GET /api/init-db` once to create them.

### 4.1 `reunion_participants`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `UUID` | PK, `gen_random_uuid()` |
| `name` | `TEXT` | NOT NULL |
| `batch` | `INTEGER` | NOT NULL |
| `profession` | `TEXT` | nullable |
| `profession_other` | `TEXT` | nullable |
| `guest_count` | `INTEGER` | DEFAULT 0 |
| `guest_details` | `TEXT` | nullable |
| `contact_phone` | `TEXT` | nullable |
| `contact_email` | `TEXT` | nullable |
| `district` | `TEXT` | nullable |
| `address` | `TEXT` | nullable |
| `notes` | `TEXT` | nullable |
| `special_request` | `TEXT` | nullable |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() |

### 4.2 `admin_users`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `UUID` | PK |
| `username` | `TEXT` | UNIQUE, NOT NULL |
| `password_hash` | `TEXT` | NOT NULL (format: `salt:scrypt_hash_hex`) |
| `is_active` | `BOOLEAN` | DEFAULT TRUE |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() |

### 4.3 `admin_requests` *(schema created, API+UI pending)*

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `UUID` | PK |
| `full_name` | `TEXT` | NOT NULL |
| `email` | `TEXT` | nullable |
| `phone` | `TEXT` | nullable |
| `reason` | `TEXT` | nullable |
| `status` | `TEXT` | DEFAULT 'pending' |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() |

---

## 5. API Routes

### 5.1 `GET /api/init-db`
Creates the `reunion_participants`, `admin_users`, and `admin_requests` tables if they don't exist. Should be called once after deployment.

### 5.2 `GET /api/participants`
Returns all participants ordered by `created_at DESC`. Public.

### 5.3 `POST /api/participants`
Creates a new participant. Public. Accepts JSON body with all participant fields. Returns the created row.

### 5.4 `PUT /api/participants/[id]`
Updates a participant. **Admin only** — returns 401 if no valid session cookie. Accepts JSON body with all fields. Returns the updated row or 404.

### 5.5 `DELETE /api/participants/[id]`
Deletes a participant. **Admin only** — returns 401 if no valid session cookie. Returns `{ success: true }` or 404.

### 5.6 `GET /api/participants/export`
Returns an `.xlsx` file of all participant data with Bangla column headers. Public.

### 5.7 `POST /api/admin/login`
Accepts `{ username, password }`. Verifies against `admin_users` table using `scrypt`. Sets an httpOnly session cookie on success. Returns `{ ok: true }` or 401.

---

## 6. Authentication System (`src/lib/auth.ts`)

| Function | Purpose |
|----------|---------|
| `signSession(session)` | Produces `payload.signature` token string (HMAC-SHA256) |
| `verifySession(value)` | Validates token and returns `AdminSession` or `null` |
| `getCurrentAdmin(request?)` | Reads session cookie, verifies, and checks admin is active in DB |
| `hashPassword(password)` | Returns `salt:scrypt_hash_hex` |
| `verifyPassword(password, storedValue)` | Timing-safe comparison of scrypt hashes |
| `setSessionCookie(username)` | Sets `reunion_admin_session` cookie (httpOnly, 8h expiry) |
| `clearSessionCookie()` | Removes the session cookie |

- Session secret: `process.env.SESSION_SECRET` or falls back to a dev default.
- The login endpoint sets the cookie via `setSessionCookie()`.
- Protected endpoints call `getCurrentAdmin()` and return 401 if `null`.

---

## 7. Frontend (`src/app/page.tsx`)

A single client component (`"use client"`) with the following sections:

### 7.1 Summary Cards
- মোট অংশগ্রহণকারী (total participants)
- মোট অতিথি (total guests — sum of `guest_count`)
- অনুসন্ধান (filtered results count)

### 7.2 Registration / Edit Form
- Fields: name*, batch*, profession dropdown, profession_other, guest_count, guest_details, phone, email, district, address, notes (textarea), special_request (textarea)
- Dropdown options: ডক্টর, ইঞ্জিনিয়ার, ব্যবসায়ী, শিক্ষক, সরকারি চাকুরীজীবি, প্রাইভেট চাকুরীজীবি, ফ্রীল্যান্সার, অভিনয়/সাংস্কৃতিক কর্মী, অন্য
- Submit button toggles between "রেজিস্টার করুন" and "আপডেট করুন" depending on edit mode
- Reset button to cancel editing
- Excel download button

### 7.3 Participant Table
- Searchable by name, batch, profession, district (client-side filter)
- Columns: নাম (+phone), ব্যাচ, পেশা, অতিথি, অ্যাকশন
- Edit button populates the form with the participant's data
- Delete button with confirmation dialog

### 7.4 Known frontend gap
The **edit and delete** buttons are currently visible to all users. The API returns 401 for unauthorized requests, but the UI does not yet:
- Show a login form for unauthenticated users
- Hide edit/delete buttons for non-admins
- Display an admin request form

---

## 8. Environment Variables

| Variable | Purpose | `.env.local` |
|----------|---------|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string | Set (credentials in file) |
| `SESSION_SECRET` | HMAC key for session tokens | Not set (uses dev default) |
| `NODE_ENV` | Set automatically by Next.js | — |

---

## 9. Running the App

```bash
# Install dependencies (already done)
npm install

# Initialize database tables (one-time)
curl http://localhost:3000/api/init-db

# Development server
npm run dev

# Production build
npm run build
npm start
```

### Creating the first admin user (manual, via database)

Connect to the Neon database and insert a row into `admin_users`:

```sql
-- 1. Generate a password hash using Node.js:
--    const { hashPassword } = require('./src/lib/auth');
--    console.log(hashPassword('your-password'));

-- 2. Insert the admin:
INSERT INTO admin_users (username, password_hash) VALUES ('committee', '<hash from step 1>');
```

Then login at `POST /api/admin/login` with `{ "username": "committee", "password": "your-password" }`.

---

## 10. Pending Work

| # | Task | Status |
|---|------|--------|
| 1 | Admin request UI (form on main page) | ❌ Not started |
| 2 | Admin request API (`POST /api/admin/requests`) | ❌ Not started |
| 3 | Login UI component (modal or inline form) | ❌ Not started |
| 4 | Logout endpoint (`POST /api/admin/logout`) | ❌ Not started |
| 5 | Hide edit/delete buttons for non-admins on frontend | ❌ Not started |
| 6 | Show login state in UI (who is logged in) | ❌ Not started |
| 7 | `SESSION_SECRET` set in production `.env.local` | ❌ Not started |
| 8 | Batch-wise statistics / filter by batch | ❌ Not started |
| 9 | Pagination for large participant lists | ❌ Not started |

---

## 11. Design Decisions & Conventions

- **Single-page app:** All UI lives in `page.tsx` as a client component. No multi-page routing needed for this scope.
- **Dark theme:** The UI uses a dark slate palette (`bg-slate-950` base) with amber accents, designed to look polished and premium.
- **Bangla-first:** All labels, headings, button text, and Excel headers are in Bangla. The `html` tag sets `lang="bn"`.
- **Session cookies over JWT:** A simple HMAC-signed cookie avoids JWT complexity. Tokens contain `username:issuedAt` with an HMAC signature.
- **Password hashing:** Uses Node.js native `scryptSync` (64-byte output, 16-byte random salt) with timing-safe comparison.
- **No ORM:** Direct SQL via the `pg` client keeps the project lightweight with zero migrations needed.
- **SSl mode:** Neon requires SSL; the pool is configured with `rejectUnauthorized: false` for compatibility.
- **No gitignore for `.env.local`:** The `.env.local` is tracked in git for development convenience — **move credentials to proper secret management before production.**

---

## 12. How to Resume with an LLM

When continuing with a new AI session, provide the LLM with:
1. This entire `docs/PROJECT.md` file
2. The contents of `src/lib/db.ts`, `src/lib/auth.ts`, and `src/app/page.tsx`
3. The API route files in `src/app/api/`
4. State: "The auth system and protected API routes exist. We need to add the frontend login UI, admin request form, and conditionally show edit/delete based on auth state. Also need to add a logout endpoint."

The next implementation priority is items 1-6 from the pending work section above.
