import mysql from 'mysql2/promise';
import dns from 'node:dns';
import net from 'node:net';
import 'dotenv/config';

// Hostinger's hostname resolves to both A and AAAA records, but Render cannot
// reach the IPv6 endpoint. Prefer IPv4 so MySQL connections don't fail with
// ENETUNREACH before the retry logic can help.
dns.setDefaultResultOrder?.('ipv4first');
net.setDefaultAutoSelectFamily?.(true);

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
  connectTimeout: 10000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  namedPlaceholders: true,
  charset: 'utf8mb4',
  ...(ssl ? { ssl } : {})
});

const transientCodes = new Set(['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'EPIPE', 'ECONNABORTED', 'ENETUNREACH', 'EHOSTUNREACH', 'EAI_AGAIN', 'PROTOCOL_CONNECTION_LOST', 'ER_CON_COUNT_ERROR']);
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function isTransient(err) {
  if (!err) return false;
  if (err.name === 'AggregateError' || transientCodes.has(err.code)) return true;
  return Array.isArray(err.errors) && err.errors.some(isTransient);
}

export async function query(sql, params = {}) {
  const retryable = /^\s*(SELECT|SHOW|EXPLAIN)\b/i.test(sql.trim());
  let lastError;
  for (let attempt = 0; attempt < (retryable ? 3 : 1); attempt += 1) {
    try {
      const [rows] = await pool.execute(sql, params);
      return rows;
    } catch (err) {
      lastError = err;
      if (!retryable || !isTransient(err) || attempt === 2) throw err;
      await wait(150 * (attempt + 1));
    }
  }
  throw lastError;
}
