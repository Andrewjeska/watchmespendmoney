import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const userTableQuery = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid TEXT,
  access_token TEXT,
  item_id TEXT
);
`;

export const query = async (text: string, params: any = []) => {
  return await pool.query(text, params);
};
