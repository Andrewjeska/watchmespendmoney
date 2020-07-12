import { Pool } from "pg";

const maxConnections = process.env.NODE_ENV === "development" ? 5 : 10;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: maxConnections,
});

export const userTableQuery = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid TEXT,
  access_token TEXT,
  item_id TEXT
);
`;

export const commentTableQuery = `
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid TEXT NULL,
  transaction_id TEXT NULL,
  parent_id TEXT NULL,
  date_time timestamptz,
  comment_text TEXT
);
`;

export const transactionTableQuery = `
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid TEXT NULL,
  date_time timestamptz,
  description TEXT,
  amount FLOAT(2),	
  category TEXT
);
`;

export const pgQuery = async (text: string, params: any = []) => {
  const client = await pool.connect();
  const queryRes = await client.query(text, params);
  client.release();
  return queryRes;
};
