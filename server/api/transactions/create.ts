import envvar from "envvar";
import moment from "moment";
import { NextApiRequest, NextApiResponse } from "next";
import { prettyPrintInfo } from "../../../utils";
import { connectToDatabase } from "../utils";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const db = await connectToDatabase(envvar.string("MONGODB_URI"));
  const collection = await db.collection("transactions");
  const {
    uid,
    user,
    amount,
    date,
    category,
    description,
    reason,
  } = req.body.transaction;
  const transactionDbRes = await collection.insertOne({
    uid,
    user,
    amount,
    date,
    category,
    description,
  });
  prettyPrintInfo(transactionDbRes.ops);
  if (reason.length) {
    const collection = await db.collection(
      "comments" + envvar.string("MONGO_DEV", "")
    );
    const commentDbRes = await collection.insertOne({
      dateTime: moment().toDate(),
      text: reason,
      transactionId: transactionDbRes.insertedId.toString(),
      user: user,
    });
    prettyPrintInfo(commentDbRes.ops);
  }
  return res.status(200).json({ error: null });
};
