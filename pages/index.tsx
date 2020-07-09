import axios from "axios";
import "firebase/auth";
import moment from "moment";
import { GetStaticProps } from "next";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { Container, Grid, Header, Loader, Modal } from "semantic-ui-react";
import { bake_cookie } from "sfcookies";
import SignUp from "../components/EmailSignUp";
import Navbar from "../components/Navbar";
import TransactionFeed from "../components/TransactionFeed";
import { auth } from "../utils/firebase";

interface HomeProps {
  maintenance: boolean;
}

const Home: React.FC<HomeProps> = ({ maintenance }) => {
  const [transactions, setTransactions] = useState([]);

  const fetchTransactions = async () => {
    try {
      const res = await axios.get("/api/plaid/transactions");
      setTransactions(res.data.transactions);
    } catch (err) {
      console.error(err);
    }
  };

  const router = useRouter();

  useEffect(() => {
    // will run on first render, like componentDidMount

    auth.getRedirectResult().then((res) => {
      if (res.user) router.push(`/${res.user.uid}`);
    });

    auth.onAuthStateChanged((user) => {
      if (user && user.email) {
        // User is signed in.

        // admin mode
        if (user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
          bake_cookie("admin", "true", moment().years(10).toDate());
        }
      }
    });

    fetchTransactions();
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
        <Grid>
          <Grid textAlign="center">
            <Grid.Row>
              <Header as="h1">Watch me spend money.</Header>
            </Grid.Row>

            <Grid.Row>
              <p>
                Hi! My name's Michael Anderjaska. I'm just a guy who's really
                into saving money. My expenses are public for the world to see,
                pulled from my bank accounts. Feel free to roast me about my
                purchases in the feed below.
              </p>
            </Grid.Row>

            <Grid.Row>
              <p>
                <b>watchmespendmoney</b> is an accountablity tool that keeps you
                honest on your expenses by making them public (or, if you'd
                rather, a select group of close friends). Stay updated on
                development and be the first to know when the beta is released
                by signing up below.
              </p>
            </Grid.Row>
            <Grid.Row>
              <Grid.Column width={10}>
                <SignUp />
              </Grid.Column>
            </Grid.Row>
            <Grid.Row>
              <a href="https://www.buymeacoffee.com/anderjaska">
                Buy me a coffee?
              </a>
            </Grid.Row>
          </Grid>

          <Grid.Row>
            {transactions.length ? (
              <TransactionFeed
                transactions={transactions}
                transactionPostDelete={() => fetchTransactions()}
              />
            ) : (
              <Loader active />
            )}
          </Grid.Row>
        </Grid>
        {transactions.length > 0 && (
          <Grid textAlign="center">
            <Grid.Row>
              <a href="https://medium.com/@anderjaska/how-i-save-money-public-shaming-456d95fa06">
                Learn more about my approach
              </a>
            </Grid.Row>

            <Grid.Row>
              <Grid.Column width={10}>
                <SignUp />
              </Grid.Column>
            </Grid.Row>
          </Grid>
        )}
      </Container>
    </div>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  // this runs server-side
  return {
    props: {
      maintenance: process.env.MAINTENANCE_MODE === "true",
    },
  };
};

export default Home;
