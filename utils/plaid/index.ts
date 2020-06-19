import envvar from "envvar";
import plaid from "plaid";

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
