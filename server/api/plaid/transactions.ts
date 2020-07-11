import envvar from "envvar";
import _ from "lodash";
import moment from "moment";
import { NextApiRequest, NextApiResponse } from "next";
import { prettyPrintError } from "../../../utils";
import { client, connectToDatabase, processTransactions } from "../utils";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const db = await connectToDatabase(envvar.string("MONGODB_URI"));
  const collection = await db.collection("users");
  //TODO: how to do DB stuff right?

  const transactionCollection = await db.collection("plaidTransactions");
  // await transactionCollection.drop();

  const trans = await transactionCollection.find({}).toArray();
  if (trans.length) {
    return res.json({
      error: null,
      transactions: _(trans).sortBy("date").reverse().value(),
    });
  }

  const user = req.query.user || "m.anderjaska@gmail.com";
  const userObj = await collection.find({ user }).toArray();
  const accessToken = userObj[0].accessToken;

  if (!accessToken)
    return res.status(403).json({
      error: "Please add a bank account!",
    });

  const startDate = moment("2020-06-01").format("YYYY-MM-DD");
  const endDate = moment().format("YYYY-MM-DD");
  return client.getTransactions(
    accessToken,
    startDate,
    endDate,
    {
      count: 100,
      offset: 0,
    },
    (error, transactionsResponse) => {
      if (error != null) {
        prettyPrintError(error);
        return res.json({
          transactions: [],
          error,
        });
      }
      const transactions = processTransactions(transactionsResponse);
      if (!trans.length) transactionCollection.insertMany(transactions);

      return res.json({
        error: null,
        transactions,
      });
    }
  );
};
