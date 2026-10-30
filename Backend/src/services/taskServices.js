import { getAllTasks, addNewTask, updateTask, deleteTask } from "../models/taskModels.js";
export const fetchAllTasks = () => {
    return getAllTasks();
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