import axios from "axios";
import envvar from "envvar";
import { Request, Response, Router } from "express";
import rateLimit from "express-rate-limit";
import admin from "firebase-admin";
import _ from "lodash";
import moment from "moment";
import { decrypt, encrypt } from "./crypto";
import {
  commentTableQuery,
  pgQuery,
  transactionTableQuery,
  userTableQuery,
} from "./db";
import {
  adminOnly,
  checkAuth,
  returnValidationErrors,
  textValidator,
  validateComment,
  validateTransaction,
} from "./middleware";
import {
  client,
  getAverageSpendPerDay,
  getDaysSinceLastSpend,
  getSpendForMonth,
  PLAID_ENV,
  prettyPrintError,
  prettyPrintInfo,
  processNewComment,
  processPlaidTransactions,
  processTransactionComments,
  processTransactions,
} from "./utils";

const apiRoutes = Router();

// ###########  Plaid API ###########

apiRoutes.post("/plaid/add_item", adminOnly, async (req, res) => {
  try {
    const { publicToken, uid } = req.body;

    const tokenResponse = await client.exchangePublicToken(publicToken);

    const accessToken = tokenResponse.access_token;
    const itemId = tokenResponse.item_id;

    const accountInfo = await client.getAccounts(accessToken);
    prettyPrintInfo(accountInfo);

    const accounts = _.map(accountInfo.accounts, (account) => {
      return { name: account.name, mask: account.mask };
    });

    const accessTokenCtext = encrypt(accessToken);
    const denyList = _.map(accounts, "mask");
    await pgQuery(userTableQuery);
    await pgQuery(
      "UPDATE users SET access_token = $1, item_id = $2, accounts = $3, accounts_denylist = $4 WHERE uid = $5",
      [accessTokenCtext, itemId, accounts, denyList, uid]
    );

    const startDate = moment().startOf("month").format("YYYY-MM-DD");
    const endDate = moment().endOf("month").format("YYYY-MM-DD");
    const plaidTransactions = await client.getTransactions(
      accessToken,
      startDate,
      endDate,
      {
        count: 100,
        offset: 0,
      }
    );

    const userRecord =
      PLAID_ENV === "sandbox"
        ? { displayName: "sandbox" }
        : await admin.auth().getUser(uid as string);

    const transactions = processPlaidTransactions(
      plaidTransactions,
      uid,
      userRecord.displayName as string
    );

    //TODO: can we make this faster?
    _.map(transactions, async (transaction) => {
      const { date, description, amount, category, id } = transaction;
      const {
        rows,
      } = await pgQuery(
        "INSERT INTO transactions(uid, display_name, plaid_id, date_time, description, amount, category) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [uid, userRecord.displayName, id, date, description, amount, category]
      );
      prettyPrintInfo(rows[0].id);
    });

    prettyPrintInfo({ accounts, denyList });

    return res.status(200).json({ accounts, denyList });
  } catch (error) {
    return res.status(500).json({
      error,
    });
  }
});

apiRoutes.post("/plaid/remove_item", adminOnly, async (req, res) => {
  try {
    const { uid } = req.body;

    const { rows } = await pgQuery("SELECT * FROM users WHERE uid = $1", [uid]);
    const accessTokenCtext = rows[0].access_token;

    if (!accessTokenCtext)
      return res.status(403).json({
        error: `No associated access_token for ${uid}`,
      });

    const accessToken = decrypt(accessTokenCtext);
    console.log(accessToken);
    const itemRemoveResult = await client.removeItem(accessToken);
    const removed = itemRemoveResult.removed;

    await pgQuery(
      "UPDATE users SET access_token = null, item_id = null, accounts = null, accounts_denylist = null WHERE uid = $1",
      [uid]
    );
    return res.status(200).json({ removed });
  } catch (error) {
    return res.status(500).json({
      error,
    });
  }
});

