# Task Creation, Editing, and Deletion Specification

## Problem Statement

Users can browse server-backed tasks, but creating tasks and changing completion status still update only frontend state. Users also have no way to edit a task title or delete a task. These changes do not persist through the existing task API, so the list can become inconsistent with the backend.

## Solution

Connect task creation, title editing, completion toggling, and deletion to the existing backend API. Keep the current Tasks list, pagination, filtering, and sorting behavior. After a successful mutation, reload tasks from the server so the interface reflects persisted data; show an accessible error and preserve the user's work when a request fails.

## User Stories

1. As a task manager user, I want to create a task with a title, so that new work is saved to the task collection.
2. As a task manager user, I want the title to be required and nonblank, so that invalid tasks are not submitted.
3. As a task manager user, I want surrounding whitespace removed from a title before it is saved, so that task names are clean and consistent.
4. As a task manager user, I want to see a pending state while a task is being created, so that I know the request is in progress.
5. As a task manager user, I want duplicate create submissions prevented while a request is pending, so that I do not accidentally create the same task multiple times.
6. As a task manager user, I want to return to Tasks after a task is created successfully, so that I can see it in the server-backed list.
7. As a task manager user, I want the list refreshed and reset to page one with filters cleared after creation, so that the new task is discoverable even if it would not match the previous list view.
8. As a task manager user, I want my entered title retained if creation fails, so that I can retry without retyping it.
9. As a task manager user, I want an accessible error when creation fails, so that I understand the task was not saved.
10. As a task manager user, I want to edit a task title inline, so that I can correct a task without leaving the list.
11. As a task manager user, I want explicit Save and Cancel actions while editing a title, so that I control whether my changes are applied.
12. As a task manager user, I want a blank or whitespace-only edited title rejected, so that an existing task cannot be renamed to an unusable title.
13. As a task manager user, I want title edits trimmed before they are saved, so that the saved title has no accidental surrounding whitespace.
14. As a task manager user, I want to keep a task's existing title when I cancel editing, so that an abandoned edit has no effect.
15. As a task manager user, I want the title edit to remain available after a failed save, so that I can correct the input or retry.
16. As a task manager user, I want to toggle completion with the task's checkbox, so that I can mark work complete or reopen it.
17. As a task manager user, I want completion changes saved to the server, so that my task status persists beyond the current view.
18. As a task manager user, I want completion-only updates to leave the title unchanged, so that changing status does not overwrite unrelated task data.
19. As a task manager user, I want a pending state to prevent repeated updates, so that rapid input does not send duplicate or conflicting requests.
20. As a task manager user, I want an accessible error and the prior visible task state preserved when an update fails, so that I can recover without a false success.
21. As a task manager user, I want to delete a task only after confirming the action, so that an accidental click does not permanently remove work.
22. As a task manager user, I want to cancel a delete confirmation without sending a request, so that the task remains unchanged.
23. As a task manager user, I want the list refreshed after a confirmed deletion, so that the removed task no longer appears.
24. As a task manager user, I want a delete failure to leave the task visible and show an accessible error, so that the interface does not claim an unsuccessful deletion.
25. As a task manager user, I want the list query, filters, sort, and current page preserved after an update or deletion when that page remains valid, so that I can continue where I was.
26. As a task manager user, I want the current page adjusted if a deletion makes it invalid, so that I am not left on an empty page beyond the result set.
27. As a task manager user, I want CRUD operations to work with the existing server-backed task list, so that listing and mutations describe the same data.
28. As a keyboard user, I want the create form, inline editor, completion checkbox, delete confirmation, and recovery actions to be keyboard-operable, so that I can complete task workflows without a pointer.
29. As a user who relies on assistive technology, I want mutation status and error feedback announced through semantic accessible elements, so that I know whether an action succeeded or needs attention.

## Implementation Decisions

### API contracts

- Use the existing API origin and routes:
  - `POST http://localhost:3000/addTask`
  - `PUT http://localhost:3000/updateTask/:id`
  - `DELETE http://localhost:3000/deleteTask/:id`
