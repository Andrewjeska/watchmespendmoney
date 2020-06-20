import envvar from "envvar";
import moment from "moment";
import { NextApiRequest, NextApiResponse } from "next";
import { prettyPrintError, prettyPrintInfo } from "../../../utils";
import { client, connectToDatabase, processTransactions } from "./utils";

//TODO: generalize
//Hard code my account info for mvp
const user = "m.anderjaska@gmail.com";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const db = await connectToDatabase(envvar.string("MONGODB_URI"));
  const collection = await db.collection("users");
  //TODO: how to do DB stuff right?
  const userObj = await collection.find({ user }).toArray();
  prettyPrintInfo(userObj[0]);
  const accessToken = userObj[0].accessToken;

  if (!accessToken)
    return res.status(403).json({
      error: "Please authenticate with your bank(s)",
    });

  const startDate = moment().startOf("month").format("YYYY-MM-DD");
  const endDate = moment().endOf("month").format("YYYY-MM-DD");
  return client.getTransactions(
    accessToken,
    startDate,
    endDate,
    {
      count: 20,
      offset: 0,
    },
    (error, transactionsResponse) => {
      if (error != null) {
        prettyPrintError(error);
        return res.json({
          error,
        });
      }
      prettyPrintInfo(transactionsResponse);
      return res.json({
        error: null,
        transactions: processTransactions(transactionsResponse),
      });
    }
  );
};
