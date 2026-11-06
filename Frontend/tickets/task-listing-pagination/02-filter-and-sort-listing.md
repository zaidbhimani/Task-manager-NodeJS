# 02: Filter and sort the task listing

**What to build:** A user can narrow the server-backed task list by title and completion state together, clear both filters, and sort by ID or creation time. The active query is reflected in the results and page navigation.

**Blocked by:** 01: Show server-backed paginated task listings.

**Status:** done

- [x] The listing provides title and completion filters together, with Apply and Clear actions.
- [x] The completion filter offers All, Completed, and Pending; All omits `completed`, Completed sends `completed=true`, and Pending sends `completed=false`.
- [x] The title filter uses the backend's case-insensitive substring matching.
- [x] Applying both filters sends both optional query parameters; clearing filters removes both.
- [x] Filtered `totalCount` represents the number of records matching both active filters before pagination, so the page count reflects the filtered result set.
- [x] Applying or clearing filters resets the current page to 1.
- [x] Only ID and Created at are sortable. The initial sort is Created at descending; selecting an inactive column uses ID ascending or Created at descending, respectively.
- [x] Selecting the active sortable header toggles its direction, and changing sort resets the page to 1.
- [x] Created-at sorting uses ID ascending as a tie-breaker when timestamps are equal; changing pages preserves active filters and sort.
- [x] The UI distinguishes an empty filtered result from an empty unfiltered list and provides a way to clear filters from the filtered empty state.
- [x] Browser-level tests verify combined filtering, clear/apply behavior, sort directions/defaults, page resets, filtered empty results, and that page navigation preserves the active query.
- [x] API-level tests verify optional filters combine correctly, filtered totals are accurate, and equal timestamps sort deterministically.
- [x] No API-backed creation, completion update, editing, or deletion behavior is added.
