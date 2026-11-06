# 01: Persist task creation

**What to build:** A user can create a task through the backend and see it in the server-backed Tasks list.

**Blocked by:** None (can start immediately).

**Status:** done

- [x] Submitting a valid, nonblank title sends a create request with the trimmed title and does not create a client-only task.
- [x] The create action shows a pending state and prevents duplicate submissions while the request is in flight.
- [x] After a successful create, the form is cleared, the app returns to Tasks, active and draft filters are cleared, and page one is loaded from the server.
- [x] If creation fails, the entered title remains available for retry and an accessible inline error is shown; the app does not claim success.
- [x] Browser tests using mocked HTTP verify the request contract, successful refreshed-list behavior, validation, pending duplicate prevention, and failure recovery.
- [x] Backend API tests verify successful creation and invalid title responses through the HTTP API.
