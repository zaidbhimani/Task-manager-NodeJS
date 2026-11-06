import pool from "../config/db.js";


export const getAllTasks = async (startIndex, pageSize, completed, title, sortBy, order) => {
  const filters = `
    WHERE ($1::boolean IS NULL OR completed = $1)
      AND ($2::text IS NULL OR title ILIKE '%' || $2 || '%')
  `;
  const filterValues = [completed, title];
  const countResult = await pool.query(
    `SELECT COUNT(*) AS total_count FROM tasks ${filters}`,
    filterValues
  );
  const stableOrder = sortBy === "created_at"
    ? `${sortBy} ${order}, id ASC`
    : `${sortBy} ${order}`;
  const tasksResult = await pool.query(
    `SELECT id, title, completed, created_at
     FROM tasks
     ${filters}
     ORDER BY ${stableOrder}
     LIMIT $3 OFFSET $4`,
    [...filterValues, pageSize, startIndex]
  );

  return {
    rows: tasksResult.rows,
    totalCount: Number(countResult.rows[0].total_count),
  };
};

export const addNewTask = async (title) => {
  const result = await pool.query(
    `INSERT INTO tasks (title)
     VALUES ($1)
     RETURNING id, title, completed, created_at`,
    [title]
  );
  return result.rows[0];
}


export const updateTask = async (updates) => {
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

export const getTaskById = async (id) => {
  const result = await pool.query(
    "SELECT * FROM tasks WHERE id = $1",
    [id]
  );

  return result.rows[0];
};