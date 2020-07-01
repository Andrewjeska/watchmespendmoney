import envvar from "envvar";
import { NextApiRequest, NextApiResponse } from "next";
import { prettyPrintError } from "../../utils/index";
import { client, connectToDatabase } from "../utils";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { publicToken, userName } = req.body;

  const db = await connectToDatabase(envvar.string("MONGODB_URI"));
  const collection = await db.collection("users");

  client.exchangePublicToken(publicToken, async (error, tokenResponse) => {
    if (error != null) {
      prettyPrintError(error);
      return res.status(500).json({
        error,
      });
    }
    var accessToken = tokenResponse.access_token;
    var itemId = tokenResponse.item_id;

    var obj = { user: userName, accessToken, itemId };
    await collection.insertOne(obj);
    return res.status(200).json({ message: "token generated" });
  });
};
