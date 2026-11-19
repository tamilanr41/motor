import mysql from 'mysql2/promise';
import 'dotenv/config';

const ssl = process.env.DB_SSL === 'true'
  ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
  : undefined;

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
  charset: 'utf8mb4',
  ...(ssl ? { ssl } : {})
});

export async function query(sql, params = {}) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}
