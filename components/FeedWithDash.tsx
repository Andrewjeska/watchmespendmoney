import _ from "lodash";
import moment from "moment";
import { useEffect, useState } from "react";
import { useMediaQuery } from "react-responsive";
import Sticky from "react-sticky-el";
import {
  Dropdown,
  Grid,
  Header,
  Input,
  Loader,
  Rail,
  Segment,
  Statistic,
} from "semantic-ui-react";
import { axios } from "../common/axios";
import AddTransaction from "./AddTransaction";
import TransactionFeed from "./TransactionFeed";

interface TransactionFilter {
  category?: string;
}

interface FeedWithDashProps {
  currentUser: firebase.User | null;
  uid: string;
  homePageDisplay?: boolean;
}

const FeedWithDash: React.FC<FeedWithDashProps> = ({
  currentUser,
  uid,
  homePageDisplay = false,
}) => {
  const [transactions, setTransactions] = useState(
    [] as Array<UserTransaction>
  );
  const [transPending, setTransPending] = useState(true);
  const [categories, setCategories] = useState([]);
  const [filter, setFilter] = useState({} as TransactionFilter);

  const fetchTransactions = async () => {
    try {
      const res = await axios.get("/api/transactions/", {
        params: { uid },
        headers: { "Cache-Control": "no-cache" },
      });
      setTransactions(res.data.transactions);
      setCategories(res.data.categories);
      setTransPending(false);
    } catch (err) {
      console.error(err);
    }
  };

  const [stats, setStats] = useState(null as UserStats | null);
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

  useEffect(() => {
    // will run on first render, like componentDidMount
    if (uid) fetchTransactions();

    fetchStats();
  }, []);

  const userLoggedIn = currentUser && currentUser.uid === uid;

  const transactionsFiltered = _.filter(transactions, filter) as Array<
    UserTransaction
  >;

  const dashWidth = homePageDisplay || !userLoggedIn ? 6 : 8;
  const feedWidth = homePageDisplay || !userLoggedIn ? 10 : 8;

  const isTabletOrMobile = useMediaQuery({ query: "(max-width: 1224px)" });
  const isTabletOrMobileDevice = useMediaQuery({
    query: "(max-device-width: 1224px)",
  });

  if (homePageDisplay || !userLoggedIn)
    return (
      <Grid stackable columns={2} textAlign="center">
        <Grid.Column width={feedWidth}>
          <Sticky>
            <Rail position="left">
              <Grid.Row className="user-dash-row">
                <Segment className="wmsm-segment">
                  <Header as="h3">Filter</Header>
                  <Dropdown
                    placeholder="Category"
                    clearable
                    fluid
                    selection
                    onChange={(e, data) => {
                      const category = data.value as string;
                      if (category.length)
                        setFilter(
                          Object.assign({}, { category: data.value as string })
                        );
                      else setFilter({});
                    }}
                    options={_.map(categories, (cat) => {
                      return { key: cat, text: cat, value: cat };
                    })}
                  />
                </Segment>
              </Grid.Row>
              <Grid.Row className="user-dash-row">
                <Segment className="wmsm-segment">
                  <Header as="h3">
                    Stats for {stats ? stats.displayName : "Loading..."}
                  </Header>

                  <Grid textAlign="center">
                    {generateStats(transactionsFiltered, filter, stats)}
                  </Grid>
                </Segment>
              </Grid.Row>
            </Rail>
          </Sticky>

          {transPending && <Loader active />}
          {!transPending &&
            (transactions.length ? (
              <TransactionFeed
                transactions={transactionsFiltered}
                emailPopup={false}
                transactionPostDelete={() => {
                  fetchTransactions();
                  fetchStats();
                }}
                categories={categories}
              />
            ) : (
              <p>No Transactions</p>
            ))}
        </Grid.Column>
      </Grid>
    );

  return (
    <Grid columns={2} stackable>
      <Grid.Column width={dashWidth}>
        <Sticky disabled={isTabletOrMobileDevice || isTabletOrMobile}>
          {userLoggedIn && [
            <Grid.Row className="user-dash-row">
              <Segment className="wmsm-segment">
                <Header as="h2">Share your Feed</Header>
                <Grid textAlign="center">
                  <Grid.Row textAlign="center">
                    <Input
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
                  </Grid.Row>
                </Grid>
              </Segment>
            </Grid.Row>,
            <Grid.Row className="user-dash-row">
              <Segment className="wmsm-segment">
                <Header as="h2">Log a Transaction</Header>
                <AddTransaction
                  categoryOptions={categories}
                  postSubmit={() => {
                    fetchTransactions();
                    fetchStats();
                  }}
                />
              </Segment>
            </Grid.Row>,
          ]}

          <Grid.Row className="user-dash-row">
            <Segment className="wmsm-segment">
              <Header as="h3">Filter</Header>
              <Dropdown
                placeholder="Category"
                clearable
                fluid
                selection
                onChange={(e, data) => {
                  const category = data.value as string;
                  if (category.length)
                    setFilter(
                      Object.assign({}, { category: data.value as string })
                    );
                  else setFilter({});
                }}
                options={_.map(categories, (cat) => {
                  return { key: cat, text: cat, value: cat };
                })}
              />
            </Segment>
          </Grid.Row>
          <Grid.Row className="user-dash-row">
            <Segment className="wmsm-segment">
              <Header as="h3">
                Stats for {stats ? stats.displayName : "Loading..."}
              </Header>

              <Grid textAlign="center">
                {generateStats(transactionsFiltered, filter, stats)}
              </Grid>
            </Segment>
          </Grid.Row>
        </Sticky>
      </Grid.Column>
      <Grid.Column width={feedWidth}>
        {transPending && <Loader active />}
        {!transPending &&
          (transactions.length ? (
            <TransactionFeed
              transactions={transactionsFiltered}
              emailPopup={false}
              transactionPostDelete={() => {
                fetchTransactions();
                fetchStats();
              }}
            />
          ) : (
            <p>No Transactions</p>
          ))}
      </Grid.Column>
    </Grid>
  );
};

