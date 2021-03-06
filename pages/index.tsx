import envvar from "envvar";
import "firebase/auth";
import moment from "moment";
import { GetStaticProps } from "next";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import {
  Button,
  Container,
  Grid,
  Header,
  Icon,
  Modal,
} from "semantic-ui-react";
import { bake_cookie } from "sfcookies";
import { axios } from "../common/axios";
import { auth, googleSignIn } from "../common/firebase";
import SignUp from "../components/EmailSignUp";
import FeedWithDash from "../components/FeedWithDash";
import Navbar from "../components/Navbar";

interface HomeProps {
  maintenance: boolean;
  adminUID: string;
}

const Home: React.FC<HomeProps> = ({ maintenance, adminUID }) => {
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    // will run on first render, like componentDidMount

    auth.getRedirectResult().then(async (res) => {
      if (res.user) {
        const user = res.user;
        // if (res.additionalUserInfo?.isNewUser)
        await axios.post("/api/users/create", {
          uid: user.uid,
        });
        setUser(user);
      }
    });

    const firebaseUnsub = auth.onAuthStateChanged((user) => {
      if (user && user.uid) {
        // User is signed in.

        // admin mode
        if (user.uid === adminUID) {
          bake_cookie("admin", "true", moment().years(10).toDate());
        }
      }
      setUser(user);
    });

    return function cleanup() {
      firebaseUnsub();
    };
  }, []);

  if (maintenance) {
    return (
      <Modal open={maintenance}>
        <Modal.Content>
          <h3> We're currently down for maintenance!</h3>
          <p>
            If you're coming from hackernews, thanks for being a part of my
            first ever Show HN! If you'd like to stay updated on
            watchmespendmoney, sign up with your email below.
          </p>
          <Grid textAlign="center">
            <Grid.Row>
              <Grid.Column width={10}>
                <SignUp />
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Modal.Content>
      </Modal>
    );
  }

  return (
    <div>
      <Navbar></Navbar>
      <Container style={{ paddingTop: "10vh" }} text>
        <Grid textAlign="center">
          <Grid.Row>
            <Header as="h1">Watch me spend money.</Header>
          </Grid.Row>
          {!user && (
            <Grid.Row>
              <p>
                Hi! I'm just a guy who's really into saving money. My expenses
                are public for the world to see, pulled from my bank accounts.
                Feel free to roast me about my purchases in the feed below.
              </p>
            </Grid.Row>
          )}

          {!user && (
            <Grid.Row>
              <p>
                <b>watchmespendmoney</b> is an accountablity tool that keeps you
                honest on your expenses by making them public (or, if you'd
                rather, a select group of close friends). Sign in with google
                below to give our beta a try!
              </p>
            </Grid.Row>
          )}

          <Grid.Row>
            <Grid.Column width={10}>
              {user ? (
                <Link href="[uid]" as={`/${user.uid}`}>
                  <Button primary type="submit">
                    View your transaction feed here!
                  </Button>
                </Link>
              ) : (
                <Button
                  primary
                  onClick={async () => await googleSignIn()}
                  type="submit"
                >
                  <Icon name="google"></Icon> Login with Google
                </Button>
              )}
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Button
              icon
              href="https://www.buymeacoffee.com/anderjaska"
              labelPosition="left"
            >
              <Icon name="coffee" />
              Buy me a coffee?
            </Button>
          </Grid.Row>
        </Grid>
      </Container>
      <Container style={{ paddingTop: "5vh" }}>
        <FeedWithDash
          currentUser={user}
          uid={adminUID}
          homePageDisplay={true}
        />
      </Container>
      {/* 
      <Container>
        <Grid textAlign="center">
          <Grid.Row>
            <a href="https://medium.com/@anderjaska/how-i-save-money-public-shaming-456d95fa06">
              Learn more about my approach
            </a>
          </Grid.Row>
        </Grid>
      </Container> */}
    </div>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  // this runs server-side
  return {
    props: {
      maintenance: envvar.boolean("MAINTENANCE_MODE"),
      adminUID: envvar.string("ADMIN_UID"),
    },
  };
};

export default Home;
