import { Pool } from 'pg';

const db = new Pool({
  connectionString: process.env.DB_URI,
});
export default db;
