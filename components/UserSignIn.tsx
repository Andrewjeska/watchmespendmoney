import { useRouter } from "next/router";
import React from "react";
import { Button } from "semantic-ui-react";
import { auth } from "../utils/firebase";

const UserSignIn: React.FC = () => {
  const router = useRouter();

  const signOut = async () => {
    await auth.signOut();
    router.push("/");
  };

  const signIn = async () => {
    router.push("/dashboard");
  };

  if (auth.currentUser) {
    return (
      <Button onClick={() => signOut()} primary content="Sign out"></Button>
    );
  } else {
    return (
      <Button
        onClick={() => signIn()}
        primary
        content="Sign in"
        icon="google"
      ></Button>
    );
  }
};

export default UserSignIn;
