import axios from "axios";
import "firebase/auth";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import {
  Container,
  Grid,
  Header,
  Input,
  Loader,
  Segment,
} from "semantic-ui-react";
import Navbar from "../components/Navbar";
import TransactionFeed from "../components/TransactionFeed";
import { auth } from "../utils/firebase";

const UserFeed: React.FC = () => {
  const router = useRouter();
  const { uid } = router.query;

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
                  defaultValue={`${window.location.href}/${uid}`}
                />
              </Grid.Column>
            </Grid>
          </Segment>
        )}
        <Grid textAlign="center">
          <Grid.Row>
            {transPending && <Loader active />}
            {!transPending &&
              (transactions.length ? (
                <TransactionFeed
                  transactions={transactions}
                  emailPopup={false}
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

// export const getStaticProps: GetStaticProps = async () => {
//   // this runs server-side
//   return {
//     props: {
//       vercelURL: process.env.VERCEL_URL || "http://localhost:3000",
//     },
//   };
// };

// export async function getStaticPaths() {
//   return {
//     paths: [],
//     fallback: true,
//   };
// }

export default UserFeed;