const generateStats = (
  filteredTransactions: Array<UserTransaction>,
  filter: TransactionFilter,
  stats: UserStats | null
) => {
  if (_.keys(filter).length) {
    const sum = _.reduce(
      filteredTransactions,
      (acc, t) => {
        return acc + t.amount;
      },
      0.0
    );
    return (
      <Grid.Row>
        <Statistic.Group>
          <Statistic>
            <Statistic.Label>Total spent on {filter.category}</Statistic.Label>
            <Statistic.Value>{sum.toFixed(2)}</Statistic.Value>
          </Statistic>
        </Statistic.Group>
      </Grid.Row>
    );
  } else {
    return (
      <Grid.Row>
        <Statistic>
          <Statistic.Label>
            Total spent in {moment().format("MMMM")}
          </Statistic.Label>
          <Statistic.Value>
            {stats && stats.currentMonthSpend
              ? "$" + stats.currentMonthSpend.toFixed(2)
              : 0}
          </Statistic.Value>
        </Statistic>
        <Statistic>
          <Statistic.Label>Average Daily Spend</Statistic.Label>
          <Statistic.Value>
            {stats && stats.avgSpendPerDay
              ? "$" + stats.avgSpendPerDay.toFixed(2)
              : 0}
          </Statistic.Value>
        </Statistic>
        <Statistic>
          <Statistic.Label>Days since last spend</Statistic.Label>
          <Statistic.Value>
            {stats && stats.daysSinceLastSpend ? stats.daysSinceLastSpend : 0}
          </Statistic.Value>
        </Statistic>
      </Grid.Row>
    );
  }
};

export default FeedWithDash;
