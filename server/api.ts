import axios from "axios";
import envvar from "envvar";
import { Router } from "express";
import moment from "moment";
import { decrypt, encrypt } from "./crypto";
import {
  commentTableQuery,
  pgQuery,
  transactionTableQuery,
  userTableQuery,
} from "./db";
import { checkAuth } from "./middleware";
import {
  client,
  getAverageSpendPerDay,
  getDaysSinceLastSpend,
  getSpendForMonth,
  PLAID_ENV,
  prettyPrintError,
  prettyPrintInfo,
  processComments,
  processPlaidTransactions,
  processTransactions,
} from "./utils";

const apiRoutes = Router();

// ###########  Plaid API ###########

apiRoutes.post("/plaid/get_access_token", (req, res) => {
  try {
    prettyPrintInfo(req.body);
    const { publicToken, uid } = req.body;
    client.exchangePublicToken(publicToken, async (error, tokenResponse) => {
      if (error != null) {
        prettyPrintError(error);
        return res.status(500).json({
          error,
        });
      }
      var accessTokenCtext = encrypt(tokenResponse.access_token);
      var itemId = tokenResponse.item_id;

      await pgQuery(userTableQuery);
      if (PLAID_ENV === "sandbox") {
        await pgQuery(
          "UPDATE users SET access_token=$1 item_id=$2 WHERE uid = $3",
          [accessTokenCtext, itemId, "sandbox"]
        );
      } else {
        await pgQuery(
          "UPDATE users SET access_token=$1 item_id=$2 WHERE uid = $3",
          [accessTokenCtext, itemId, uid]
        );
      }

      const { rows } = await pgQuery("SELECT * FROM users");
      prettyPrintInfo(rows);
      return res.status(200).json({ message: "token generated" });
    });
  } catch (error) {
    return res.status(500).json({
      error,
    });
  }
});

// Updates item for uid with the webhook (will be deprecrated, here for convenience)
apiRoutes.post("/plaid/webhook/update", async (req, res) => {
  const { uid } = req.body;
  try {
    const { rows } = await pgQuery("SELECT * FROM users WHERE uid = $1", [uid]);
    const accessTokenCtext = rows[0].access_token;

    if (!accessTokenCtext)
      return res.status(403).json({
        error: `No associated access_token for ${uid}`,
      });

    const accessToken = decrypt(accessTokenCtext);
    return client.updateItemWebhook(
      accessToken,
      envvar.string("PLAID_WEBHOOK"),
      (error, updateItemWebhookResponse) => {
        if (error != null) {
          prettyPrintError(error);
          return res.status(500).json({
            error,
          });
        }
        prettyPrintInfo(updateItemWebhookResponse);
        return res.status(200).json({
          error: null,
        });
      }
    );
  } catch (error) {
    return res.status(500).json({
      error,
    });
  }
});

// TODO: we can use this to grab the current month's transactions when the user signs up
apiRoutes.get("/plaid/transactions", async (req, res) => {
  const { uid } = req.query;
  const { rows } = await pgQuery("SELECT * FROM users WHERE uid = $1", [uid]);
  const accessTokenCtext = rows[0].access_token;

  if (!accessTokenCtext)
    return res.status(403).json({
      error: "Please add a bank account!",
    });

  const accessToken = decrypt(accessTokenCtext);
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
        transactions: processPlaidTransactions(transactionsResponse),
      });
    }
  );
});

// ###########  Email Octpus API ###########

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

// ########### Transactions API ###########

// Get all transactions for a given user
apiRoutes.get("/transactions", async (req, res) => {
  const { uid } = req.query;

  try {
    await pgQuery(transactionTableQuery);
    const { rows } = await pgQuery(
      "SELECT * FROM transactions WHERE uid = $1",
      [uid]
    );

    prettyPrintInfo(rows);
    return res.status(200).json({
      transactions: processTransactions(rows),
    });
  } catch (error) {
    prettyPrintError(error);
    return res.status(500).json({
      error,
    });
  }
});

apiRoutes.post("/transactions/create", checkAuth, async (req, res) => {
  const {
    uid,
    date,
    description,
    amount,
    category,
    reason,
  } = req.body.transaction;

  try {
    const {
      rows,
    } = await pgQuery(
      "INSERT INTO transactions(uid, date_time, description, amount, category) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [uid, date, description, amount, category]
    );
    prettyPrintInfo(rows);

    if (reason.length) {
      const commentRes = await pgQuery(
        "INSERT INTO comments(uid, transaction_id, parent_id, date_time, comment_text) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        [uid, rows[0].id, null, moment().toISOString(), reason]
      );

      return res.json({
        transaction: rows[0].id,
        comment: commentRes.rows[0].id,
      });
    } else {
      return res.json({
        transactions: processTransactions(rows),
      });
    }
  } catch (error) {
    prettyPrintError(error);
    return res.status(500).json({
      error,
    });
  }
});

