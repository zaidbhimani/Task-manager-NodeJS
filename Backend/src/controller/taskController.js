import { fetchAllTasks, addTitle, updateTitle, deleteTaskService } from "../services/taskServices.js";

export const sendTask = async (req, res, next) => {
    const tasks = await fetchAllTasks();
    try {
        return res.status(200).json({
            success: true,
            data: tasks,
        });
    } catch (err) {
        next(err)
    }
}


export const addTask = async (req, res) => {
    const { title } = req.body
    if (typeof title == "string" || title.trim() !== "") {
        await addTitle(title.trim());
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

export const updateTask = async (req, res) => {
    const { title } = req.body

    if (typeof title == "string" || title.trim() !== "") {
        await updateTitle({
            ...req.body,
            id: Number(req.params.id),
            completed: req.body.completed ?? false
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


export const deleteTask = async(req, res) => {
    const { id } = req.params;
    if (id != null) {
        await deleteTaskService(id)
      return res.status(200).json({
            success: "Task deleted successfully",
        })
    }
    else{
         return res.status(200).json({
            success: error,
            data:"Not able to delete"
        })
    }

}
