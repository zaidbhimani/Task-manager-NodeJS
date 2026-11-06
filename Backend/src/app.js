import express from "express";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import cors from "cors";
import taskRouter from "./routes/taskRoutes.js";
import errorMiddleware from "./middleware/middleware.js";
import notFoundMiddleware from "./middleware/notFoundMiddleware.js";
const app = express();
const PORT = "3000";

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || origin === "http://localhost:5173") {
            callback(null, "http://localhost:5173");
            return;
        }
        callback(null, false);
    },
}));
app.use(express.json());

app.use(taskRouter);

// Catch unmatched routes
app.use(notFoundMiddleware);

// Handle all errors
app.use(errorMiddleware);

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
    app.listen(PORT, () => {
        console.log(`Server is running at ${PORT}`)
    })
}

export default app;