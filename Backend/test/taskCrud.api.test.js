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

test("POST /addTask creates a trimmed task and rejects missing or blank titles", async () => {
    let taskId;
    try {
        const title = `API create test ${Date.now()}`;
        const response = await fetch(`${baseUrl}/addTask`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: `  ${title}  ` }),
        });
        const result = await response.json();

        assert.equal(response.status, 201);
        assert.equal(result.success, true);
        assert.equal(result.data.title, title);
        assert.equal(typeof result.data.id, "number");
        taskId = result.data.id;

        for (const body of [{}, { title: "   " }]) {
            const invalidResponse = await fetch(`${baseUrl}/addTask`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const invalidResult = await invalidResponse.json();
            assert.equal(invalidResponse.status, 400);
            assert.equal(invalidResult.success, false);
        }
    } finally {
        if (taskId !== undefined) {
            await pool.query("DELETE FROM tasks WHERE id = $1", [taskId]);
        }
    }
});

test("PUT /updateTask accepts title and completion independently or together", async () => {
    let taskId;
    try {
        const createResponse = await fetch(`${baseUrl}/addTask`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: `API update test ${Date.now()}` }),
        });
        const created = await createResponse.json();
        assert.equal(createResponse.status, 201);
        taskId = created.data.id;

        const sendUpdate = (body) => fetch(`${baseUrl}/updateTask/${taskId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        const titleResponse = await sendUpdate({ title: "  Updated API task  " });
        const titled = await titleResponse.json();
        assert.equal(titleResponse.status, 200);
        assert.equal(titled.data.title, "Updated API task");
        assert.equal(titled.data.completed, false);

        const completionResponse = await sendUpdate({ completed: true });
        const completed = await completionResponse.json();
        assert.equal(completionResponse.status, 200);
        assert.equal(completed.data.title, "Updated API task");
        assert.equal(completed.data.completed, true);

        const combinedResponse = await sendUpdate({
            title: "Combined update",
            completed: false,
        });
        const combined = await combinedResponse.json();
        assert.equal(combinedResponse.status, 200);
        assert.equal(combined.data.title, "Combined update");
        assert.equal(combined.data.completed, false);

        for (const body of [{}, { title: "   " }, { completed: "true" }]) {
            const invalidResponse = await sendUpdate(body);
            const invalidResult = await invalidResponse.json();
            assert.equal(invalidResponse.status, 400);
            assert.equal(invalidResult.success, false);
        }
    } finally {
        if (taskId !== undefined) {
            await pool.query("DELETE FROM tasks WHERE id = $1", [taskId]);
        }
    }
});

test("DELETE /deleteTask deletes a task and returns 404 when it is already missing", async () => {
    let taskId;
    try {
        const createResponse = await fetch(`${baseUrl}/addTask`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: `API delete test ${Date.now()}` }),
        });
        const created = await createResponse.json();
        assert.equal(createResponse.status, 201);
        taskId = created.data.id;

        const deleteResponse = await fetch(`${baseUrl}/deleteTask/${taskId}`, {
            method: "DELETE",
        });
        const deleted = await deleteResponse.json();
        assert.equal(deleteResponse.status, 200);
        assert.equal(deleted.success, true);

        const missingResponse = await fetch(`${baseUrl}/deleteTask/${taskId}`, {
            method: "DELETE",
        });
        const missing = await missingResponse.json();
        assert.equal(missingResponse.status, 404);
        assert.equal(missing.success, false);
        assert.equal(missing.message, "Task not found");

        const missingUpdateResponse = await fetch(`${baseUrl}/updateTask/${taskId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ completed: true }),
        });
        const missingUpdate = await missingUpdateResponse.json();
        assert.equal(missingUpdateResponse.status, 404);
        assert.equal(missingUpdate.success, false);
        assert.equal(missingUpdate.message, "Task not found");
    } finally {
        if (taskId !== undefined) {
            await pool.query("DELETE FROM tasks WHERE id = $1", [taskId]);
        }
    }
});
