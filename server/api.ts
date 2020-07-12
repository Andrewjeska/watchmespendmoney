import axios from "axios";
import envvar from "envvar";
import { Router } from "express";
import moment from "moment";
import {
  commentTableQuery,
  pgQuery,
  transactionTableQuery,
  userTableQuery,
} from "./db";
import {
  client,
  prettyPrintError,
  prettyPrintInfo,
  processComments,
  processPlaidTransactions,
  processTransactions,
} from "./utils";

const apiRoutes = Router();

// ###########  Plaid API ###########

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
    return res.json({
      error: null,
      transactions: processTransactions(rows),
    });
  } catch (error) {
    prettyPrintError(error);
    return res.json({
      error,
      transactions: [],
    });
  }
});

apiRoutes.post("/transactions/delete", async (req, res) => {
  const {
    uid,
    date,
    description,
    amount,
    category,
    reason,
  } = req.body.transaction;

  prettyPrintInfo(req.body);

  try {
    const {
      rows,
    } = await pgQuery(
      "INSERT INTO transactions(uid, date_time, description, amount, category) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [uid, date, description, amount, category]
    );
    prettyPrintInfo(rows);

    if (reason.length) {
      prettyPrintInfo("hit");
      const commentRes = await pgQuery(
        "INSERT INTO comments(uid, transaction_id, parent_id, date_time, comment_text) VALUES ($1, $2, $3, $4, $5)",
        [uid, rows[0].id, null, moment(), reason]
      );

      return res.json({
        error: null,
        transactions: processTransactions(rows),
        comments: processComments(commentRes.rows),
      });
    } else {
      return res.json({
        error: null,
        transactions: processTransactions(rows),
      });
    }
  } catch (error) {
    prettyPrintError(error);
    return res.json({
      error,
      transactions: [],
    });
  }
});

apiRoutes.post("/transactions/delete", async (req, res) => {
  const { id } = req.body;

  try {
    await pgQuery("DELETE from transactions WHERE id = $1", [id]);
    await pgQuery("DELETE from comments WHERE transaction_id = $1", [id]);
    return res.status(200);
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
      `SELECT * FROM comments WHERE transaction_id = $1 OR parent_id = $2`,
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

export default apiRoutes;
