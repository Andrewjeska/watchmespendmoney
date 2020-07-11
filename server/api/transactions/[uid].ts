import envvar from "envvar";
import _ from "lodash";
import { NextApiRequest, NextApiResponse } from "next";
import { prettyPrintInfo } from "../../../utils/index";
import { connectToDatabase } from "../utils";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const {
    query: { uid },
  } = req;

  const db = await connectToDatabase(envvar.string("MONGODB_URI"));
  const collection = await db.collection("transactions");
  const transactions = await collection.find({ uid }).toArray();
  prettyPrintInfo(transactions);
  return res.json({
    error: null,
    transactions: _.map(transactions, (t) => {
      t.amount = parseFloat(t.amount);
      return t;
    }),
  });
};
