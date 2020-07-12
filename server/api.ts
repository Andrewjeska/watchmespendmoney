import axios from "axios";
import envvar from "envvar";
import { Router } from "express";
import moment from "moment";
import { pgQuery, userTableQuery } from "./db";
import {
  client,
  prettyPrintError,
  prettyPrintInfo,
  processTransactions,
} from "./utils";

const apiRoutes = Router();

// Plaid

apiRoutes.post("/plaid/get_access_token", (req, res) => {
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

    await pgQuery(userTableQuery);
    await pgQuery(
      "INSERT INTO users(uid, access_token, item_id) VALUES ($1, $2, $3)",
      [uid, accessToken, itemId]
    );

    const { rows } = await pgQuery("SELECT * FROM users");

    prettyPrintInfo(rows);
    return res.status(200).json({ message: "token generated" });
  });
});

// TODO: we should periodically hit this endpoint, or abstract this to a function or something
apiRoutes.get("/plaid/transactions", async (req, res) => {
  const { uid } = req.query;
  const { rows } = await pgQuery("SELECT * FROM users WHERE uid = $1", [uid]);
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

// Email sign-ups

apiRoutes.post("/email", async (req, res) => {
  const { email } = req.body;

  const url = `https://emailoctopus.com/api/1.5/lists/${envvar.string(
    "EMAIL_OCTOPUS_LIST_ID"
  )}/contacts`;

  try {
    const eo_res = await axios.post(url, {
      api_key: envvar.string("EMAIL_OCTOPUS_API_KEY"),
      email_address: email,
    });
    return res.status(200).json({ message: `submitted ${email}` });
  } catch (error) {
    prettyPrintError(error.response);
    return res.status(500).json({
      error,
    });
  }
});

export default apiRoutes;