// Updates item for uid with the webhook (will be deprecrated, here for convenience)
apiRoutes.post("/plaid/webhook/update", adminOnly, async (req, res) => {
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
// apiRoutes.get("/plaid/transactions", async (req, res) => {
//   const { uid } = req.query;
//   const { rows } = await pgQuery("SELECT * FROM users WHERE uid = $1", [uid]);
//   const accessTokenCtext = rows[0].access_token;

//   if (!accessTokenCtext)
//     return res.status(403).json({
//       error: "Please add a bank account!",
//     });

//   const accessToken = decrypt(accessTokenCtext);
//   const startDate = moment("2020-06-01").format("YYYY-MM-DD");
//   const endDate = moment().format("YYYY-MM-DD");
//   return client.getTransactions(
//     accessToken,
//     startDate,
//     endDate,
//     {
//       count: 100,
//       offset: 0,
//     },
//     (error, transactionsResponse) => {
//       if (error != null) {
//         prettyPrintError(error);
//         return res.json({
//           transactions: [],
//           error,
//         });
//       }

//       return res.json({
//         error: null,
//         transactions: processPlaidTransactions(transactionsResponse),
//       });
//     }
//   );
// });

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

    const transactions = processTransactions(rows);
    const transactionsWithComments = _.map(transactions, async (t) => {
      const transactionComments = await pgQuery(
        "SELECT * FROM comments WHERE transaction_id = $1",
        [t.id]
      );

      t.comments = processTransactionComments(transactionComments.rows);
      return t;
    });

    const finalizedTransactions = await Promise.all(transactionsWithComments);
    const categories = _(finalizedTransactions)
      .map("category")
      .uniq()

      .value();
    prettyPrintInfo(finalizedTransactions);

    return res.status(200).json({
      transactions: finalizedTransactions,
      categories,
    });
  } catch (error) {
    prettyPrintError(error);
    return res.status(500).json({
      error,
    });
  }
});

apiRoutes.post(
  "/transactions/create",
  checkAuth,
  validateTransaction,
  returnValidationErrors,
  async (req: Request, res: Response) => {
    const { uid, date, description, amount, category, reason } = req.body;

    try {
      prettyPrintInfo("entered api call for trans/create");
      const userRecord = await admin.auth().getUser(uid);
      const {
        rows,
      } = await pgQuery(
        "INSERT INTO transactions(uid, display_name, date_time, description, amount, category) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
        [uid, userRecord.displayName, date, description, amount, category]
      );
      prettyPrintInfo(rows);

      if (reason && reason.length) {
        const commentRes = await pgQuery(
          "INSERT INTO comments(uid, display_name, transaction_id, parent_id, date_time, comment_text) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
          [
            uid,
            userRecord.displayName,
            rows[0].id,
            null,
            moment().toISOString(),
            reason,
          ]
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
  }
);

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
apiRoutes.get(
  "/transactions/comments",

  async (req, res) => {
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

      const comments = processTransactionComments(rows);
      prettyPrintInfo(comments);

      return res.json({
        error: null,
        comments,
      });
    } catch (error) {
      prettyPrintError(error);
      return res.json({
        error,
        comments: [],
      });
    }
  }
);

// Comment on a transaction
// 10 comments per minue
apiRoutes.post(
  "/transactions/comment",
  rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: "You've been doing that too fast",
  }),
  validateComment,
  returnValidationErrors,
  async (req: Request, res: Response) => {
    const { uid, dateTime, text, transactionId, parentId } = req.body;

    try {
      var comment;

      if (!uid) {
        // anon ones
        const {
          rows,
        } = await pgQuery(
          "INSERT INTO comments(uid, display_name, transaction_id, parent_id, date_time, comment_text) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
          [null, "Anon", transactionId, parentId, dateTime, text]
        );
        comment = processNewComment(rows[0]);
      } else {
        const userRecord = await admin.auth().getUser(uid);
        prettyPrintInfo(userRecord);

        const {
          rows,
        } = await pgQuery(
          "INSERT INTO comments(uid, display_name, transaction_id, parent_id, date_time, comment_text) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
          [uid, userRecord.displayName, transactionId, parentId, dateTime, text]
        );
        comment = processNewComment(rows[0]);
      }

      prettyPrintInfo(comment);
      return res.json({
        error: null,
        comments: [comment],
      });
    } catch (error) {
      prettyPrintError(error);
      return res.json({
        error,
        comments: [],
      });
    }
  }
);

// ########### Users API ###########

