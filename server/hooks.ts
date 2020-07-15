import { Router } from "express";
import _ from "lodash";
import moment from "moment";
import { plaidTransactionsWebhook } from "./constants";
import { pgQuery } from "./db";
import {
  client,
  prettyPrintError,
  prettyPrintInfo,
  processPlaidTransactions,
} from "./utils";

const webhookRoutes = Router();

webhookRoutes.post("/plaid", async (req, res) => {
  if (!req.body.webhook_type) {
    prettyPrintError(new Error("Plaid Webhook is malformed"));
    prettyPrintError(req.body.error);
    return res.status(500).end();
  }

  switch (req.body.webhook_type) {
    case plaidTransactionsWebhook:
      await transactionsWebhookHandler(req.body, res);

    case "WEBHOOK_UPDATE_ACKNOWLEDGED":
      prettyPrintInfo(req.body);

    default:
      prettyPrintInfo("Received unsupported Plaid Webhook");
      prettyPrintInfo(req.body);
      return res.status(200).end();
  }
});

interface TransactionsWebhook {
  webhook_type: string;
  webhook_code: string;
  item_id: string;
  error: Error;
  new_transactions?: number;
  removed_transactions: Array<string>;
}

export const transactionsWebhookHandler = async (
  webhook: TransactionsWebhook,
  res: any
) => {
  const {
    webhook_type,
    webhook_code,
    item_id,
    error,
    new_transactions,
    removed_transactions,
  } = webhook;

  if (error) {
    prettyPrintError(error);
    res.status(500).end();
  } else {
    res.status(200).end();

    // get user uid by item_id
    try {
      const { rows } = await pgQuery("SELECT * FROM users WHERE item_id = $1", [
        item_id,
      ]);

      // it is NOT possible for another user to have a different plaid item_id
      const uid = rows[0].uid;
      const accessToken = rows[0].access_token;

      switch (webhook_code) {
        case "INITIAL_UPDATE":
        // case "HISTORICAL_UPDATE":
        case "DEFAULT_UPDATE":
          await addTransactions(uid, accessToken, new_transactions as number);

        case "TRANSACTIONS_REMOVED":
          prettyPrintInfo("no-op");

        default:
          prettyPrintInfo("received unsupposed transaction webhook code");
      }
    } catch (err) {
      prettyPrintError(err);
      res.status(500).end();
    }
  }
};

const addTransactions = async (
  uid: string,
  accessToken: string,
  numTransactions: number
) => {
  // make a call to the plaid api to get the new transactions
  return client.getTransactions(
    accessToken,
    moment().subtract(1, "week").format("YYYY-MM-DD"),
    moment().format("YYYY-MM-DD"),
    {
      count: numTransactions,
      offset: 0,
    },
    (error, transactionsResponse) => {
      if (error != null) {
        prettyPrintError(error);
        return;
      }
      const transactions = processPlaidTransactions(transactionsResponse);
      _.map(transactions, async (transaction) => {
        const { date, description, amount, category, id } = transaction;
        const {
          rows,
        } = await pgQuery(
          "INSERT INTO transactions(uid, plaidId, date_time, description, amount, category) VALUES ($1, $2, $3, $4, $5) RETURNING id",
          [uid, id, date, description, amount, category]
        );
      });
    }
  );
};

export default webhookRoutes;
