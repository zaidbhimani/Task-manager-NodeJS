# 03: Confirm and persist task deletion

**What to build:** A user can intentionally confirm deletion of a task and see the server-backed list updated without losing valid list context.

**Blocked by:** None (can start immediately).

**Status:** done

- [x] Deleting a task requires confirmation before a request is sent.
- [x] Canceling the confirmation sends no request and leaves the task unchanged.
- [x] Confirming sends a delete request for the selected task.
- [x] A successful deletion refreshes the list while preserving query, filters, sort, and page when valid; if the current page is no longer valid, the list moves to the last valid page.
- [x] The backend returns 404 when a valid task ID does not exist.
- [x] While deletion is pending, duplicate requests are prevented.
- [x] If deletion fails, the task remains visible and an accessible inline error is shown without claiming success.
- [x] Browser tests using mocked HTTP verify confirmation, cancellation, request behavior, list refresh, pending state, and failure recovery.
- [x] Backend API tests verify successful deletion and the 404 response for a missing task.
