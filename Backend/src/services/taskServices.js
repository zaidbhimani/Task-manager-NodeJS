import { getAllTasks, addNewTask,updateTask } from "../models/taskModels.js";
export const fetchAllTasks = () => {
    return getAllTasks();
}


export const addTitle = (title) => {
    return addNewTask(title);
}

export const updateTitle = (title) => {
    return updateTask(title);
}