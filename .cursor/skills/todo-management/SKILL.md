---
name: todo-management
description: Manages the root todo file (features.todo) for Go Trippin. Use when completing a task (mark done), adding a new todo item, or when the user asks to update or create TODO entries.
---

# TODO File Management

Compatible with the **Todo** extension (TaskPaper-style): file name `features.todo` (extension supports `*.todo`), symbols ☐ ✔ ✘, 2-space indent, projects like `Todo:` and `Archive:`. Use **Todo: Archive** in the command palette to move done items into the Archive section. Set `todo.file.name` to `features.todo` or add `**/features.todo` to `todo.file.include` so the extension opens it.

## File location

- **Current tasks:** Root `features.todo`. Keep active items under `Todo:`.
- **Archive (in-file):** Section `Archive:` in the same file — use extension’s **Todo: Archive** to move ✔ items here so root stays minimal.
- **Backlog:** `docs/todos/later.md` (e.g. Phase 6). Not parsed by the Todo extension (it’s .md); open manually.
- **Long-term history:** `docs/todos/archive.md` (optional; for reference when you want to keep a full history outside the root file).

## Format (extension-compatible)

- **Projects:** `Todo:` for active work, `Archive:` for completed (extension moves ✔ items here).
- **Box (pending):** `☐`
- **Done:** `✔`
- **Cancelled:** `✘` (use when a task is dropped, not done).
- **Indent:** 2 spaces under each project.
- **Entry format:** `  ☐` or `  ✔` or `  ✘` followed by space, then description, then optional ` — detail` or reference (e.g. `docs/MAPS_IMPLEMENTATION.md`).

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
