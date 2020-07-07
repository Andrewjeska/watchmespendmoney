import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { Container, Menu } from "semantic-ui-react";
import { googleSignIn } from "../utils";
import { auth } from "../utils/firebase";

const Navbar: React.FC = () => {
  const [user, setUser] = useState(auth.currentUser);
  useEffect(() => {
    // will run on first render, like componentDidMount

    auth.onAuthStateChanged((user) => {
      if (user) setUser(user);
    });
  }, []);

  const router = useRouter();

  const signOut = async () => {
    await auth.signOut();
    router.push("/");
  };

  const signIn = async () => {
    await router.push("/dashboard");
    await googleSignIn();
  };

  return (
    <Container>
      <Menu fluid stackable>
        {!user && <Menu.Item onClick={() => signIn()}>Login</Menu.Item>}
        {user && [
          <Menu.Item onClick={() => signOut()}>Logout</Menu.Item>,
          <Menu.Item link href="/dashboard">
            Dashboard
          </Menu.Item>,
          <Menu.Item link href={`/${user.uid}`}>
            Public Feed
          </Menu.Item>,
        ]}
      </Menu>
    </Container>
  );
};

export default Navbar;
