# 🧭 Go Trippin’ – Next Development Steps

This document defines the current roadmap and next implementation priorities for the Go Trippin’ full-stack project.  
It should be stored in the project root and treated as a **live synchronization file** between developer and AI assistants (Cursor / ChatGPT).

---

## ⚙️ Context Summary (as of current build)

| Layer                         | Status         | Progress | Notes                                                            |
| ----------------------------- | -------------- | -------- | ---------------------------------------------------------------- |
| **Frontend – Auth**           | ✅ Complete    | 100 %    | Full Supabase login/register flow, i18n ready                    |
| **Frontend – Profile**        | ✅ Complete    | 100 %    | Profile UI, editing, avatar color picker                         |
| **Frontend – Layout / Theme** | ✅ Complete    | 100 %    | Dock, header, aurora background, design system                   |
| **Frontend – i18n**           | ✅ Complete    | 100 %    | English + Bulgarian localization, LanguageSwitcher               |
| **Frontend – Trips**          | 🚧 In Progress | 40 %     | API client done, hooks created, connecting UI                    |
| **Backend – API (NestJS)**    | ✅ Complete    | 100 %    | Full CRUD API with Auth, Profiles & Trips modules                |
| **Shared – Core Library**     | ✅ Complete    | 100 %    | Zod schemas, TypeScript types, validation utilities              |
| **Database – Supabase**       | ✅ Complete    | 100 %    | Tables, RLS, & storage buckets configured for many-to-many trips |
| **AI Layer**                  | ❌ Not started | 0 %      | Placeholder only                                                 |

---

## 🔑 Phase 1 — Backend Foundation

1. **Initialize NestJS app**
   - Create `/apps/backend/src/main.ts` and base structure.
   - Add modules: `auth`, `profiles`, `trips`, `ai` (placeholder).
   - Install dependencies: `@nestjs/config`, `@supabase/supabase-js`, `zod`, `class-validator`, `swagger`.

2. **Supabase Admin Integration**
   - Configure `.env` with `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
   - Implement Supabase Admin Client provider and export via DI.

3. **Auth Module**
   - Validate Supabase JWT.
   - Create `JwtAuthGuard` to protect routes.

4. **Profiles Module**
   - `GET /profiles/:id`, `PUT /profiles/:id`.
   - Sync with existing frontend profile fields (`display_name`, `phone`, `avatar_color`).

5. **Trips Module**
   - CRUD endpoints: `GET /trips/:userId`, `POST /trips`, `PUT /trips/:id`, `DELETE /trips/:id`.
   - Use DTOs + Zod validation.

---

## 🧩 Phase 2 — Shared Schemas & Types ✅ **COMPLETED**

1. ✅ Created `packages/core/`:
   - `/schemas/profile.ts` — Zod schema for profile with validation
   - `/schemas/trip.ts` — Zod schema for trip with date validation
   - `/types/index.ts` — shared TypeScript interfaces
   - `/index.ts` — centralized exports

2. ✅ Backend Integration:
   - DTOs created using shared schemas
   - Controllers updated with validation
   - Type-safe request/response handling

3. ✅ Frontend Integration:
   - Validation utilities created (`src/lib/validation.ts`)
   - Custom hooks for form validation (`src/hooks/useFormValidation.ts`)
   - Example components demonstrating usage

4. ✅ Both apps now reference `@gotrippin/core` as dependency

---

## 🗄️ Phase 3 — Trips Database Setup ✅ **COMPLETED**

### ✅ Details:

1. ✅ Implemented many-to-many trips using a bridge table (`public.trip_members`).
2. ✅ Configured all necessary RLS policies for `public.trips` and `public.trip_members` to ensure collaborative, secure access.
3. ✅ Updated backend API (Supabase Service, Trips Service, Trips Controller) to work with the new schema, including member management endpoints.
4. ✅ Updated Zod schemas in `packages/core` to reflect the many-to-many structure.
5. 🗑️ Old SQL migration files were removed as per request.

---

## 🌍 Phase 4 — Trip Management Frontend (Next)

1. Connect existing UI components to backend endpoints:
   - `trips-list.tsx` → fetch user trips
   - `create-trip.tsx` → call `POST /trips`
   - `trip-overview.tsx` → fetch + edit trip
2. Add:
   - Form validation (Zod frontend)
   - Proper loading / error states
   - Auth guards (`useSupabaseAuth`)
3. Image upload to `trip-images` bucket

---

## ⚡ Phase 5 — Enhancements & Realtime

1. Add Supabase Realtime listeners for live trip updates.
2. Implement collaborative editing for shared trips.
3. Add background uploads / file management.

---

## 🤖 Phase 6 — AI Dream Vacation Recommendations (Future)

1. Develop a frontend screen where users describe their dream vacation through AI-guided questions.
2. Store user interests and preferences in the database.
3. In the backend `ai` module:
   - Integrate OpenAI API to process user input.
   - Implement an endpoint (e.g., `POST /ai/dream-vacation`) to generate personalized vacation recommendations based on stored interests.
4. Display AI-recommended vacations to the user.

---

## 🧱 Phase 7 — Testing & Deployment

1. Add E2E tests (NestJS + Playwright).
2. Configure Vercel (web) + Render (API).
3. Add CI pipeline for lint/typecheck.
4. Deploy production environment.

---

## 🔄 Workflow for Agents

- Always read `.cursorrules` + `next_steps.md` before new tasks.
- For multi-file changes: use **Plan Mode** first.
- Suggest commands; never execute them.
- Update this file after each major feature.

---

## ⚠️ Known Issues (as of Nov 11, 2025)

1.  **Forgot Password Flow is Broken**: The password reset page (`/auth/reset-password`) gets stuck on "Verifying..." and never completes. This is due to a suspected deadlock/race-condition with the Supabase client library's automatic session recovery.
2.  **Google Account Linking is Unreliable**: Linking a Google account to an existing email account doesn't always behave as expected. It can sometimes link the wrong Google account if the user is already logged into Google in their browser.
