import envvar from "envvar";
import _ from "lodash";
import moment from "moment";
import plaid from "plaid";
import util from "util";

// ########### Plaid client setup ###########

export const PLAID_CLIENT_ID = envvar.string("PLAID_CLIENT_ID");
export const PLAID_SECRET = envvar.string("PLAID_SECRET");
export const PLAID_PUBLIC_KEY = envvar.string("PLAID_PUBLIC_KEY");
export const PLAID_ENV = envvar.string("PLAID_ENV", "sandbox");
// PLAID_PRODUCTS is a comma-separated list of products to use when initializing
// Link. Note that this list must contain 'assets' in order for the app to be
// able to create and retrieve asset reports.
export const PLAID_PRODUCTS = envvar.string("PLAID_PRODUCTS", "transactions");

// PLAID_PRODUCTS is a comma-separated list of countries for which users
// will be able to select institutions from.
export const PLAID_COUNTRY_CODES = envvar.string("PLAID_COUNTRY_CODES", "US");

// Parameters used for the OAuth redirect Link flow.
//
// Set PLAID_OAUTH_REDIRECT_URI to 'http://localhost:8000/oauth-response.html'
// The OAuth redirect flow requires an endpoint on the developer's website
// that the bank website should redirect to. You will need to whitelist
// this redirect URI for your client ID through the Plaid developer dashboard
// at https://dashboard.plaid.com/team/api.
export const PLAID_OAUTH_REDIRECT_URI = envvar.string(
  "PLAID_OAUTH_REDIRECT_URI",
  ""
);
// Set PLAID_OAUTH_NONCE to a unique identifier such as a UUID for each Link
// session. The nonce will be used to re-open Link upon completion of the OAuth
// redirect. The nonce must be at least 16 characters long.
export const PLAID_OAUTH_NONCE = envvar.string("PLAID_OAUTH_NONCE", "");

export const client = new plaid.Client(
  PLAID_CLIENT_ID,
  PLAID_SECRET,
  PLAID_PUBLIC_KEY,
  plaid.environments[PLAID_ENV],
  {
    version: "2019-05-29",
    clientApp: "Plaid Quickstart",
  }
);

// ########### Util functions ###########

export const processPlaidTransactions = (
  res: plaid.TransactionsResponse,
  uid: string,
  displayName: string
): Array<UserTransaction> => {
  // TODO: we should have a a list of connected accounts for a user

  // TODO: remove this crutch for yourself too
  const accountId = _.find(
    res.accounts,
    (account: plaid.Account) => account.mask === envvar.string("LAST_FOUR")
  )?.account_id;
  if (!accountId) return [];

  const categoryFilters = ["Personal Care"];

  return (
    _(res.transactions)
      // eslint-disable-next-line @typescript-eslint/camelcase
      // .filter({ account_id: accountId })
      .filter({ pending: false })
      .filter((t: plaid.Transaction): boolean =>
        t.amount ? t.amount >= 0.0 : false
      )
      .reject((t: plaid.Transaction): boolean =>
        _.some(t.category, (cat) => categoryFilters.includes(cat))
      )
      .map((t: plaid.Transaction): UserTransaction | null => {
        if (t.name && t.amount && t.category)
          return {
            id: t.transaction_id,
            uid,
            displayName,
            date: t.date,
            amount: t.amount,
            description: t.name,
            category: t.category[t.category.length - 1],
          };
        return null;
      })
      .compact()
      .value()
  );
};

export const processTransactions = (rows: any[]): Array<UserTransaction> => {
  return _(rows)
    .map((transaction) => {
      return {
        id: transaction.id,
        uid: transaction.uid,
        displayName: transaction.display_name,
        date: transaction.date_time,
        amount: transaction.amount,
        description: transaction.description,
        category: transaction.category,
      };
    })
    .orderBy(["date"], ["desc"])
    .value();
};

//TODO: type the database rows
export const processNewComment = (comment: any): TransactionComment => {
  return {
    id: comment.id,
    uid: comment.uid,
    displayName: comment.display_name,
    dateTime: comment.date_time,
    text: comment.comment_text,
    transactionId: comment.transaction_id,
    children: [],
  };
};

export const processTransactionComments = (
  rows: any[]
): Array<TransactionComment> => {
  // can we make a tree here?
  const baseComments = _.filter(rows, (comment) => !comment.parent_id);

  return _.map(baseComments, (comment) => {
    return {
      id: comment.id,
      uid: comment.uid,
      displayName: comment.display_name,
      dateTime: comment.date_time,
      text: comment.comment_text,
      transactionId: comment.transaction_id,
      children: processTransactionCommentsHelper(
        _.filter(rows, (child) => child.parent_id === comment.id),
        rows
      ),
    };
  });
};

// look ma, recursion!
const processTransactionCommentsHelper = (
  comments: any[],
  allComments: any[]
): Array<TransactionComment> => {
  if (!comments.length) return [] as Array<TransactionComment>;

  return _.map(comments, (comment) => {
    return {
      id: comment.id,
      uid: comment.uid,
      displayName: comment.display_name,
      dateTime: comment.date_time,
      text: comment.comment_text,
      transactionId: comment.transaction_id,
      children: processTransactionCommentsHelper(
        _.filter(allComments, (child) => child.parent_id === comment.id),
        allComments
      ),
    };
  });
};

// Transaction Stats

export const getSpendForMonth = (
  transactions: Array<UserTransaction>,
  currentDate: string
): number => {
  const requestedDate = moment(currentDate);
  return _.reduce(
    transactions,
    (acc, t) => {
      const transDate = moment(t.date);
      if (
        requestedDate.month() === transDate.month() &&
        requestedDate.year() === transDate.year()
      )
        return (acc += t.amount);
      else return 0;
    },
    0
  );
};

export const getDaysSinceLastSpend = (
  transactions: Array<UserTransaction>,
  currentDate: string
): number => {
  const requestedDate = moment(currentDate);
  const sorted = _(transactions).orderBy("date_time", "desc").value();
  return moment(requestedDate).diff(sorted[0].date, "days");
};

export const getAverageSpendPerDay = (
  transactions: Array<UserTransaction>
): number => {
  const sorted = _(transactions).orderBy("date_time").value();
  const sum = _.reduce(sorted, (acc, t) => (acc += t.amount), 0.0);
  const numDays =
    Math.abs(
      moment(sorted[0].date).diff(sorted[sorted.length - 1].date, "days")
    ) || 1;
  const avg = sum / numDays;
  return avg;
};

export const prettyPrintInfo = (response: any) => {
  console.info(util.inspect(response, { colors: true, depth: 4 }));
};

export const prettyPrintError = (error: Error) => {
  console.error(util.inspect(error, { colors: true, depth: 4 }));
};
