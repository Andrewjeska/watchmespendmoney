import * as React from "react";
import { Container, Grid, Header, Table } from "semantic-ui-react";

const Home: React.FC = () => {
  return (
    <div>
      <Container
        style={{ paddingTop: "10vh", paddingBottom: "10vh" }}
        // textAlign="center"

        text
      >
        <Grid divided="vertically">
          <Grid.Row>
            <Header as="h1">Watch me spend money</Header>
            <p>
              {" "}
              I'm tracking my spending publicly so that I hold myself
              accountable. Feel free to roast me{" "}
              <a href="m.anderjaska@gmail.com">here</a>
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
            </Table>
          </Grid.Row>
        </Grid>
      </Container>
    </div>
  );
};

export default Home;
