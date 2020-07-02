import axios from "axios";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import { Container, Feed, Grid, Header, Loader } from "semantic-ui-react";
import SignUp from "../components/SignUp";
import Transaction from "../components/Transaction";
import { auth } from "../utils/firebase";

const Home: React.FC = () => {
  const [plaidAuthenticated, setPlaidAuthenticated] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [adminMode, setAdminMode] = useState(false);

  const fetchTransactions = async () => {
    try {
      const res = await axios.get("/api/plaid/transactions");
      setTransactions(res.data.transactions);
    } catch (err) {
      setPlaidAuthenticated(false);
    }
  };

  const [currentUser, setCurrentUser] = useState({
    handle: "Anon",
    profile: "",
  });

  useEffect(() => {
    // will run on first render, like componentDidMount
    fetchTransactions();

    auth.onAuthStateChanged((user) => {
      if (user && user.email) {
        // User is signed in.

        // admin mode
        if (user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
          setCurrentUser({
            handle: "Michael",
            profile: process.env.NEXT_PUBLIC_ADMIN_TWITTER || "",
          });
        }
      }
    });
  }, []);

  useEffect(() => {
    // will run on each render, like componentDidUpdate
    if (plaidAuthenticated && transactions.length === 0) {
      fetchTransactions();
    }
  });

  return (
    <div>
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
                by clicking the button below!
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
            {transactions.length > 0 ? (
              <Feed style={{ width: "100%" }}>
                {_.map(transactions, (t: UserTransaction, i: number) => (
                  <Transaction
                    key={t.id}
                    transaction={t}
                    currentUser={currentUser}
                  />
                ))}
              </Feed>
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

export default Home;
