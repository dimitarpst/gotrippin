---
name: todo-management
description: Manages the root TODO file for Go Trippin. Use when completing a task (mark done), adding a new todo item, or when the user asks to update or create TODO entries.
---

# TODO File Management

## File location

- **Current tasks:** Root `TODO` file (no extension). Keep it short; only active items.
- **Later / backlog:** `docs/todos/later.md` (e.g. Phase 6 public sharing).
- **Completed history:** `docs/todos/archive.md` (for reference; move items here when done if the root TODO would get too long).

## Format

- **Phases:** `Todo:`, `Phase 2 — Architecture:`, `Phase 4+:` — preserve existing phases.
- **Done:** `✔` (checkmark)
- **Pending:** `☐` (empty checkbox)
- **Entry format:** `  ✔` or `  ☐` followed by space, then short description, then optional ` — detail` or reference (e.g. `MAPS_IMPLEMENTATION.md`).

## When to update

1. **Task completed:** Change `☐` to `✔` for the relevant item. Keep the description; optionally append brief note in parentheses if helpful (e.g. `fix isMounted guard blocking setUserAvatarFiles`).

2. **New task:** Add a row under the appropriate phase. Use `☐` and a concise description. Reference a doc if relevant (e.g. `review BACKEND_FRONTEND_MOBILE_AUDIT.md`).

3. **User asks to add something:** Add under the most appropriate phase. Default new items to `Phase 4+` when unclear.

## Examples

**Mark done:**
```
  ☐ Avatar picker shows all uploaded avatars
```
→
```
  ✔ Avatar picker shows all uploaded avatars — fix isMounted guard blocking setUserAvatarFiles on storage list success
```

**Add new:**
```
  ☐ Image pipeline — compress uploads; move off Supabase storage limits; Cloudflare CDN for avatars/images (pro setup)
```
