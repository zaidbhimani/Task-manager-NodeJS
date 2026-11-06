# Define update behavior for a missing task

Label: `wayfinder:grilling`
Status: done
Parent: [Task CRUD API Integration](../00-map.md)
Blocked by: None

## Question

When `PUT /updateTask/:id` receives a valid ID that does not identify an existing task, should it return 404, or preserve the current 200 response with `data: null`? The delete endpoint is already agreed to return 404 for a missing task; decide whether update should align with that behavior.

## Resolution

Return HTTP 404 with the message `Task not found` when a valid task ID has no matching row. This aligns update behavior with deletion and fetch-one behavior.
