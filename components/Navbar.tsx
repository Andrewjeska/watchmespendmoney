import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { Container, Icon, Menu } from "semantic-ui-react";
import { googleSignIn } from "../utils";
import { auth, firebase } from "../utils/firebase";

const Navbar: React.FC = () => {
  const [user, setUser] = useState(firebase.auth().currentUser);
  useEffect(() => {
    // will run on first render, like componentDidMount

    auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    setUser(firebase.auth().currentUser);
  }, []);

  const router = useRouter();

  const logout = async () => {
    await auth.signOut();
    await router.push("/");
  };

  const login = async () => {
    await googleSignIn();
  };

  return (
    <Container>
      <Menu fluid stackable>
        <Link href="/" passHref>
          <Menu.Item link>
            <Icon name="home"></Icon>
          </Menu.Item>
        </Link>
        {!user && (
          <Menu.Item onClick={() => login()}>
            <Icon name="google"></Icon>Login (Beta)
          </Menu.Item>
        )}
        {user && [
          <Menu.Item onClick={() => logout()}>Logout</Menu.Item>,
          <Link href="[uid]" as={`/${user.uid}`} passHref>
            <Menu.Item link> Transaction Feed </Menu.Item>
          </Link>,
        ]}
      </Menu>
    </Container>
  );
};

export default Navbar;
