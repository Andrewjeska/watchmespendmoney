import envvar from "envvar";
import { GetStaticProps } from "next";
import React, { useEffect, useRef, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { Button, Container, Form } from "semantic-ui-react";
import { axios } from "../common/axios";
import { auth } from "../common/firebase";

interface AdminProps {
  plaidPublicKey: string;
  plaidEnv: string;
  plaidWebhook: string;
}

const Admin: React.FC<AdminProps> = ({
  plaidPublicKey,
  plaidEnv,
  plaidWebhook,
}) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [email, setEmail] = useState("");

  const [pw, setPw] = useState("");
  const [uid, setUID] = useState("");
  // this a little dumb but we have to do it like this
  const uidRef = useRef(uid);
  useEffect(() => {
    uidRef.current = uid;
  });

  //TODO: is there a better way to encapsulate this
  const onSuccess = async (token: string, meta: any) => {
    await axios.post("/api/plaid/get_access_token", {
      publicToken: token,
      uid: uidRef.current,
    });
  };

  var config = {
    clientName: "watchmespendmoney",
    env: plaidEnv,
    product: ["auth", "transactions"],
    publicKey: plaidPublicKey,
    webhook: plaidWebhook,
    onSuccess,
  };

  const { open, ready, error } = usePlaidLink(config);

  useEffect(() => {
    // will run on first render, like componentDidMount
    const firebaseUnsub = auth.onAuthStateChanged((user) => {
      if (user && user.email && user.uid) {
        // User is signed in.
        setUID(user.uid);
        setEmail(user.email);
        setAuthenticated(true);
      }
    });

    return function cleanup() {
      firebaseUnsub();
    };
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    console.log("handle submit");
    console.log(email);
    auth.signInWithEmailAndPassword(email, pw).catch((error) => {
      console.error(error.message);
    });
  };

  //TODO: layout component
  return (
    <div>
      <Container style={{ paddingTop: "10vh", paddingBottom: "10vh" }}>
        {authenticated && email ? (
          <div>
            <a href="/">Home</a>
            <button type="button" onClick={() => open()} disabled={!ready}>
              Connect to a bank
            </button>
          </div>
        ) : (
          <Form onSubmit={(e) => handleSubmit(e)}>
            <Form.Input
              placeholder="Email"
              value={email}
              onChange={(e, { value }) => {
                setEmail(value);
              }}
            ></Form.Input>
            <Form.Input
              type="password"
              placeholder="password"
              value={pw}
              onChange={(e, { value }) => {
                setPw(value);
              }}
            ></Form.Input>

            <Button type="submit">Submit</Button>
          </Form>
        )}
      </Container>
    </div>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  // this runs server-side
  return {
    props: {
      plaidPublicKey: envvar.string("PLAID_PUBLIC_KEY"),
      plaidEnv: envvar.string("PLAID_ENV"),
      plaidHookURL: envvar.string("PLAID_WEBHOOK"),
    },
  };
};

export default Admin;
