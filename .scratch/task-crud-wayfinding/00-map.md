# Task CRUD API Integration

Label: `wayfinder:map`
Status: open

## Destination

A complete, tested app supports creating tasks, updating title and/or completion status, and deleting tasks through the supplied APIs, while preserving existing task listing behavior. API implementation is in scope only if the repository audit shows a required contract gap.

## Notes

- Domain: the existing React task manager and Express task API.
- Preserve the server-backed listing and use the repository's existing browser and API test patterns.
- Agreed UI behavior: inline title editing with Save/Cancel; completion remains a checkbox; confirm before deleting.
- After create, return to Tasks, refresh from the server, and reset to page 1 with filters cleared. After update/delete, refresh while preserving the current query, filters, sort, and page where valid.
- Prevent duplicate submissions while requests are pending. On failure, retain user input/state and show an accessible inline error.
- Supplied update fields are optional individually, but at least one is required. Supplied titles must be nonblank after trimming.
- A delete request for a missing task should return 404.
- An update request for a valid but missing task ID should return 404 with `Task not found`.

## Decisions so far

- [Define update behavior for a missing task](issues/01-update-missing-task-semantics.md): A valid ID with no matching task returns 404 with `Task not found`.

## Not yet specified

- No additional fog identified.

## Out of scope

- Unrelated task-listing redesigns or API changes that are not required to complete the CRUD destination.
