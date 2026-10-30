import pool from "../config/db.js";


export const getAllTasks = async () => {
    const result = await pool.query(
        "SELECT id, title, completed, created_at FROM tasks ORDER BY id ASC"
    );

    return result.rows;
};

export const addNewTask = async(title) => {
    const result = await pool.query(
        `INSERT INTO tasks (title)
     VALUES ($1)
     RETURNING id, title, completed, created_at`,
        [title]
    );
    return result.rows[0];
}


export const updateTask = async(updates) => {
     const fields = [];
  const values = [];

  if (updates.title !== undefined) {
    values.push(updates.title);
    fields.push(`title = $${values.length}`);
  }

  if (updates.completed !== undefined) {
    values.push(updates.completed);
    fields.push(`completed = $${values.length}`);
  }

  if (fields.length === 0) {
    return null;
  }

  values.push(updates.id);

  const result = await pool.query(
    `UPDATE tasks
     SET ${fields.join(", ")}
     WHERE id = $${values.length}
     RETURNING id, title, completed, created_at`,
    values
  );

  return result.rows[0] ?? null;
}

export const deleteTask = async (id) => {
  const result = await pool.query(
    `DELETE FROM tasks
     WHERE id = $1
     RETURNING id, title, completed, created_at`,
    [id]
  );

  return result.rows[0] ?? null;
};