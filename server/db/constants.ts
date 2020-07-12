// Queries
export const userTableQuery = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid TEXT,
  access_token TEXT,
  item_id TEXT
);
`;
