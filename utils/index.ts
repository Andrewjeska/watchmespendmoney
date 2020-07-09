import util from "util";
import { auth, firebase } from "./firebase";

export const prettyPrintInfo = (response: any) => {
  console.info(util.inspect(response, { colors: true, depth: 4 }));
};

export const prettyPrintError = (error: Error) => {
  console.error(util.inspect(error, { colors: true, depth: 4 }));
};

export const googleSignIn = async (): Promise<void> => {
  try {
    var provider = new firebase.auth.GoogleAuthProvider();
    await auth.signInWithRedirect(provider);
  } catch (err) {
    console.error(err);
  }
};
