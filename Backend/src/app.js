import express from "express";
import taskRouter from "./routes/taskRoutes.js";
const app = express();
const PORT = "3000";

app.use(express.json());

app.use(taskRouter);

app.listen(PORT,()=>{
    console.log(`Server is running at ${PORT}`)
})