- Create sends a JSON body containing `title`. A successful create returns HTTP 201 and the created task in the existing success envelope.
- Update sends a JSON body containing `title`, `completed`, or both. Each field is optional, but at least one must be supplied. A supplied title must be a nonblank string and is trimmed before saving; a supplied `completed` value must be boolean.
- Delete has no request body. A successful delete uses the existing success envelope.
- Continue to use the API's `{ success, message, data }` response conventions. For non-success responses, show the backend message when available and a clear fallback otherwise.
- A delete request for a valid ID with no matching task must return HTTP 404 rather than success.
- The behavior for updating a valid but nonexistent task is not yet decided. The current backend returns HTTP 200 with `data: null`; settle this contract before changing it. The related open decision is tracked in the local CRUD wayfinding map.

### User interactions and list consistency

- Keep the current Tasks and Create task views, task table, pagination, filters, sorting, and navigation.
- Keep task completion as a checkbox. Add inline title editing with explicit Save and Cancel actions.
- Require confirmation before sending a delete request. Canceling confirmation does not change the task or call the API.
- Prevent duplicate submissions for each in-flight mutation. Present pending feedback and keep controls from issuing another conflicting request until the operation completes.
- Do not show a mutation as successful or change persisted task data optimistically. On success, reload the server-backed list.
- After successful creation, clear the create form, return to Tasks, clear active and draft filters, and load page one.
- After successful update or deletion, refresh the list while retaining the current query, filters, sort, and page when valid. If the refreshed total count makes the current page invalid, move to the last valid page.
- If a mutation fails, retain unsaved form/editor input and the last confirmed task data, and show an inline accessible error. Do not emit success-shaped feedback.
- Use semantic controls and visible focus. Expose pending and error feedback accessibly.
- Do not change the task schema or add authentication, offline support, or new API routes.

## Testing Decisions

- Tests should verify externally observable behavior through HTTP responses and the rendered app, not React component internals, function names, or implementation-specific state.
- Extend the existing Playwright browser suite. Mock HTTP responses and assert request methods, URLs, payloads, visible states, and refreshed task results.
- Browser-level coverage should verify create success and validation; inline title Save/Cancel; completion-only and title updates; delete confirmation and cancellation; list refresh and query-context behavior; pending duplicate prevention; and mutation failures with preserved state and accessible errors.
- Extend the existing Node API test suite to verify create, update, and delete status codes, response envelopes, persisted task fields, input validation, and missing-task behavior. Include the unresolved update-missing-task contract after it is decided.
- API tests should use the repository's configured test database and clean up records they create. They should not depend on unrelated pre-existing task rows.
- Existing prior art is the Playwright task-listing suite, which mocks the list API and verifies pagination, filtering, sorting, error/retry, and responsive behavior; and the backend Node test suite, which exercises the API against the configured PostgreSQL database.
- Do not add a separate live browser-to-server integration harness for this feature.

## Out of Scope

- Redesigning the task table, navigation, pagination, filtering, sorting, or visual theme.
- Adding bulk task actions, undo, task archiving, or permanent-delete recovery.
- Adding task fields beyond title and completion.
- Changing the existing task database schema or replacing the current API routes.
- Authentication, multi-user access, offline queuing, automatic retry, or production API-origin configuration.
- Changes to task-list behavior unrelated to keeping the current list consistent after CRUD operations.

## Further Notes

- The backend routes for create, update, and delete already exist. The frontend currently creates and toggles tasks in local state rather than using those mutation endpoints.
- The backend validates create and update inputs. Delete currently reports success even when no task row was deleted; the agreed behavior is to return 404 for that case.
- The existing frontend list fetch already displays backend error messages in an accessible alert with a Retry action. Mutation errors should follow the same general user-facing pattern while preserving mutation input.
- The local wayfinding map for this work contains one unresolved decision: update behavior for a valid ID that does not exist. The spec leaves that contract open rather than assuming an answer.
