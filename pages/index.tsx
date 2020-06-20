import axios from "axios";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import { Container, Grid, Header, Table } from "semantic-ui-react";

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
      <Container style={{ paddingTop: "10vh", paddingBottom: "10vh" }} text>
        <Grid divided="vertically">
          <Grid.Row>
            <Header as="h1">Watch me spend money.</Header>
            <p>
              {" "}
              I'm tracking my spending publicly so that I hold myself
              accountable. Feel free to roast me{" "}
              <a href="m.anderjaska@gmail.com">here.</a>
            </p>
          </Grid.Row>
          <Grid.Row>
            <Header as="h2">June</Header>
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
                {transactions.length > 0
                  ? _.map(transactions, (t: UserTransaction, i: number) => {
                      return (
                        <Table.Row key={`${t.amount} ${i}`}>
                          <Table.Cell>{t.date}</Table.Cell>
                          <Table.Cell>{t.amount}</Table.Cell>
                          <Table.Cell>{t.description}</Table.Cell>
                          <Table.Cell>{t.category}</Table.Cell>
                        </Table.Row>
                      );
                    })
                  : null}
              </Table.Body>
            </Table>
          </Grid.Row>
        </Grid>
      </Container>
    </div>
  );
};

export default Home;
