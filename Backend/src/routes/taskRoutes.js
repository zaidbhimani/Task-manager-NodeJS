import express from "express";
import { sendTask, addTask, updateTask } from "../controller/taskController.js";
const taskRouter = express.Router();

taskRouter.get("/", sendTask);
taskRouter.post("/addTask", addTask);
taskRouter.put("/updateTask/:id", updateTask);


export default taskRouter