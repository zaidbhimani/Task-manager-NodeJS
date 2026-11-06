# Task Listing Pagination, Filtering, and Sorting Specification

## Destination

Provide an implementation-ready specification for server-backed task listing with pagination, combined filtering, and sorting. API-backed task creation and completion updates remain a separate future discussion.

## Problem Statement

The Tasks view currently uses in-memory task data and cannot browse the task collection exposed by the backend. Users need to navigate a larger task list page by page, narrow it by title and completion state, and sort it by supported fields.

## Solution

Load task rows from the existing `GET /tasks` endpoint. Present them in a responsive table with combined title and completion filters, sortable ID and Created at columns, and pagination controls. Extend the list response with filtered total-count and pagination metadata so the client can show accurate page navigation.

## User Stories

1. As a task manager user, I want the Tasks view to load rows from the backend, so that I can see the server's task list.
2. As a task manager user, I want to see a task's ID, title, completion state, and creation time, so that I can identify and review each task.
3. As a task manager user, I want to see five tasks per page, so that the list is easy to scan.
4. As a task manager user, I want numbered page buttons and Previous/Next controls, so that I can move through the full task list.
5. As a task manager user, I want the current page and total page count displayed, so that I know where I am in the list.
6. As a task manager user, I want Previous disabled on the first page and Next disabled on the final page, so that page navigation stays within the result set.
7. As a task manager user, I want to search task titles and filter by completion state at the same time, so that I can narrow the list precisely.
8. As a task manager user, I want to choose All, Completed, or Pending for completion, so that I can include or exclude completed work.
9. As a task manager user, I want to apply or clear filters explicitly, so that the list does not change unexpectedly while I am entering criteria.
10. As a task manager user, I want filtering to return me to the first page, so that I do not remain on a page that no longer exists in the filtered results.
11. As a task manager user, I want to sort by ID or creation time through the corresponding column headers, so that I can arrange tasks in a useful order.
12. As a task manager user, I want to reverse the active sort direction by selecting its header again, so that I can switch between ascending and descending order.
13. As a task manager user, I want creation time shown in my browser's locale and local timezone, so that the timestamp is readable.
14. As a task manager user, I want loading feedback while the list is fetched, so that I know the app is responding.
15. As a task manager user, I want a clear error and a Retry action when loading fails, so that I can recover without restarting the app.
16. As a task manager user, I want a distinct no-results state when no tasks match my filters, so that I can clear or change the search.
17. As a task manager user on a narrow screen, I want to scroll the table horizontally while retaining the existing navigation panel, so that all task columns remain available.
18. As a keyboard or assistive-technology user, I want filters, sorting controls, and pagination to have accessible names, semantic roles, and visible keyboard focus, so that I can use the listing without a pointer.

## Implementation Decisions

### List API

- Request task rows from `GET http://localhost:3000/tasks`.
- The request always includes `page` and `offset`. Use page 1 initially and a fixed `offset=5`; in the current backend, `offset` means page size, not the conventional row skip.
- Send `title` and `completed` only when their filters are active. Both may be present in one request.
- Send `sortBy` and `order` for the active sort. Supported sort fields in this UI are `id` and `created_at`.
- The task row fields are `id`, `title`, `completed`, and `created_at`.

### List response

- Preserve the existing success envelope and task-row fields, and add pagination metadata alongside the task rows.
- Each task row includes `id`, `title`, `completed`, and `created_at`.
- The metadata includes the requested `page`, the page-size value `offset`, and `totalCount`.
- `totalCount` is the number of records matching the active title and completion filters, before pagination. Use it to compute total pages.

### Table, filtering, and sorting

- Keep the existing app shell and persistent navigation.
- Render a table with ID, Title, Completed, and Created at columns. Only ID and Created at are sortable.
- Display `created_at` using the browser's locale and local timezone; sorting uses the server timestamp.
- The initial order is `created_at` descending (newest first).
- Selecting a sortable column that is not active uses its natural default: ID ascending or Created at descending. Selecting the active column toggles its direction.
- When sorting by Created at, use ID ascending as a secondary sort key to keep page boundaries stable when timestamps are equal.
- Show a title text field and a completion selector together. The selector offers All, Completed, and Pending; All omits `completed`, Completed sends `completed=true`, and Pending sends `completed=false`.
- Apply sends both active filters. Clear removes both filters. Applying or clearing filters resets the current page to 1.
- Changing the sort resets the current page to 1. Changing pages preserves the active filters and sort.

### Pagination and states

- Use a fixed page size of five; do not provide a page-size selector.
- Show numbered page buttons, Previous/Next controls, and a current-page/total-pages indicator. Disable Previous on the first page and Next on the last page.
- Show a loading indicator while a list request is in progress.
- On a failed request, show a clear error and Retry action.
- Distinguish an empty unfiltered list from an empty result set caused by filters. The filtered state should offer a way to clear filters.
- Horizontally scroll the table region on narrow screens. Keep the existing left navigation visible.

### API connectivity and mutation boundary

- Enable backend CORS for the Vite development origin `http://localhost:5173`; do not use a wildcard origin. Production API origin/configuration is not decided by this spec.
- This feature integrates the list read only. Do not send API requests for creation or completion updates, and do not alter the existing create and completion-toggle interactions as part of this listing work.
- The behavior coordinating existing local create/toggle state with server-fetched list results is not decided here; do not promise persistence or synchronization for those actions.

## Testing Decisions

- Tests should verify behavior observable through the rendered app and its accessible controls, not React component internals.
- Browser-level coverage uses Playwright against the rendered app with the task-list API mocked. It verifies initial loading, pagination requests and controls, combined filtering, filter/sort page resets, error and retry behavior, empty results, and narrow-screen table scrolling.
- API-level coverage uses Node's built-in test runner against the configured PostgreSQL database. It verifies filtered counts, pagination metadata, query validation, deterministic created-at ordering, and CORS behavior for allowed and disallowed origins.
- Keep browser tests independent of React component structure and keep API tests read-only so they can run against the configured development database.

## Out of Scope

- API-backed task creation, completion updates, editing, or deletion.
- Changing the existing `offset` query parameter to `limit`.
- Selecting a page size other than five or exposing a page-size selector.
- Sorting by title or completion state.
- Persisting filters, sort order, or page across reloads.
- Production API origin configuration, authentication, and deployment setup.
- Custom empty-state copy beyond clearly distinguishing no tasks from no matching results.

## Further Notes

- The backend now returns filtered pagination metadata and applies stable created-at ordering with an ID tie-breaker.
- The frontend uses Playwright for browser-level listing tests; backend API tests use Node's built-in test runner and require the PostgreSQL environment used by the app.
- The current backend treats `offset` as the limit/page size, despite its conventional meaning and the alternate `limit=5` example. This specification uses the behavior the current handler supports.
- API-backed task creation and completion updates should be specified separately before being connected to the list.
