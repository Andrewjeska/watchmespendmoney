import envvar from "envvar";
import { NextApiRequest, NextApiResponse } from "next";
import { prettyPrintError, prettyPrintInfo } from "../../../utils";
import { connectToDatabase } from "../utils";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const db = await connectToDatabase(envvar.string("MONGODB_URI"));
  const collection = await db.collection("transactions");
  prettyPrintInfo(req.query);
  const { _id } = req.query;
  try {
    const deleteTrans = await collection.deleteOne({ _id });
    prettyPrintInfo(deleteTrans);
  } catch (error) {
    prettyPrintError(error);
    return res.status(500).json({ error });
  }

  // delete associated comments
  try {
    const collection = await db.collection(
      "comments" + envvar.string("MONGO_DEV", "")
    );
    const deleteComments = await collection.deleteMany({ transactionId: _id });
    prettyPrintInfo(deleteComments);
    return res.status(200).json({ error: null });
  } catch (error) {
    prettyPrintError(error);
    return res.status(500).json({ error });
  }
};
