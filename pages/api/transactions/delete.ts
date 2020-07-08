import envvar from "envvar";
import { ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import { prettyPrintError, prettyPrintInfo } from "../../../utils";
import { connectToDatabase } from "../utils";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const db = await connectToDatabase(envvar.string("MONGODB_URI"));
  const collection = await db.collection("transactions");
  prettyPrintInfo(req.body);
  const { _id } = req.body;
  try {
    await collection.deleteOne({ _id: new ObjectId(_id) });
  } catch (error) {
    prettyPrintError(error);
    return res.status(500).json({ error });
  }

  // delete associated comments
  try {
    const collection = await db.collection(
      "comments" + envvar.string("MONGO_DEV", "")
    );
    await collection.deleteMany({ transactionId: _id });
    return res.status(200).json({ error: null });
  } catch (error) {
    prettyPrintError(error);
    return res.status(500).json({ error });
  }
};
