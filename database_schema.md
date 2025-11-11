# 🗄️ Go Trippin’ – Database Schema (Supabase)

## Overview
- **Provider:** Supabase (PostgreSQL + Auth + Storage)  
- **Purpose:** Centralized user authentication, profile management, and trip storage  
- **Auth:** Managed via Supabase Auth schema (`auth.users`)  
- **Storage:** Used for user avatars (`avatars` bucket) and trip images (`trip-images` bucket)

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
| `trip-images` | Stores trip cover images | ✅ | `/trip-images/<userId>/<tripId>.jpg` |

**Usage Flow:**
- Frontend uploads via Supabase SDK (`supabase.storage.from('bucket').upload(...)`)
- URL stored in `profiles.avatar_url` or `trips.image_url`
- Render via `publicURL()` or signed URL.
- Authenticated users can upload; anyone can view (public buckets)

---

### 4. `public.trips` ✅
Custom app table for storing trips (collaborative many-to-many via bridge table).

| Column | Type | Nullable | Description |
|--------|------|-----------|-------------|
| `id` | `uuid` | ❌ | Primary key (auto-generated) |
| `title` | `text` | ✅ | Trip title (e.g., "Weekend in Paris") |
| `destination` | `text` | ✅ | Trip destination (e.g., "Paris, France") |
| `start_date` | `timestamptz` | ✅ | Trip start date |
| `end_date` | `timestamptz` | ✅ | Trip end date |
| `image_url` | `text` | ✅ | Cover image URL (Supabase Storage path) |
| `color` | `text` | ✅ | Background color fallback (hex code) |
| `description` | `text` | ✅ | Trip description/notes (max 2000 chars) |
| `created_at` | `timestamptz` | ❌ | Auto-generated timestamp |

**Note:** NO `user_id` column - ownership managed via `trip_members` bridge table

**Relationships:**
- Many-to-many with `profiles` via `trip_members` (collaborative trips)
- Multiple users can be members of a trip
- All members have equal access (no roles)

**Constraints:**
- Date validation: `end_date` must be >= `start_date` (or both NULL)

**Indexes:**
- `idx_trips_created_at` on `created_at DESC` (for chronological sorting)

**RLS Policies:**
```sql
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Users can view trips they're members of
CREATE POLICY "Users can view their trips"
ON trips FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM trip_members
    WHERE trip_members.trip_id = trips.id
    AND trip_members.user_id = auth.uid()
  )
);

-- Users can create trips (will auto-add as member)
CREATE POLICY "Users can create trips"
ON trips FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update trips they're members of
CREATE POLICY "Users can update their trips"
ON trips FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM trip_members
    WHERE trip_members.trip_id = trips.id
    AND trip_members.user_id = auth.uid()
  )
);

-- Users can delete trips they're members of
CREATE POLICY "Users can delete their trips"
ON trips FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM trip_members
    WHERE trip_members.trip_id = trips.id
    AND trip_members.user_id = auth.uid()
  )
);
```

---

### 5. `public.trip_members` ✅ (Bridge Table)
Bridge table for many-to-many relationship between users and trips.

| Column | Type | Nullable | Description |
|--------|------|-----------|-------------|
| `trip_id` | `uuid` | ❌ | FK → `trips.id` (CASCADE DELETE) |
| `user_id` | `uuid` | ❌ | FK → `profiles.id` (CASCADE DELETE) |
| `joined_at` | `timestamptz` | ❌ | When user was added to trip (auto-generated) |

**Primary Key:** Composite `(trip_id, user_id)`

**Relationships:**
- Connects trips with users in many-to-many relationship
- Each user can be in multiple trips
- Each trip can have multiple users
- Deleting trip → deletes all memberships
- Deleting user → deletes all their memberships

**Indexes:**
- `idx_trip_members_user_id` on `user_id` (for user's trips queries)
- `idx_trip_members_trip_id` on `trip_id` (for trip's members queries)

**RLS Policies:**
```sql
ALTER TABLE trip_members ENABLE ROW LEVEL SECURITY;

-- Users can view members of trips they're in
CREATE POLICY "Users can view members of their trips"
ON trip_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM trip_members tm
    WHERE tm.trip_id = trip_members.trip_id
    AND tm.user_id = auth.uid()
  )
);

-- Users can add members to trips they're in
CREATE POLICY "Users can add members to their trips"
ON trip_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM trip_members tm
    WHERE tm.trip_id = trip_members.trip_id
    AND tm.user_id = auth.uid()
  )
);

-- Users can remove themselves from trips
CREATE POLICY "Users can remove themselves from trips"
ON trip_members FOR DELETE
USING (user_id = auth.uid());
```

---

### 6. 🚧 Planned Tables (not yet created)
| Table | Status | Core Fields |
|--------|--------|-------------|
| `activities` | PLANNED | `id`, `trip_id`, `type`, `title`, `notes`, `timestamp` |
| `expenses` | PLANNED | `id`, `trip_id`, `amount`, `category`, `note`, `created_at` |

---

### 7. 🔐 Environment Variables

| Key | Description |
|-----|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public client key |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin key (for NestJS) |

---

### 8. 🧩 Integration Summary

| Layer | How It Uses Supabase |
|-------|----------------------|
| **Frontend** | Uses SDK for login/signup (`useSupabaseAuth`), profile CRUD, avatar upload |
| **Backend (NestJS)** | Uses Supabase Admin Client for privileged ops, trip CRUD |
| **Shared Core** | Zod schemas mirror DB fields for validation |
| **Storage** | Avatar uploads & retrieval |
| **Auth** | Supabase-managed tokens + JWT verification in backend |
