import util from "util";
import { auth } from "./firebase";

export const prettyPrintInfo = (response: any) => {
  console.info(util.inspect(response, { colors: true, depth: 4 }));
};

export const prettyPrintError = (error: Error) => {
  console.error(util.inspect(error, { colors: true, depth: 4 }));
};

export const googleSignIn = async (
  provider: firebase.auth.GoogleAuthProvider
) => {
  try {
    const userCredential = await auth.signInWithPopup(provider);
    var token;
    var user;
    if (userCredential) {
      if (userCredential.credential) {
        var cred: any = userCredential.credential;
        //the provided types are stupid
        token = cred.accessToken;
      }

      if (userCredential.user) user = userCredential.user;
    }

    return [token, user];
  } catch (err) {
    console.error(err);
    return null;
  }
};
