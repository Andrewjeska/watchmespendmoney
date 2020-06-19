import axios from "axios";
import { GetStaticProps } from "next";
import React, { useCallback, useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { Button, Container, Form } from "semantic-ui-react";
import { baseURL } from "../common/constants";
import { auth } from "../utils/firebase";

interface AdminProps {
  plaidPublicKey: string;
}

const Admin: React.FC<AdminProps> = ({ plaidPublicKey }) => {
  const [authenticated, setAuthenticated] = useState(false);

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");

  const onSuccess = useCallback(async (token, metadata) => {
    // send token to server
    await axios.post(`${baseURL}/api/plaid/get_access_token`, {
      publicToken: token,
    });
  }, []);

  useEffect(() => {
    // will run on first render, like componentDidMount
    auth.onAuthStateChanged((user) => {
      if (user)
        // User is signed in.
        setAuthenticated(true);
    });
  }, []);

  const config = {
    clientName: "watchmespendmoney",
    env: "sandbox",
    product: ["auth", "transactions"],
    publicKey: plaidPublicKey,
    onSuccess,
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    auth.signInWithEmailAndPassword(email, pw).catch((error) => {
      console.error(error.message);
    });
  };

  const { open, ready, error } = usePlaidLink(config);
  //TODO: layout component
  return (
    <div>
      <Container style={{ paddingTop: "10vh", paddingBottom: "10vh" }}>
        {authenticated ? (
          <button type="button" onClick={() => open()} disabled={!ready}>
            Connect to a bank
          </button>
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

export const getStaticProp: GetStaticProps = async () => {
  return {
    props: {
      plaidPublicKey: process.env.PLAID_PUBLIC_KEY,
    },
  };
};

export default Admin;
