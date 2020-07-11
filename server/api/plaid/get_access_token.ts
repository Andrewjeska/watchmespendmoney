import { NextApiRequest, NextApiResponse } from "next";
import { prettyPrintInfo } from "../../../utils/index";
import { query } from "../../db";

const userTable = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE TEMP TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT,
  access_token TEXT
);
`;

const createTableText = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE TEMP TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data JSONB
);
`;

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { publicToken, userName } = req.body;

  var obj = { user: "test", accessToken: "" };
  // await collection.insertOne(obj);
  const tableRes = await query(userTable);
  console.log("yes");
  prettyPrintInfo(tableRes);
  const dbRes = await query(
    "INSERT INTO users(username, access_token) VALUES ($1, $2)",
    ["test", "token"]
  );

  const { rows } = await query("SELECT * FROM users");

  prettyPrintInfo(rows);
  return res.status(200).json({ message: "token generated" });

  // const db = await connectToDatabase(envvar.string("MONGODB_URI"));
  // const collection = await db.collection("users");

  // client.exchangePublicToken(publicToken, async (error, tokenResponse) => {
  //   if (error != null) {
  //     prettyPrintError(error);
  //     return res.status(500).json({
  //       error,
  //     });
  //   }
  //   var accessToken = tokenResponse.access_token;
  //   var itemId = tokenResponse.item_id;

  //   var obj = { user: userName, accessToken, itemId };
  //   // await collection.insertOne(obj);
  //   const tableRes = await query(userTable);
  //   const dbRes = await query("INSERT INTO users(data) VALUES($1)", [obj]);

  //   const { rows } = await query("SELECT * FROM users");

  //   prettyPrintInfo(rows);
  //   return res.status(200).json({ message: "token generated" });
  // });
};
