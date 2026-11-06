# 02: Persist task title and completion updates

**What to build:** A user can edit a task title inline or toggle its completion checkbox, and the saved values remain consistent with the server-backed task list.

**Blocked by:** [Define update behavior for a missing task](../../../.scratch/task-crud-wayfinding/issues/01-update-missing-task-semantics.md) (resolved: return 404 with `Task not found`).

**Status:** done

- [x] A user can edit a task title inline and explicitly Save or Cancel the edit.
- [x] Saving a title sends a trimmed, nonblank title; canceling sends no request and leaves the saved title unchanged.
- [x] Toggling completion sends a boolean update without overwriting the title.
- [x] Update requests include one or both supported fields, and the missing-task response follows the resolved contract in the blocking decision.
- [x] Pending updates prevent duplicate or conflicting submissions.
- [x] After a successful update, the list is reloaded while preserving its query, filters, sort, and page when valid.
- [x] If an update fails, the last confirmed task data remains visible, unsaved editor input is retained, and an accessible inline error is shown.
- [x] Browser tests using mocked HTTP verify title Save/Cancel, completion updates, request payloads, refresh behavior, pending state, and failure recovery.
- [x] Backend API tests verify title-only, completion-only, and combined updates, invalid payloads, and the resolved missing-task behavior.
