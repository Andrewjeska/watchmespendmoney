import axios from "axios";
import envvar from "envvar";
import "firebase/auth";
import { GetStaticProps } from "next";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { Button, Container, Grid, Header } from "semantic-ui-react";
import AddTransaction from "../components/AddTransaction";
import TransactionFeed from "../components/TransactionFeed";
import { auth, firebase } from "../utils/firebase";

const signIn = async (provider: firebase.auth.GoogleAuthProvider) => {
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
    // like componenetDidMount
    if (user) {
      fetchTransactions(user);
    } else {
      var provider = new firebase.auth.GoogleAuthProvider();
      signIn(provider).then((res) => {
        if (res) {
          const [token, user] = res;
          if (user) setUser(user);
        }
      });
    }
  }, []);

  useEffect(() => {
    if (user && !transactions.length) fetchTransactions(user);
  });

  const router = useRouter();

  const signOut = async () => {
    await auth.signOut();
    router.push("/");
  };

  // this a little dumb but we have to do it like this
  // const userRef = useRef(user);
  // useEffect(() => {
  //   userRef.current = user;
  // });

  // const onSuccess = async (token: string, meta: any) => {
  //   if (!userRef.current) throw new Error("User not set");

  //   await axios.post("/api/plaid/get_access_token", {
  //     publicToken: token,
  //     userName: userRef.current.email,
  //   });
  // };

  // var config = {
  //   clientName: "watchmespendmoney",
  //   env: plaidEnv,
  //   product: ["auth", "transactions"],
  //   publicKey: plaidPublicKey,
  //   onSuccess,
  // };

  // const { open, ready, error } = usePlaidLink(config);

  if (user) {
    // User is signed in.
    return (
      <div>
        <Container>
          <Grid>
            <Grid.Row>
              <Grid.Column floated="right" width={4}>
                <Button onClick={() => signOut()} primary>
                  Sign Out
                </Button>
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Container>
        <Container style={{ paddingTop: "10vh" }}>
          <Grid textAlign="left">
            <Grid.Row>
              <Header as="h1">Welcome {user.email}!</Header>
            </Grid.Row>
            {/* <Grid.Row>
              <Button primary onClick={() => open()} disabled={!ready}>
                Add Bank Account
              </Button>
            </Grid.Row> */}

            {/* <Grid.Row>
              <Header as="h2">Toggles</Header>
              <Segment>
                <Checkbox toggle />
              </Segment>
            </Grid.Row> */}

            <Grid.Row>
              <Grid.Column width={8}>
                {transErr ? (
                  <p>
                    Error retrieiving transactions. If this problem persists
                    please submit a bug report to michael@watchmespendmoney.com
                  </p>
                ) : (
                  <div style={{ maxHeight: "50vh" }}>
                    {transactions.length ? (
                      <TransactionFeed
                        transactions={transactions}
                        currentUser={{ handle: "Anon", profile: "" }}
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
  return <div></div>;
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
