import axios from "axios";
import "firebase/auth";
import { GetServerSideProps } from "next";
import React, { useEffect, useState } from "react";
import {
  Container,
  Grid,
  Header,
  Input,
  Loader,
  Segment,
} from "semantic-ui-react";
import AddTransaction from "../components/AddTransaction";
import Navbar from "../components/Navbar";
import TransactionFeed from "../components/TransactionFeed";
import { auth } from "../utils/firebase";

interface UserFeedProps {
  uid: string;
}

const UserFeed: React.FC<UserFeedProps> = ({ uid }) => {
  const [transactions, setTransactions] = useState([]);
  const [transPending, setTransPending] = useState(true);

  const fetchTransactions = async () => {
    try {
      const res = await axios.get(`/api/transactions/${uid}`);
      setTransactions(res.data.transactions);
      setTransPending(false);
    } catch (err) {
      console.error(err);
    }
  };

  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    // will run on first render, like componentDidMount
    if (uid) fetchTransactions();

    auth.onAuthStateChanged((user) => {
      if (user) setUser(user);
    });

    //Fun fact: we have to wait for the auth object to initialize, hence this call here
    setUser(auth.currentUser);
  }, []);

  return (
    <div>
      <Navbar></Navbar>
      <Container style={{ paddingTop: "10vh" }} text>
        {user && user.uid === uid && (
          <div>
            <Segment>
              <Grid textAlign="center">
                <Grid.Row>
                  <Header as="h2">Share your Feed</Header>
                </Grid.Row>
                <Grid.Column width={12}>
                  <Input
                    style={{ width: "100%" }}
                    action={{
                      color: "teal",
                      labelPosition: "right",
                      icon: "copy",
                      content: "Copy",
                      onClick: () => {
                        var copy: any = document.getElementById("shareLink");
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
                </Grid.Column>
              </Grid>
            </Segment>
            <Segment>
              <AddTransaction
                user={user}
                postSubmit={() => fetchTransactions()}
              />
            </Segment>
          </div>
        )}
        <Grid textAlign="center" style={{ marginTop: "2vh" }}>
          <Grid.Row>
            {transPending && <Loader active />}
            {!transPending &&
              (transactions.length ? (
                <TransactionFeed
                  transactions={transactions}
                  emailPopup={false}
                  transactionPostDelete={() => fetchTransactions()}
                />
              ) : (
                <p>No Transactions</p>
              ))}
          </Grid.Row>
        </Grid>
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
