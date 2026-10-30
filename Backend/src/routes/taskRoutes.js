import express from "express";
import { sendTask, addTask, updateTask, deleteTask } from "../controller/taskController.js";
const taskRouter = express.Router();

taskRouter.get("/", sendTask);
taskRouter.post("/addTask", addTask);
taskRouter.put("/updateTask/:id", updateTask);
taskRouter.use("/deleteTask/:id",deleteTask)


export default taskRouter