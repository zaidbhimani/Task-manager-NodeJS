# 02: Create and complete tasks from the UI

**What to build:** A user can create a task by entering its title, find it in the Tasks list, and mark it complete with a checkbox. Completed tasks remain visible and visually distinct. This ticket does not define API integration or durable persistence.

**Blocked by:** 01: Build the dark task-manager shell and navigation.

**Status:** done

- [x] The Create task view provides a single required task-title field.
- [x] An empty title is rejected using standard required-field validation, without custom validation messages or success notifications.
- [x] After a task is successfully created, the user returns to Tasks and can see the new task.
- [x] Each listed task shows its title and a checkbox for completion.
- [x] Toggling a task's checkbox updates its visible completion state.
- [x] Completed tasks remain visible and are visually distinguishable from incomplete tasks.
- [x] The form and checkboxes use semantic, keyboard-operable controls with accessible names and visible focus.
- [x] Browser-level tests verify required-title behavior, creation and return to the list, and completion toggling through the rendered app.
- [x] No backend API contract or durable persistence behavior is introduced.
