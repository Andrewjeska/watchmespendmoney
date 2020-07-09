import envvar from "envvar";
import { NextApiRequest, NextApiResponse } from "next";
import { prettyPrintInfo } from "../../../utils/index";
import { connectToDatabase } from "../utils";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const db = await connectToDatabase(envvar.string("MONGODB_URI"));
  const collection = await db.collection(
    "comments" + envvar.string("MONGO_DEV", "")
  );

  prettyPrintInfo(req.query);
  const commentObj = await collection.find(req.query).toArray();
  prettyPrintInfo(commentObj);
  return res.json({
    error: null,
    comments: commentObj,
  });
};
