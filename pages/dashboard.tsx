import axios from "axios";
import envvar from "envvar";
import "firebase/auth";
import { GetStaticProps } from "next";
import React, { useEffect, useState } from "react";
import { Container, Grid, Header, Loader } from "semantic-ui-react";
import AddTransaction from "../components/AddTransaction";
import Navbar from "../components/Navbar";
import TransactionFeed from "../components/TransactionFeed";
import { auth, firebase } from "../utils/firebase";

interface DashboardProps {
  plaidPublicKey: string;
  plaidEnv: string;
}

const Dashboard: React.FC<DashboardProps> = ({ plaidPublicKey, plaidEnv }) => {
  const [user, setUser] = useState(auth.currentUser);
  const [transactions, setTransactions] = useState([]);
  const [transErr, setTransErr] = useState(false);

  const fetchTransactions = async (user: firebase.User) => {
    try {
      const res = await axios.get(`/api/transactions/${user.uid}`);
      setTransactions(res.data.transactions);
    } catch (err) {
      console.error(err);
      setTransErr(true);
    }
  };

  useEffect(() => {
    auth.getRedirectResult().then((res) => {
      if (res.user) setUser(res.user);
    });
    auth.onAuthStateChanged((user) => {
      if (user) setUser(user);
    });
  }, []);

  useEffect(() => {
    if (user) fetchTransactions(user);
  }, [user]);

  if (user) {
    // User is signed in.
    return (
      <div>
        <Navbar></Navbar>

        <Container style={{ paddingTop: "10vh" }}>
          <Grid textAlign="left">
            <Grid.Row>
              <Header as="h1">Welcome {user.displayName}!</Header>
            </Grid.Row>

            <Grid.Row></Grid.Row>

            <Grid.Row>
              <Grid.Column width={8}>
                {transErr ? (
                  <p>
                    Error retrieiving transactions. If this problem persists
                    please submit a bug report to michael@anderjaska.com
                  </p>
                ) : (
                  <div style={{ maxHeight: "50vh" }}>
                    {transactions.length ? (
                      <TransactionFeed
                        transactions={transactions}
                        commenting={false}
                      ></TransactionFeed>
                    ) : (
                      <p>No Transactions!</p>
                    )}
                  </div>
                )}
              </Grid.Column>
              <Grid.Column width={8}>
                <AddTransaction
                  user={user}
                  postSubmit={() => fetchTransactions(user)}
                />
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Container>
      </div>
    );
  }
  return (
    <div>
      <Loader active />
    </div>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  // this runs server-side
  return {
    props: {
      plaidPublicKey: envvar.string("PLAID_PUBLIC_KEY"),
      plaidEnv: envvar.string("PLAID_ENV"),
    },
  };
};

export default Dashboard;
