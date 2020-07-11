import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const query = async (text: string, params: any = []) => {
  return await pool.query(text, params);
};
