import envvar from "envvar";
import _ from "lodash";
import { Db, MongoClient } from "mongodb";
import plaid from "plaid";
import url from "url";

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

// ########### MongoDB setup ###########

// Create cached connection variable
let cachedDb: Db | null = null;

// A function for connecting to MongoDB,
// taking a single parameter of the connection string
export async function connectToDatabase(uri: string): Promise<Db> {
  // If the database connection is cached,
  // use it instead of creating a new connection
  if (cachedDb) {
    return cachedDb;
  }

  //TODO: handle deprecation warning
  // If no connection is cached, create a new one
  const client = await MongoClient.connect(uri, {
    useNewUrlParser: true,
  });

  // Select the database through the connection,
  // using the database path of the connection string
  const parsedURI = url.parse(uri);
  if (!parsedURI.pathname) throw new Error("MongoDB URI Malformed");

  const db = await client.db(parsedURI.pathname.substr(1));

  // Cache the database connection and return the connection
  cachedDb = db;
  return db;
}

// ########### Util functions ###########

export const processTransactions = (
  res: plaid.TransactionsResponse
): Array<UserTransaction> => {
  // TODO: we should have a a list of connected accounts for a user somehow
  const accountId = _.find(
    res.accounts,
    (account: plaid.Account) => account.mask === envvar.string("LAST_FOUR")
  )?.account_id;
  if (!accountId) throw new Error("Account Not Available");

  const categoryFilters = ["Personal Care"];

  return (
    _(res.transactions)
      // eslint-disable-next-line @typescript-eslint/camelcase
      .filter({ account_id: accountId })
      .filter(
        (t: plaid.Transaction): boolean =>
          t.transaction_type === "digital" || t.transaction_type === "place"
      )
      .reject((t: plaid.Transaction): boolean =>
        _.some(t.category, (cat) => categoryFilters.includes(cat))
      )
      .map((t: plaid.Transaction): UserTransaction | null => {
        if (t.name && t.amount && t.category)
          return {
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
