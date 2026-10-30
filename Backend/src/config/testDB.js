import pool from "./db.js";

try {
  const result = await pool.query(
    "SELECT NOW() AS current_time"
  );

  console.log("Database connected successfully!");
  console.log(result.rows[0]);
} catch (error) {
  console.error("Database connection failed:", error.message);
} finally {
  await pool.end();
}