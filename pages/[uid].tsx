import "firebase/auth";
import moment from "moment";
import { GetServerSideProps } from "next";
import Head from "next/head";
import React, { useEffect, useState } from "react";
import {
  Container,
  Grid,
  Header,
  Input,
  Loader,
  Segment,
  Statistic,
} from "semantic-ui-react";
import { axios } from "../common/axios";
import { auth } from "../common/firebase";
import AddTransaction from "../components/AddTransaction";
import Navbar from "../components/Navbar";
import TransactionFeed from "../components/TransactionFeed";

interface UserFeedProps {
  uid: string;
}

const UserFeed: React.FC<UserFeedProps> = ({ uid }) => {
  const [transactions, setTransactions] = useState([]);
  const [transPending, setTransPending] = useState(true);

  const fetchTransactions = async () => {
    try {
      const res = await axios.get("/api/transactions/", {
        params: { uid },
        headers: { "Cache-Control": "no-cache" },
      });
      setTransactions(res.data.transactions);
      setTransPending(false);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get("/api/stats", {
        params: { uid, dateTime: moment().toISOString() },
      });
      setStats(res.data.stats);
    } catch (err) {
      console.error(err);
    }
  };

  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [stats, setStats] = useState(null as UserStats | null);

  useEffect(() => {
    // will run on first render, like componentDidMount
    if (uid) fetchTransactions();

    const firebaseUnsub = auth.onAuthStateChanged((user) => {
      if (user) setCurrentUser(user);
    });

    //Fun fact: we have to wait for the auth object to initialize, hence this call here
    setCurrentUser(auth.currentUser);

    //TODO: server side props/some nexjts optimization?
    fetchStats();

    return function cleanup() {
      firebaseUnsub();
    };
  }, []);

  return (
    <div>
      <Head>
        <meta name="robots" content="noindex" />
        <meta name="googlebot" content="noindex" />
      </Head>
      <Navbar></Navbar>
      <Container style={{ paddingTop: "10vh" }}>
        <Grid stackable>
          {currentUser && currentUser.uid === uid && (
            <Grid.Row>
              <Grid.Column width={8}>
                <Segment>
                  <Grid textAlign="center">
                    <Grid.Row>
                      <Header as="h2">Share your Feed</Header>
                    </Grid.Row>
                    <Grid.Row textAlign="center">
                      <Input
                        action={{
                          color: "teal",
                          labelPosition: "right",
                          icon: "copy",
                          content: "Copy",
                          onClick: () => {
                            var copy: any = document.getElementById(
                              "shareLink"
                            );
                            if (copy) {
                              copy.select();
                              document.execCommand("copy");
                              alert("Copied!");
                            }
                          },
                        }}
                        id="shareLink"
                        readOnly
                        defaultValue={window.location.href}
                      />
                    </Grid.Row>
                  </Grid>
                </Segment>
              </Grid.Column>
              <Grid.Column width={8}>
                <Segment style={{ width: "100%" }}>
                  <AddTransaction
                    user={currentUser}
                    postSubmit={() => {
                      fetchTransactions();
                      fetchStats();
                    }}
                  />
                </Segment>
              </Grid.Column>
            </Grid.Row>
          )}
          <Grid.Row>
            <Grid.Column>
              <Segment style={{ width: "100%" }}>
                <Grid textAlign="center">
                  <Grid.Row>
                    <Header as="h2">
                      Stats for {stats ? stats.displayName : "Loading..."}
                    </Header>
                  </Grid.Row>

                  <Grid.Row>
                    <Statistic>
                      <Statistic.Label>
                        Total spend in {moment().format("MMMM")}
                      </Statistic.Label>
                      <Statistic.Value>
                        {stats && stats.currentMonthSpend
                          ? "$" + stats.currentMonthSpend.toFixed(2)
                          : "N/A"}
                      </Statistic.Value>
                    </Statistic>
                    <Statistic>
                      <Statistic.Label>Average Daily Spend</Statistic.Label>
                      <Statistic.Value>
                        {stats && stats.avgSpendPerDay
                          ? "$" + stats.avgSpendPerDay.toFixed(2)
                          : "N/A"}
                      </Statistic.Value>
                    </Statistic>
                    <Statistic>
                      <Statistic.Label>Days since last spend</Statistic.Label>
                      <Statistic.Value>
                        {stats && stats.daysSinceLastSpend
                          ? stats.daysSinceLastSpend
                          : "N/A"}
                      </Statistic.Value>
                    </Statistic>
                  </Grid.Row>
                </Grid>
              </Segment>
            </Grid.Column>
          </Grid.Row>
        </Grid>
        <Container text>
          <Grid textAlign="center" style={{ marginTop: "2vh" }}>
            <Grid.Row>
              {transPending && <Loader active />}
              {!transPending &&
                (transactions.length ? (
                  <TransactionFeed
                    transactions={transactions}
                    emailPopup={false}
                    transactionPostDelete={() => {
                      fetchTransactions();
                      fetchStats();
                    }}
                  />
                ) : (
                  <p>No Transactions</p>
                ))}
            </Grid.Row>
          </Grid>
        </Container>
      </Container>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    props: { uid: context.query.uid }, // will be passed to the page component as props
  };
};

export default UserFeed;
