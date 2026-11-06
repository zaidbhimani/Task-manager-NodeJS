import express from "express";
import { getTask, addTask, updateTask, deleteTask,fetchSingleTask } from "../controller/taskController.js";
const taskRouter = express.Router();

taskRouter.get("/tasks", getTask);
taskRouter.post("/addTask", addTask);
taskRouter.put("/updateTask/:id", updateTask);
taskRouter.delete("/deleteTask/:id",deleteTask);
taskRouter.get("/fetchSingleTask/:id",fetchSingleTask);


export default taskRouter