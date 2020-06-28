import axios from "axios";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import {
  Button,
  Container,
  Feed,
  Grid,
  Header,
  Loader,
} from "semantic-ui-react";
import Transaction from "../components/Transaction";

const Home: React.FC = () => {
  const [authenticated, setAuthenticated] = useState(true);
  const [transactions, setTransactions] = useState([]);

  const fetchTransactions = async () => {
    try {
      const res = await axios.get("/api/plaid/transactions");
      setTransactions(res.data.transactions);
    } catch (err) {
      setAuthenticated(false);
    }
  };

  useEffect(() => {
    // will run on first render, like componentDidMount
    fetchTransactions();
  }, []);

  useEffect(() => {
    // will run on each render, like componentDidUpdate
    if (authenticated && transactions.length === 0) {
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
                into saving money. My expenses are public for the world to see.
                Feel free to roast me for stupid purchases{" "}
                <a href="https://www.facebook.com/groups/958669324568709/">
                  here.
                </a>
              </p>
            </Grid.Row>

            <Grid.Row>
              <p>
                <b>watchmespendmoney</b> is an accountablity tool that keeps you
                honest on your expenses by making them public. Stay updated on
                development and be the first to know when the beta is released
                by clicking the button below!
              </p>
            </Grid.Row>
            <Grid.Row>
              <Grid.Column width={10}>
                {/* <SignUp /> */}
                <Button
                  primary
                  onClick={() =>
                    window.open(process.env.NEXT_PUBLIC_EMAIL_SIGNUP, "_blank")
                  }
                  content={"Save fat stacks now!"}
                />
              </Grid.Column>
            </Grid.Row>
          </Grid>

          <Grid.Row>
            {transactions.length > 0 ? (
              <Feed style={{ width: "100%" }}>
                {_.map(transactions, (t: UserTransaction, i: number) => (
                  <Transaction key={t.id} transaction={t} />
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
                <Button
                  primary
                  onClick={() =>
                    window.open(process.env.NEXT_PUBLIC_EMAIL_SIGNUP, "_blank")
                  }
                  content={"Save fat stacks now!"}
                />
              </Grid.Column>
            </Grid.Row>
          </Grid>
        )}
      </Container>
    </div>
  );
};

export default Home;
