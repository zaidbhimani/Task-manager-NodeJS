import { fetchAllTasks, addTitle, updateTitle } from "../services/taskServices.js";

export const sendTask = (req, res) => {
    const tasks = fetchAllTasks();
    res.status(200).json({
        success: true,
        data: tasks,
    });
}


export const addTask = (req, res) => {
     console.log(req.body);
    const { title } = req.body
    if (typeof title == "string" || title.trim() !== "") {
        addTitle(title.trim());
        res.status(201).json({
            success: "Task created successfully",
            data: title,
        });
    } else {
        res.status(400).json({
            success: error,
            data: "Title is required",
        });
    }
}

export const updateTask = (req, res) => {
    console.log(req.body,req.params.id);
    const { title } = req.body
    
    if (typeof title == "string" || title.trim() !== "") {
        updateTitle({
            ...req.body,
            id: Number(req.params.id)
        });
        res.status(201).json({
            success: "Task updated successfully",
            data: title,
        });
    } else {
        res.status(400).json({
            success: error,
            data: "Title and id is required",
        });
    }
}
