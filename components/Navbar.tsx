import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { Container, Icon, Menu } from "semantic-ui-react";
import { auth, firebase, googleSignIn } from "../common/firebase";

const Navbar: React.FC = () => {
  const [user, setUser] = useState(firebase.auth().currentUser);
  useEffect(() => {
    // will run on first render, like componentDidMount

    const firebaseUnsub = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    setUser(firebase.auth().currentUser);
    return function cleanup() {
      firebaseUnsub();
    };
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
          <Menu.Item key="login" onClick={() => login()}>
            <Icon name="google"></Icon>Login (Beta)
          </Menu.Item>
        )}
        {user && [
          <Menu.Item key="logout" onClick={() => logout()}>
            Logout
          </Menu.Item>,
          <Link key="transFeed" href="[uid]" as={`/${user.uid}`} passHref>
            <Menu.Item link> Your Transaction Feed </Menu.Item>
          </Link>,
        ]}
      </Menu>
    </Container>
  );
};

export default Navbar;
