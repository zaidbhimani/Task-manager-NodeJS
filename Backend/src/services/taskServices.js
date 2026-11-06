import { getAllTasks, addNewTask, updateTask, deleteTask, getTaskById } from "../models/taskModels.js";
import AppError from "../utils/AppError.js";

export const fetchAllTasks = (page, pageSize, completed, title, sortBy, order) => {
    const startIndex = (page - 1) * pageSize;
    const sortByColumnName = ["title", "id", "created_at"]
    const sortByName = sortByColumnName.includes(sortBy) ? sortBy : "id"
    const orderName = typeof order === "string" && order.toUpperCase() === "DESC" ? "DESC" : "ASC";
    return getAllTasks(startIndex, pageSize, completed, title, sortByName, orderName);
}


export const addTitle = (title) => {
    return addNewTask(title);
}

export const updateTitle = (title) => {
    return updateTask(title);
}

export const deleteTaskService = (id) => {
    return deleteTask(id)
}

// New function
export const fetchTaskById = async (id) => {
    const task = await getTaskById(id);

    if (!task) {
        throw new AppError("Task not found", 404);
    }

    return task;
};