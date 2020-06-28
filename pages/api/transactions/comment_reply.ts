import envvar from "envvar";
import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "../utils";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const db = await connectToDatabase(envvar.string("MONGODB_URI"));
  const collection = await db.collection(
    "comments" + envvar.string("MONGO_DEV", "")
  );
  await collection.insertOne(req.body.comment);
  return res.status(200).json({ error: null });
};
