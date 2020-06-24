import axios from "axios";
import _ from "lodash";
import moment from "moment";
import React, { useEffect, useState } from "react";
import {
  Container,
  Divider,
  Feed,
  Grid,
  Header,
  Loader,
} from "semantic-ui-react";
import { svgs } from "../common/imagery";
import SignUp from "../components/SignUp";

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

            <Grid.Row>Want to try this for yourself?</Grid.Row>
            <Grid.Row>
              <Grid.Column>
                <SignUp />
              </Grid.Column>
            </Grid.Row>
            <Divider />
          </Grid>

          <Grid.Row>
            {/* <Header as="h2">June</Header> */}
            {transactions.length > 0 ? (
              <Feed style={{ width: "100%" }}>
                {_.map(transactions, (t: UserTransaction, i: number) => (
                  <Feed.Event>
                    <Feed.Label>
                      <div
                        dangerouslySetInnerHTML={{ __html: svgs[t.category] }}
                      ></div>
                    </Feed.Label>
                    <Feed.Content>
                      <Feed.Summary>
                        <a href="https://twitter.com/anderjaska1">Michael</a>
                        {` spent \$${t.amount?.toFixed(2)} at ${t.description}`}
                        <Feed.Date>{moment(t.date).format("MM/DD")}</Feed.Date>
                      </Feed.Summary>
                      <Feed.Extra text>{`${t.category}`}</Feed.Extra>
                      <Divider />
                    </Feed.Content>
                  </Feed.Event>
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
              <Grid.Column>
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
