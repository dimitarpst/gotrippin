# Code style — readable code rules for PRs

This doc defines formatting and naming conventions for the Go Trippin monorepo so PRs stay consistent. It is based on the current codebase, TypeScript/React best practices, and Context7-backed references (Clean Code TypeScript, ESLint, React docs).

**Scope:** `apps/web` (Next.js), `apps/backend` (NestJS), `packages/core` (shared types/utils).

---

## Part 1 — Naming, punctuation, file structure

### 1.1 Naming conventions

Follow consistent capitalization so names are predictable ([Clean Code TypeScript](https://github.com/labs42io/clean-code-typescript), [React](https://react.dev/learn/your-first-component)):

| Kind | Style | Example |
|------|--------|--------|
| **Components** | PascalCase | `ProfileHero`, `DatePicker`, `DrawerContent` |
| **Types / interfaces** | PascalCase | `UserProfileData`, `ColorPickerTab`, `CreateTripDto` |
| **Variables, functions, hooks** | camelCase | `displayData`, `handleDone`, `useAuth` |
| **Constants** (config, enums of values) | UPPER_SNAKE_CASE or camelCase | `PRESET_COLORS`, `DAYS_IN_WEEK` — or `defaultQuery` for one-off consts |
| **Files (components)** | kebab-case or PascalCase | `profile-hero.tsx` or `ProfileHero.tsx` — **pick one per app and stick to it** |
| **Files (non-components)** | kebab-case | `auth.ts`, `use-image-search.ts` |

- **Function names** should describe what they do: e.g. `addMonthToDate` not `addToDate` ([Clean Code TypeScript](https://github.com/labs42io/clean-code-typescript)).
- **Variables** should be meaningful: e.g. `value`, `left`, `right` over `a1`, `a2`, `a3`.

**Current repo:** Web uses PascalCase for component files (`ProfileHero.tsx`, `DatePicker.tsx`). Backend uses kebab-case for modules (`trip-locations`, `jwt-auth.guard`). No need to rename everything; new code should follow the convention of the app you’re in.

### 1.2 Quotes and semicolons

- **Quotes:** Use **double quotes** for strings in TypeScript/TSX (`"use client"`, `"@/components/ui/button"`). This matches most of `apps/web` and is easy to enforce with ESLint `quotes: ["error", "double"]`.
- **Semicolons:** Use **semicolons** at the end of statements. Avoid omitting them so the codebase is consistent and tooling (ESLint/Prettier) can align.

*Note: The repo currently has a mix (some files without semicolons in `apps/web`). New and touched code should use double quotes + semicolons; a follow-up pass can normalize the rest.*

### 1.3 File and folder structure

- **One main component per file** for UI components ([React](https://react.dev/learn/describing-the-ui)). Co-locate small helpers or subcomponents in the same file only if they’re not reused.
- **Barrel exports:** Use `index.ts` / `index.tsx` in a folder when you want a single public API (e.g. `@/components/color-picker` → `index.ts` re-exports).
- **Path aliases:** Web uses `@/*` → `./src/*`. Prefer `@/components/...`, `@/lib/...` over long relative paths.
- **Shared code:** Types, schemas, and pure utils live in `packages/core` and are imported as `@gotrippin/core`. No app-specific logic in core.

---

## Part 2 — Imports, types, React/Next

### 2.1 Import order

Keep imports readable and grouped ([ESLint](https://eslint.org/docs/latest/rules/sort-imports)):

1. **Directives** (only in client entry files): `"use client";` first, then a blank line.
2. **External packages** (React, Next, third-party): alphabetically or React first, then the rest.
3. **Internal aliases**: `@/...`, `@gotrippin/core`.
4. **Relative**: `./...`, `../...`.

Use **type-only imports** when you only need types so bundlers can strip them ([TypeScript](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html#type-only-imports-and-export)):

```ts
import type { Trip, TripLocation } from "@gotrippin/core";
import { formatTripDate } from "@gotrippin/core";
```

Group type-only imports together or put them after value imports from the same module.

### 2.2 Types vs interfaces

- **Object shapes:** Prefer **interface** for object types that may be extended ([TypeScript performance](https://github.com/microsoft/typescript/wiki/Performance)); they give clearer error messages and compose with `extends`.
- **Unions, primitives, mapped types:** Use **type** (e.g. `type Status = "idle" | "loading"`, `type Id = string`).
- **Export types:** Use `export type { X }` or `export interface X` / `export type X = ...` so type-only exports are explicit.

### 2.3 Next.js: "use client"

- Add **`"use client"`** only at the **top of files** that are entry points of the client bundle ([Next.js](https://nextjs.org/docs/app/building-your-application/rendering/client-components)): components that use `useState`, `useEffect`, event handlers, or browser APIs and are imported from Server Components.
- Do **not** add `"use client"` to every file; only to the file that is the boundary (e.g. the page or layout that imports a client-only component). Child components in the same client tree inherit.
- Use **double quotes**: `"use client"`.

### 2.4 Default vs named exports

- **Pages/layouts:** Next.js expects `export default` for `page.tsx`, `layout.tsx`.
- **Reusable components:** Either is fine; **named exports** (`export function Button`) make refactors and search easier. Use **default** when the file has a single primary export (e.g. a page or a wrapper).
- **Barrel files:** Prefer named re-exports (`export { X } from "./x"`) so consumers can import by name.

---

## Part 3 — Errors, testing, tooling

### 3.1 Error handling (from AGENTS.md)

- **No silent errors:** Do not swallow errors (no empty `catch`, no `.catch(() => {})` without logging or surfacing). Log and/or show or rethrow.
- **No fallbacks that hide failures:** Do not replace a failed result with a default and pretend success. Let the error be visible (error state, toast, boundary).
- **Supabase / API:** Always check `error` from `{ data, error }`; handle it (user message or `console.error`); do not overwrite with generic success UI.
- **Mutations:** Do not update UI optimistically; update only after the request succeeds and you validated the response.

### 3.2 Testing

- Prefer **focused tests** for critical paths (auth, trip CRUD, key flows). Use the project’s test runner and conventions; avoid changing behavior only to make tests pass.

### 3.3 Tooling

- **ESLint:** `apps/web` uses `eslint.config.mjs` (flat config) with `eslint-config-next`. Root has ESLint 9 + TypeScript parser; consider adding shared rules (e.g. `quotes`, `semicolon`) at root or per app.
- **Prettier:** Root has Prettier; ensure it’s wired (e.g. `format` script or ESLint integration) so formatting is consistent. Align Prettier with this doc (e.g. double quotes, semicolons).
- **Before PR:** Run `lint` (and `format` if available) in the app you changed.

---

## References

- [Clean Code TypeScript](https://github.com/labs42io/clean-code-typescript) — naming, formatting.
- [React — Your First Component](https://react.dev/learn/your-first-component) — PascalCase components.
- [ESLint Rules](https://eslint.org/docs/latest/rules/) — quotes, semicolons, import sort.
- Project: `AGENTS.md` (workflow, errors, cross-platform), `docs/DEBUGGING_PATTERNS.md` (debugging).
