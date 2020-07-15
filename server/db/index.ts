import { Pool, PoolClient, QueryConfig } from "pg";
import { prettyPrintError } from "../utils";

const maxConnections = process.env.NODE_ENV === "production" ? 10 : 5;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: maxConnections,
});

export const userTableQuery = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid TEXT NOT NULL,
  access_token TEXT,
  display_name TEXT,
  item_id TEXT 
);
`;

export const commentTableQuery = `
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid TEXT,
  transaction_id TEXT,
  parent_id TEXT,
  date_time timestamptz,
  comment_text TEXT NOT NULL;
);
`;

export const transactionTableQuery = `
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plaidId TEXT,
  uid TEXT NOT NULL,
  date_time timestamptz,
  description TEXT,
  amount FLOAT(2),	
  category TEXT
);
`;

export const pgQuery = async (text: string | QueryConfig, params: any = []) => {
  var client: PoolClient | null = null;
  try {
    client = await pool.connect();
    const queryRes = await client.query(text, params);
    return queryRes;
  } catch (error) {
    prettyPrintError(error);
    throw error;
  } finally {
    if (client) client.release();
  }
};