apiRoutes.post("/transactions/delete", checkAuth, async (req, res) => {
  const { id } = req.body;

  try {
    const {
      rows,
    } = await pgQuery("DELETE from transactions WHERE id = $1 RETURNING id", [
      id,
    ]);
    prettyPrintInfo(rows);
    const deletedComments = await pgQuery(
      "DELETE from comments WHERE transaction_id = $1 RETURNING id",
      [id]
    );
    console.log("Deleted Comments:");
    prettyPrintInfo(deletedComments.rows);
    return res.status(200).json({ id });
  } catch (error) {
    prettyPrintError(error);
    return res.status(500).json({
      error,
    });
  }
});

// ########### Transaction Comments API ###########

// General query for comments
apiRoutes.get("/transactions/comments", async (req, res) => {
  const { transactionId, parentId } = req.query;
  try {
    //TODO: is there a smart sql way to grab the whole comment tree?
    //TODO: this is pretty brittle, id prefer a general query

    await pgQuery(commentTableQuery);

    const {
      rows,
    } = await pgQuery(
      "SELECT * FROM comments WHERE transaction_id = $1 OR parent_id = $2",
      [transactionId, parentId]
    );
    if (rows.length) prettyPrintInfo(rows);

    return res.json({
      error: null,
      comments: processComments(rows),
    });
  } catch (error) {
    prettyPrintError(error);
    return res.json({
      error,
      comments: [],
    });
  }
});

// Comment on a transaction
apiRoutes.post("/transactions/comment", async (req, res) => {
  const {
    comment: { uid, dateTime, text, transactionId },
  } = req.body;

  try {
    const {
      rows,
    } = await pgQuery(
      "INSERT INTO comments(uid, transaction_id, parent_id, date_time, comment_text) VALUES ($1, $2, $3, $4, $5)",
      [uid, transactionId, null, dateTime, text]
    );

    prettyPrintInfo(rows);
    return res.json({
      error: null,
      comments: rows,
    });
  } catch (error) {
    prettyPrintError(error);
    return res.json({
      error,
      comments: [],
    });
  }
});

// Reply to a comment
apiRoutes.post("/transactions/comments/reply", async (req, res) => {
  const {
    comment: { uid, dateTime, text, parentId },
  } = req.body;

  try {
    const {
      rows,
    } = await pgQuery(
      "INSERT INTO comments(uid, transaction_id, parent_id, date_time, comment_text) VALUES ($1, $2, $3, $4, $5)",
      [uid, null, parentId, dateTime, text]
    );

    prettyPrintInfo(rows);
    return res.json({
      error: null,
      comments: rows,
    });
  } catch (error) {
    prettyPrintError(error);
    return res.json({
      error,
      comments: [],
    });
  }
});

// ########### Users API ###########

// get a user and displayName by UID
//TODO: can postgres select particular fields?
apiRoutes.get("/users", async (req, res) => {
  const { uid } = req.query;

  try {
    const { rows } = await pgQuery("SELECT * FROM users WHERE uid = $1", [uid]);

    prettyPrintInfo(rows);
    return res.json({
      user: { uid: rows[0].uid, displayName: rows[0].display_name },
      error: null,
    });
  } catch (error) {
    prettyPrintError(error);
    return res.json({
      user: null,
      error,
    });
  }
});

// Create a new user (without plaid credentials)
apiRoutes.post("/users/create", async (req, res) => {
  const { uid } = req.body;

  try {
    await pgQuery(
      "INSERT INTO users(uid, display_name, access_token, item_id) VALUES ($1, $2, $3, $4)",
      [uid, `spender${uid.slice(0, 8)}`, null, null]
    );

    return res.json({
      error: null,
    });
  } catch (error) {
    prettyPrintError(error);
    return res.json({
      error,
    });
  }
});

// Set the display name for a user
apiRoutes.post("/users/set_display_name", checkAuth, async (req, res) => {
  const { uid, displayName } = req.body;

  try {
    await pgQuery("UPDATE users SET display_name=$1 WHERE uid = $2", [
      displayName,
      uid,
    ]);

    return res.json({
      error: null,
    });
  } catch (error) {
    prettyPrintError(error);
    return res.json({
      error,
    });
  }
});

// ########### Statistics API ###########

// Get relevant statistics for a uid
apiRoutes.get("/stats", async (req, res) => {
  const { uid, dateTime } = req.query;

  try {
    const { rows } = await pgQuery(
      "SELECT * FROM transactions WHERE uid = $1",
      [uid]
    );

    const transactions = processTransactions(rows);
    if (!transactions.length)
      return res.json({
        stats: null,
      });
    const stats = {
      currentMonthSpend: getSpendForMonth(transactions, dateTime as string),
      daysSinceLastSpend: getDaysSinceLastSpend(
        transactions,
        dateTime as string
      ),
      avgSpendPerDay: getAverageSpendPerDay(transactions),
    };
    prettyPrintInfo(stats);

    return res.json({
      stats,
    });
  } catch (error) {
    prettyPrintError(error);
    return res.status(500).json({
      error,
    });
  }
});

export default apiRoutes;
