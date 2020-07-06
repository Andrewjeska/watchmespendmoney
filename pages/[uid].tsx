import axios from "axios";
import "firebase/auth";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { Container, Grid, Loader } from "semantic-ui-react";
import TransactionFeed from "../components/TransactionFeed";
import UserSignIn from "../components/UserSignIn";

const UserFeed: React.FC = () => {
  const router = useRouter();
  const { uid } = router.query;
  console.log(uid);

  const [transactions, setTransactions] = useState([]);

  const fetchTransactions = async () => {
    try {
      const res = await axios.get(`/api/transactions/${uid}`);
      setTransactions(res.data.transactions);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // will run on each render, like componentDidUpdate
    if (uid && !transactions.length) fetchTransactions();
  });

  return (
    <div>
      <Container>
        <Grid>
          <Grid.Row>
            <Grid.Column floated="right" width={4}>
              <UserSignIn />
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Container>

      <Container style={{ paddingTop: "10vh" }} text>
        <Grid textAlign="center">
          <Grid.Row>
            {transactions.length ? (
              <TransactionFeed transactions={transactions} />
            ) : (
              <Loader active />
            )}
          </Grid.Row>
        </Grid>
      </Container>
    </div>
  );
};

export default UserFeed;
