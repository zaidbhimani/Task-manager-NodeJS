# Taskflow frontend

The React app reads task listings from the backend at `http://localhost:3000/tasks`.
Run the backend with its PostgreSQL environment configured before using the live
listing. Task creation and completion toggles remain local to the frontend.

## Development

```sh
npm install
npm run dev
```

## Validation

```sh
npm run build
npm run lint
npm run test:e2e
```

Install the Playwright browser once before running browser tests:

```sh
npx playwright install chromium
```

The browser tests mock the task-list API. Backend API integration tests use the
configured PostgreSQL database and can be run from the repository root with:

```sh
npm --prefix Backend test
```
