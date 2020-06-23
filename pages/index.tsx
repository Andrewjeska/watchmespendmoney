import axios from "axios";
import _ from "lodash";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { Container, Grid, Header, Loader, Table } from "semantic-ui-react";
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
        <Grid divided="vertically">
          <Grid textAlign="center">
            <Grid.Row>
              <Header as="h1">Watch me spend money.</Header>
            </Grid.Row>
            <Grid.Row>
              <p>
                I'm tracking my spending publicly so that I hold myself
                accountable. Feel free to roast me{" "}
                <a href="mailto:m.anderjaska@gmail.com">here.</a>
              </p>
            </Grid.Row>
            <Grid.Row>
              <a href="https://medium.com/@anderjaska/how-i-save-money-public-shaming-456d95fa06">
                Why am I doing this?
              </a>
            </Grid.Row>
            <Grid.Row>
              <SignUp />
            </Grid.Row>
          </Grid>

          <Grid.Row>
            <Header as="h2">June</Header>
            {transactions.length > 0 ? (
              <Table celled>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>Date</Table.HeaderCell>
                    <Table.HeaderCell>Amount</Table.HeaderCell>
                    <Table.HeaderCell>Description</Table.HeaderCell>
                    <Table.HeaderCell>Category</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {_.map(transactions, (t: UserTransaction, i: number) => (
                    <Table.Row key={`${t.amount} ${i}`}>
                      <Table.Cell>{moment(t.date).format("MM/DD")}</Table.Cell>
                      <Table.Cell>{t.amount?.toFixed(2)}</Table.Cell>
                      <Table.Cell>{t.description}</Table.Cell>
                      <Table.Cell>{t.category}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            ) : (
              <Loader active />
            )}
          </Grid.Row>
        </Grid>
        {transactions.length > 0 && (
          <Grid.Row textAlign="center">
            <SignUp />
          </Grid.Row>
        )}
      </Container>
    </div>
  );
};

export default Home;
