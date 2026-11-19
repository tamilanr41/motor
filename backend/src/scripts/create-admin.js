import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool, query } from '../config/db.js';

const [emailArg,nameArg,passwordArg]=process.argv.slice(2);
const email=(emailArg||process.env.ADMIN_EMAIL||'').trim().toLowerCase();
const name=nameArg||process.env.ADMIN_NAME||'Lakshmi Agency Admin';
const password=passwordArg||process.env.ADMIN_PASSWORD;
if(!email||!password||password.length<12){
  console.error('Usage: npm run seed:admin -- <email> "Admin Name" <password (12+ chars)>');
  console.error('Set the initial password in your shell, not in source files.');
  process.exit(1);
}
try {
  const hash=await bcrypt.hash(password,12);
  await query('INSERT INTO admins(name,email,password_hash,role) VALUES(?,?,?,\'owner\') ON DUPLICATE KEY UPDATE name=VALUES(name),password_hash=VALUES(password_hash),active=1',[name,email,hash]);
  console.log(`Admin account ready for ${email}`);
} finally { await pool.end(); }