// Create a new user (without plaid credentials)
apiRoutes.post(
  "/users/create",
  rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: "You've been doing that too fast",
  }),
  async (req, res) => {
    const { uid } = req.body;

    try {
      await pgQuery(
        "INSERT INTO users(uid, access_token, item_id) VALUES ($1, $2, $3)",
        [PLAID_ENV === "sandbox" ? "sandbox" : uid, null, null]
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
  }
);

apiRoutes.post("/users/delete", checkAuth, async (req, res) => {
  const { uid } = req.body;

  try {
    await admin.auth().deleteUser(uid as string);

    await pgQuery("DELETE from users WHERE uid = $1 RETURNING id", [uid]);
    await pgQuery("DELETE from transactions WHERE uid = $1 RETURNING id", [
      uid,
    ]);
    await pgQuery("DELETE from comments WHERE uid = $1 RETURNING id", [uid]);

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
apiRoutes.post(
  "/users/set_display_name",
  checkAuth,
  [textValidator("displayName", "Empty Display Name is not allowed")],
  returnValidationErrors,
  async (req: Request, res: Response) => {
    const { uid, displayName } = req.body;

    try {
      await admin.auth().updateUser(uid as string, { displayName });

      // update associated comments and transactions, this is fine because setting the display name is rare
      await pgQuery("UPDATE comments SET display_name=$1 WHERE uid = $2", [
        displayName,
        uid,
      ]);

      await pgQuery("UPDATE transactions SET display_name=$1 WHERE uid = $2", [
        displayName,
        uid,
      ]);

      return res.status(200).json({
        error: null,
      });
    } catch (error) {
      prettyPrintError(error);
      return res.status(500).json({
        error,
      });
    }
  }
);

apiRoutes.get("/users/bank_accounts", adminOnly, async (req, res) => {
  const { uid } = req.query;

  try {
    const { rows } = await pgQuery("SELECT * FROM users WHERE uid = $1", [uid]);
    prettyPrintInfo(rows);
    const { accounts, accounts_denylist } = rows[0];
    return res.json({ accounts: accounts, denylist: accounts_denylist });
  } catch (error) {
    prettyPrintError(error);
    return res.json({
      error,
    });
  }
});

apiRoutes.post("/users/bank_accounts/delete", adminOnly, async (req, res) => {
  const { uid, mask } = req.body;

  try {
    const { rows } = await pgQuery("SELECT * FROM users WHERE uid = $1", [uid]);
    prettyPrintInfo(rows);
    const { accounts, accounts_denylist } = rows[0];
    const newAccounts = _.reject(accounts, ["mask", mask]);
    const newDeny = _.reject(accounts_denylist, (denied) => denied === mask);

    await pgQuery(
      "UPDATE users SET accounts = $1, accounts_denylist = $2 WHERE uid = $3",
      [newAccounts, newDeny, uid]
    );
    prettyPrintInfo({ accounts: newAccounts, denylist: newDeny });
    return res.json({ accounts: newAccounts, denylist: newDeny });
  } catch (error) {
    prettyPrintError(error);
    return res.json({
      error,
    });
  }
});

apiRoutes.post("/users/bank_accounts/toggle", adminOnly, async (req, res) => {
  const { uid, mask, checked } = req.body;

  try {
    const { rows } = await pgQuery("SELECT * FROM users WHERE uid = $1", [uid]);
    const { accounts_denylist } = rows[0];

    let newDeny = accounts_denylist;
    if (checked)
      newDeny = _.reject(accounts_denylist, (denied) => denied === mask);
    else accounts_denylist.push(mask);

    await pgQuery("UPDATE users SET accounts_denylist = $1 WHERE uid = $2", [
      newDeny,
      uid,
    ]);

    const resJson = { denylist: newDeny };
    prettyPrintInfo(resJson);
    return res.json(resJson);
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
    const userRecord = await admin.auth().getUser(uid as string);

    const { rows } = await pgQuery(
      "SELECT * FROM transactions WHERE uid = $1",
      [uid]
    );

    const transactions = processTransactions(rows);
    // console.log(transactions);
    if (!transactions.length)
      return res.json({
        stats: { displayName: userRecord.displayName },
      });
    const stats = {
      currentMonthSpend: getSpendForMonth(transactions, dateTime as string),
      daysSinceLastSpend: getDaysSinceLastSpend(
        transactions,
        dateTime as string
      ),
      avgSpendPerDay: getAverageSpendPerDay(transactions),
      displayName: userRecord.displayName,
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
