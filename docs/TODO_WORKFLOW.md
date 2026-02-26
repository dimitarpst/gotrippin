## Todo+ Workflow (features.todo)

### Format

- **Projects**: `ProjectName:`
- **Tasks** (2 spaces indent):  
  - Pending: `␣␣☐ Implement XYZ @est(2h) @high @today`  
  - Done: `␣␣✔ Implement XYZ @done(26-02-25 21:12)`  
  - Cancelled: `␣␣✘ Implement XYZ @cancelled(26-02-25 21:12)`

### Tags

- **Timekeeping**: `@started(YY-MM-DD HH:mm)`, `@done(...)`, `@cancelled(...)`
- **Estimates**: `@est(3h)`, `@est(2h30m)`, `@2h30m`
- **Other tags**: `@high`, `@low`, `@today`, `@critical`, etc. (free-form)

### Shortcuts & Lifecycle

- **Toggle box / new task**: `Ctrl+Enter`  
  - Plain line ↔ `☐` task
- **Mark done**: `Alt+D`  
  - `☐` → `✔ … @done(...)`
- **Cancel**: `Alt+C`  
  - `☐` / `✔` → `✘ … @cancelled(...)`
- **Start/stop timer**: `Alt+S`  
  - Adds/removes `@started(...)` and shows/hides status-bar timer
- **Archive finished**: `Ctrl+Shift+A`  
  - Moves all `✔` / `✘` from a project to `Archive:` and appends `@project(ProjectName)`
