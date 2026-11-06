# 01: Show server-backed paginated task listings

**What to build:** A user can browse tasks loaded from the backend in the Tasks view, move through five-row pages, and understand when the list is loading, empty, or unavailable. The list API provides enough pagination metadata for the UI to show accurate page navigation.

**Blocked by:** None (can start immediately).

**Status:** done

- [x] The Tasks view loads task rows from `GET /tasks`, including ID, title, completion state, and creation time.
- [x] List requests always send `page` and `offset=5`; `offset` is interpreted as the page size by the current API.
- [x] The list response includes the requested page, page-size value, and a total count alongside the existing success and data fields.
- [x] The total count represents all tasks matching the request before pagination.
- [x] The table displays ID, Title, Completed, and Created at; creation time is formatted for the browser locale and local timezone.
- [x] Users can navigate using numbered page buttons and Previous/Next controls, with the current page and total-page count shown.
- [x] Previous is disabled on the first page and Next is disabled on the last page.
- [x] The list shows loading feedback, a recoverable error with Retry, and a distinct empty-list state.
- [x] The table region scrolls horizontally on narrow screens while the existing left navigation remains visible.
- [x] Backend CORS permits the Vite development origin `http://localhost:5173` without allowing arbitrary origins.
- [x] Browser-level tests verify initial list loading, pagination requests and controls, displayed rows and dates, loading/error/retry/empty states, and narrow-screen table behavior.
- [x] API-level tests verify the paginated response metadata and development-origin CORS behavior.
- [x] No API-backed creation, completion update, editing, or deletion behavior is added.
