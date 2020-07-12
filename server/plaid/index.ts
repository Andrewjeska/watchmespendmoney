import { Router } from "express";
import moment from "moment";
import { query, userTableQuery } from "../db";
import {
  client,
  prettyPrintError,
  prettyPrintInfo,
  processTransactions,
} from "../utils";

// This route is hit when the user authenticates with Plaid
const plaidAPI = Router();

plaidAPI.post("/plaid/get_access_token", (req, res) => {
  prettyPrintInfo(req.body);
  const { publicToken, uid } = req.body;
  client.exchangePublicToken(publicToken, async (error, tokenResponse) => {
    if (error != null) {
      prettyPrintError(error);
      return res.status(500).json({
        error,
      });
    }
    var accessToken = tokenResponse.access_token;
    var itemId = tokenResponse.item_id;

    await query(userTableQuery);
    await query(
      "INSERT INTO users(uid, access_token, item_id) VALUES ($1, $2, $3)",
      [uid, accessToken, itemId]
    );

    const { rows } = await query("SELECT * FROM users");

    prettyPrintInfo(rows);
    return res.status(200).json({ message: "token generated" });
  });
});

// TODO: we should periodically hit this endpoint, or abstract this to a function or something
plaidAPI.get("/plaid/transactions", async (req, res) => {
  const { uid } = req.query;
  const { rows } = await query("SELECT * FROM users WHERE uid = $1", [uid]);
  const accessToken = rows[0].access_token;

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

      return res.json({
        error: null,
        transactions: processTransactions(transactionsResponse),
      });
    }
  );
});

export default plaidAPI;
