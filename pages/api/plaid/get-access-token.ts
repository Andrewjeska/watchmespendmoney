import { NextApiRequest, NextApiResponse } from "next";
import { prettyPrintError, prettyPrintInfo } from "../../../utils";
import { client } from "../../../utils/plaid";

export default (req: NextApiRequest, res: NextApiResponse) => {
  var publicToken = req.body.publicToken;
  return client.exchangePublicToken(publicToken, (error, tokenResponse) => {
    if (error != null) {
      prettyPrintError(error);
      return res.status(500).json({
        error,
      });
    }
    var accessToken = tokenResponse.access_token;
    var itemId = tokenResponse.item_id;
    prettyPrintInfo(tokenResponse);
    // TODO: put this into mongo

    return res.status(200);
  });
};
