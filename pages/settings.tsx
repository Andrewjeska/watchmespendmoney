import envvar from "envvar";
import _ from "lodash";
import { GetServerSideProps } from "next";
import { useEffect, useRef, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import {
  Button,
  Checkbox,
  Container,
  Grid,
  Icon,
  Loader,
  Table,
} from "semantic-ui-react";
import { axios } from "../common/axios";
import { auth } from "../common/firebase";
import Navbar from "../components/Navbar";

interface SettingsProps {
  plaidPublicKey: string;
  plaidEnv: string;
  plaidWebhook: string;
}

const UserFeed: React.FC<SettingsProps> = ({
  plaidPublicKey,
  plaidEnv,
  plaidWebhook,
}) => {
  // firebase

  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  useEffect(() => {
    const firebaseUnsub = auth.onAuthStateChanged((user) => {
      if (user && user.uid) setCurrentUser(user);
    });

    return function cleanup() {
      firebaseUnsub();
    };
  }, []);

  // Bank info as it is in our db

  const [bankAccounts, setBankAccounts] = useState(
    [] as Array<UserBankAccount>
  );
  const [denylist, setDenylist] = useState([] as Array<string>);

  const getBankAccounts = async (user: firebase.User) => {
    try {
      const firebaseToken = await user.getIdToken(true);
      const res = await axios({
        method: "get",
        url: "/api/users/bank_accounts",
        params: {
          uid: plaidEnv === "sandbox" ? "sandbox" : user.uid,
        },
        headers: { authToken: firebaseToken },
      });
      setBankAccounts(res.data.accounts);
      setDenylist(res.data.denylist);
    } catch (error) {
      console.error(error);
    }
  };

  const deleteBankAccount = async (user: firebase.User, mask: string) => {
    try {
      const firebaseToken = await user.getIdToken(true);
      const res = await axios({
        method: "post",
        url: "/api/users/bank_accounts/delete",
        data: {
          uid: plaidEnv === "sandbox" ? "sandbox" : user.uid,
          mask,
        },
        headers: { authToken: firebaseToken },
      });
      setBankAccounts(res.data.accounts);
      setDenylist(res.data.denylist);
    } catch (error) {
      console.error(error);
    }
  };

  const toggleBankAccount = async (
    user: firebase.User,
    mask: string,
    checked: boolean
  ) => {
    try {
      const firebaseToken = await user.getIdToken(true);
      const res = await axios({
        method: "post",
        url: "/api/users/bank_accounts/toggle",
        data: {
          uid: plaidEnv === "sandbox" ? "sandbox" : user.uid,
          mask,
          checked,
        },
        headers: { authToken: firebaseToken },
      });
      setDenylist(res.data.denylist);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (currentUser) getBankAccounts(currentUser);
  }, [currentUser]);

  // Plaid

  const userRef = useRef(currentUser);
  useEffect(() => {
    userRef.current = currentUser;
  }, [currentUser]);

  const onSuccess = async (token: string, meta: any) => {
    if (!userRef.current) {
      console.error("User not set");
      return;
    }

    try {
      var firebaseToken = "";
      const firebaseUser = userRef.current;
      if (firebaseUser) firebaseToken = await firebaseUser.getIdToken(true);
      else {
        console.error("user not yet set");
        return;
      }
      const res = await axios({
        method: "post",
        url: "/api/plaid/add_item",
        data: {
          publicToken: token,
          uid: plaidEnv === "sandbox" ? "sandbox" : firebaseUser.uid,
        },
        headers: { authToken: firebaseToken },
      });

      const newAccounts = res.data.accounts as Array<UserBankAccount>;
      setBankAccounts(newAccounts);
      setDenylist(res.data.denylist);
    } catch (error) {
      console.error(error);
    }
  };

  var config = {
    clientName: "watchmespendmoney",
    env: plaidEnv,
    product: ["auth", "transactions"],
    publicKey: plaidPublicKey,
    webhook: plaidWebhook,
    onSuccess,
  };

  const unlinkAccount = async (user: firebase.User) => {
    try {
      const firebaseToken = await user.getIdToken(true);
      const res = await axios({
        method: "post",
        url: "/api/plaid/remove_item",
        data: {
          uid: plaidEnv === "sandbox" ? "sandbox" : user.uid,
        },
        headers: { authToken: firebaseToken },
      });
      console.log(res.data);
      if (res.data.removed) {
        setBankAccounts([]);
        setDenylist([]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const { open, ready, error } = usePlaidLink(config);

  return (
    <div>
      <Navbar></Navbar>
      <Container style={{ paddingTop: "10vh" }}>
        {currentUser && bankAccounts ? (
          <Grid>
            <Grid.Row width={16}>
              <Button
                primary
                onClick={() => open()}
                type="submit"
                disabled={!ready || (bankAccounts && bankAccounts.length > 0)}
              >
                <Icon name="money"></Icon> Link your Bank Account
              </Button>
            </Grid.Row>
            {bankAccounts && bankAccounts.length > 0 && (
              <Grid.Row width={16}>
                <Button
                  negative
                  onClick={() => unlinkAccount(currentUser)}
                  type="submit"
                >
                  <Icon name="delete"></Icon> Unlink your Bank Account
                </Button>
              </Grid.Row>
            )}

            {bankAccounts && bankAccounts.length > 0 && (
              <Grid.Row width={8}>
                <Table celled definition>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell />
                      <Table.HeaderCell>Account Name</Table.HeaderCell>
                      <Table.HeaderCell>Last Four</Table.HeaderCell>
                      <Table.HeaderCell>Include?</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {_.map(bankAccounts, (account: UserBankAccount) => {
                      const accountDisabled = denylist.includes(account.mask);
                      return (
                        <Table.Row>
                          <Table.Cell collapsing>
                            <Button
                              icon
                              onClick={() =>
                                // will this rerender if the user changed?
                                deleteBankAccount(currentUser, account.mask)
                              }
                            >
                              <Icon name="delete"></Icon>
                            </Button>
                          </Table.Cell>
                          <Table.Cell>{account.name}</Table.Cell>
                          <Table.Cell>{account.mask}</Table.Cell>
                          <Table.Cell>
                            <Checkbox
                              toggle
                              defaultChecked={accountDisabled}
                              onChange={(e, value) =>
                                toggleBankAccount(
                                  currentUser,
                                  account.mask,
                                  value.checked as boolean
                                )
                              }
                            />
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </Table.Body>
                </Table>
              </Grid.Row>
            )}
          </Grid>
        ) : (
          <Loader active />
        )}
      </Container>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {
      plaidPublicKey: envvar.string("PLAID_PUBLIC_KEY"),
      plaidEnv: envvar.string("PLAID_ENV", "sandbox"),
      plaidWebhook: envvar.string("PLAID_WEBHOOK"),
      plaidLinkFF: envvar.boolean("PLAID_LINK+FF"),
    }, // will be passed to the page component as props
  };
};

export default UserFeed;
