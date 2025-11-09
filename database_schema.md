# 🗄️ Go Trippin’ – Database Schema (Supabase)

## Overview
- **Provider:** Supabase (PostgreSQL + Auth + Storage)  
- **Purpose:** Centralized user authentication, profile management, and future trip storage  
- **Auth:** Managed via Supabase Auth schema (`auth.users`)  
- **Storage:** Used for user avatars (`avatars` bucket)

---

## 📦 Schemas

### 1. `auth.users`
Supabase-managed system table.  
Contains all core authentication & identity fields.

| Column | Type | Nullable | Notes |
|--------|------|-----------|-------|
| `id` | `uuid` | ❌ | Primary key (referenced by `profiles.id`) |
| `email` | `varchar` | ✅ | User email |
| `role` | `varchar` | ✅ | Auth role (default “authenticated”) |
| `phone` | `text` | ✅ | Optional phone |
| `created_at` | `timestamptz` | ✅ | Created date |
| `last_sign_in_at` | `timestamptz` | ✅ | Latest login |
| `raw_user_meta_data` | `jsonb` | ✅ | Supabase metadata (includes name, avatar, etc.) |
| `email_confirmed_at` | `timestamptz` | ✅ | Email verification timestamp |
| `is_anonymous` | `boolean` | ❌ | Default false |

🔒 **Managed by Supabase** — do not modify directly.

---

### 2. `public.profiles`
Custom app table. Extends `auth.users` with user-facing profile data.

| Column | Type | Nullable | Description |
|--------|------|-----------|-------------|
| `id` | `uuid` | ❌ | FK → `auth.users.id` |
| `display_name` | `text` | ✅ | User’s name |
| `avatar_color` | `text` | ✅ | Randomly assigned or user-chosen |
| `avatar_url` | `text` | ✅ | Supabase Storage path (e.g. `/avatars/<userId>.png`) |
| `preferred_lng` | `text` | ✅ | `en` or `bg` |

**Relationships:**
- One-to-one with `auth.users` (shared ID).
- Used for profile rendering and editing in `/user`.

**RLS Policies (recommended):**
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own profile"
ON profiles FOR ALL
USING (auth.uid() = id);
```

---

### 3. 🖼️ Storage Buckets
| Bucket | Purpose | Public? | Path Pattern |
|--------|----------|---------|--------------|
| `avatars` | Stores user profile images | ✅ | `/avatars/<userId>.png` |

**Usage Flow:**
- Frontend uploads via Supabase SDK (`supabase.storage.from('avatars').upload(...)`)
- URL stored in `profiles.avatar_url`
- Render via `publicURL()` or signed URL.

---

### 4. 🚧 Planned Tables (not yet created)
| Table | Purpose | Core Fields |
|--------|----------|-------------|
| `trips` | Stores user-created trips | `id`, `user_id`, `title`, `destination`, `start_date`, `end_date`, `image_url`, `created_at` |
| `activities` | Per-trip activities | `id`, `trip_id`, `type`, `title`, `notes`, `timestamp` |
| `expenses` | Trip cost tracking | `id`, `trip_id`, `amount`, `category`, `note`, `created_at` |

---

### 5. 🔐 Environment Variables

| Key | Description |
|-----|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public client key |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin key (for NestJS) |

---

### 6. 🧩 Integration Summary

| Layer | How It Uses Supabase |
|-------|----------------------|
| **Frontend** | Uses SDK for login/signup (`useSupabaseAuth`), profile CRUD, avatar upload |
| **Backend (NestJS)** | Uses Supabase Admin Client for privileged ops, trip CRUD |
| **Shared Core** | Zod schemas mirror DB fields for validation |
| **Storage** | Avatar uploads & retrieval |
| **Auth** | Supabase-managed tokens + JWT verification in backend |
