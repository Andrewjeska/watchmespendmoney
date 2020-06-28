import envvar from "envvar";
import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "../utils";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const db = await connectToDatabase(envvar.string("MONGODB_URI"));
  const collection = await db.collection(
    "comments" + envvar.string("MONGO_DEV", "")
  );
  const commentObj = await collection.find(req.query).toArray();
  return res.json({
    error: null,
    comments: commentObj,
  });
};
