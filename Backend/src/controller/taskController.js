
import {
    fetchAllTasks,
    addTitle,
    updateTitle,
    deleteTaskService,
    fetchTaskById
} from "../services/taskServices.js";

import AppError from "../utils/AppError.js";

// GET ALL TASKS
export const getTask = async (req, res, next) => {
    try {
        const page = Number(req.query.page);
        const offset = Number(req.query.offset);
        if (!Number.isInteger(page) || page < 1) {
            throw new AppError("Page must be a positive integer", 400);
        }
        if (!Number.isInteger(offset) || offset < 1) {
            throw new AppError("Offset must be a positive integer", 400);
        }

        const completedQuery = req.query.completed;
        let completed = null;
        if (completedQuery !== undefined) {
            if (completedQuery !== "true" && completedQuery !== "false") {
                throw new AppError("Completed must be true or false", 400);
            }
            completed = completedQuery === "true";
        }

        const title = req.query.title;
        if (title !== undefined && typeof title !== "string") {
            throw new AppError("Title must be a string", 400);
        }
        const sortBy = req.query.sortBy;
        const order = req.query.order;
        const { rows, totalCount } = await fetchAllTasks(
            page,
            offset,
            completed,
            title ?? null,
            sortBy,
            order
        );
        return res.status(200).json({
            success: true,
            data: rows,
            meta: { page, offset, totalCount },
        });
    } catch (err) {
        next(err);
    }
};


// CREATE TASK
export const addTask = async (req, res, next) => {
    try {
        const { title } = req.body;
        if (typeof title !== "string" || title.trim() === "") {
            throw new AppError("Title is required", 400);
        }
        const task = await addTitle(title.trim());
        return res.status(201).json({
            success: true,
            message: "Task created successfully",
            data: task,
        });

    } catch (err) {
        next(err);
    }
};


// UPDATE TASK
export const updateTask = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const { title, completed } = req.body;

        if (!Number.isInteger(id) || id <= 0) {
            throw new AppError("Invalid task ID", 400);
        }

        if (title !== undefined &&
            (typeof title !== "string" || title.trim() === "")) {
            throw new AppError("Invalid title", 400);
        }

        if (completed !== undefined &&
            typeof completed !== "boolean") {
            throw new AppError("Completed must be a boolean", 400);
        }

        if (title === undefined && completed === undefined) {
            throw new AppError("No fields provided for update", 400);
        }

        const updatedTask = await updateTitle({
            ...req.body,
            ...(title !== undefined && { title: title.trim() }),
            id
        });
        if (!updatedTask) {
            throw new AppError("Task not found", 404);
        }

        return res.status(200).json({
            success: true,
            message: "Task updated successfully",
            data: updatedTask,
        });

    } catch (err) {
        next(err);
    }
};


// DELETE TASK
export const deleteTask = async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            throw new AppError("Invalid task ID", 400);
        }

        const deletedTask = await deleteTaskService(id);
        if (!deletedTask) {
            throw new AppError("Task not found", 404);
        }

        return res.status(200).json({
            success: true,
            message: "Task deleted successfully",
        });

    } catch (err) {
        next(err);
    }
};


// GET SINGLE TASK
export const fetchSingleTask = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            throw new AppError("Invalid task ID", 400);
        }
        const task = await fetchTaskById(id);
        return res.status(200).json({
            success: true,
            data: task,
        });

    } catch (err) {
        next(err);
    }
};
