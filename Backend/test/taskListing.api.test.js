import assert from "node:assert/strict";
import { once } from "node:events";
import { after, before, test } from "node:test";
import app from "../src/app.js";
import pool from "../src/config/db.js";

let server;
let baseUrl;

before(async () => {
    server = app.listen(0);
    await once(server, "listening");
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
    if (server) {
        server.close();
        await once(server, "close");
    }
    await pool.end();
});

test("GET /tasks returns rows and pagination metadata for the requested page", async () => {
    const response = await fetch(`${baseUrl}/tasks?page=1&offset=5&sortBy=id&order=ASC`);
    const result = await response.json();

    assert.equal(response.status, 200);
    assert.equal(result.success, true);
    assert.equal(result.meta.page, 1);
    assert.equal(result.meta.offset, 5);
    assert.ok(Number.isInteger(result.meta.totalCount));
    assert.ok(result.meta.totalCount >= result.data.length);
    assert.ok(result.data.length <= 5);
    for (const task of result.data) {
        assert.deepEqual(Object.keys(task).sort(), ["completed", "created_at", "id", "title"]);
    }
});

test("GET /tasks applies both optional filters before counting and paginating", async () => {
    const initialResponse = await fetch(`${baseUrl}/tasks?page=1&offset=5&sortBy=id&order=ASC`);
    const initialResult = await initialResponse.json();
    assert.ok(initialResult.data.length > 0, "test requires at least one task in the configured database");

    const sample = initialResult.data[0];
    const title = sample.title.slice(0, 4);
    const completed = String(sample.completed);
    const params = new URLSearchParams({
        page: "1",
        offset: "1000",
        title,
        completed,
        sortBy: "id",
        order: "ASC",
    });
    const response = await fetch(`${baseUrl}/tasks?${params}`);
    const result = await response.json();

    assert.equal(response.status, 200);
    assert.equal(result.meta.totalCount, result.data.length);
    assert.ok(result.data.length > 0);
    for (const task of result.data) {
        assert.equal(task.completed, sample.completed);
        assert.ok(task.title.toLocaleLowerCase().includes(title.toLocaleLowerCase()));
    }
});

test("created-at ordering uses ID as a stable ascending tie-breaker", async () => {
    const response = await fetch(
        `${baseUrl}/tasks?page=1&offset=1000&sortBy=created_at&order=DESC`
    );
    const result = await response.json();

    assert.equal(response.status, 200);
    for (let index = 1; index < result.data.length; index += 1) {
        const previous = result.data[index - 1];
        const current = result.data[index];
        if (previous.created_at === current.created_at) {
            assert.ok(previous.id < current.id);
        } else {
            assert.ok(new Date(previous.created_at) >= new Date(current.created_at));
        }
    }
});

test("GET /tasks rejects missing or invalid required and optional query values", async () => {
    for (const query of ["offset=5", "page=1", "page=0&offset=5", "page=1&offset=0", "page=1&offset=5&completed=maybe"]) {
        const response = await fetch(`${baseUrl}/tasks?${query}`);
        assert.equal(response.status, 400, `expected invalid query to be rejected: ${query}`);
    }
});

test("CORS allows the Vite origin and withholds permission from other origins", async () => {
    const allowed = await fetch(`${baseUrl}/tasks?page=1&offset=5`, {
        method: "OPTIONS",
        headers: {
            Origin: "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    });
    assert.equal(allowed.headers.get("access-control-allow-origin"), "http://localhost:5173");

    const disallowed = await fetch(`${baseUrl}/tasks?page=1&offset=5`, {
        method: "OPTIONS",
        headers: {
            Origin: "http://example.invalid",
            "Access-Control-Request-Method": "GET",
        },
    });
    assert.equal(disallowed.headers.get("access-control-allow-origin"), null);
});
