# 🧭 Go Trippin’ – Next Development Steps

This document defines the current roadmap and next implementation priorities for the Go Trippin’ full-stack project.  
It should be stored in the project root and treated as a **live synchronization file** between developer and AI assistants (Cursor / ChatGPT).

---

## ⚙️ Context Summary (as of current build)

| Layer                         | Status         | Progress | Notes                                                |
| ----------------------------- | -------------- | -------- | ---------------------------------------------------- |
| **Frontend – Auth**           | ✅ Complete    | 100 %    | Full Supabase login/register flow, i18n ready        |
| **Frontend – Profile**        | ✅ Complete    | 100 %    | Profile UI, editing, avatar color picker             |
| **Frontend – Layout / Theme** | ✅ Complete    | 100 %    | Dock, header, aurora background, design system       |
| **Frontend – i18n**           | ✅ Complete    | 100 %    | English + Bulgarian localization, LanguageSwitcher   |
| **Frontend – Trips**          | ⚠️ Design-only | 0 %      | UI mock components exist, not connected to data      |
| **Backend – API (NestJS)**    | ✅ Complete    | 100 %    | Full CRUD API with Auth, Profiles & Trips modules    |
| **Shared – Core Library**     | ❌ Missing     | 0 %      | No schemas or shared types                           |
| **Database – Supabase**       | ⚠️ Partial     | ~60 %    | Tables defined, RLS not verified, trigger + FK added |
| **AI Layer**                  | ❌ Not started | 0 %      | Placeholder only                                     |

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

## 🧩 Phase 2 — Shared Schemas & Types

1. Create `packages/core/`:

   - `/schemas/profile.ts` — Zod schema for profile.
   - `/schemas/trip.ts` — Zod schema for trip.
   - `/types/index.ts` — shared TypeScript interfaces.

2. Import these into both frontend and backend for type safety.

---

## 🌍 Phase 3 — Trip Management Frontend

1. Connect existing UI components to backend endpoints:
   - `trips-list.tsx` → fetch user trips.
   - `create-trip.tsx` → call `POST /trips`.
   - `trip-overview.tsx` → fetch + edit trip.
2. Add:
   - Form validation (Zod frontend).
   - Proper loading / error states.
   - Auth guards (`useSupabaseAuth`).

---

## 🗄️ Phase 4 — Database & RLS Hardening

1. Verify Supabase tables:
   - `profiles`, `trips`.
2. Enable and test Row-Level Security.
3. Write policies:
   ```sql
   CREATE POLICY "Users can manage their own trips"
   ON trips FOR ALL
   USING (auth.uid() = user_id);
   ```
4. Add Supabase Storage for trip images.

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
