import axios from "axios";
import envvar from "envvar";
import { GetStaticProps } from "next";
import React, { useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { Button, Container, Form } from "semantic-ui-react";
import { auth } from "../utils/firebase";

interface AdminProps {
  plaidPublicKey: string;
}

const Admin: React.FC<AdminProps> = ({ plaidPublicKey }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");

  const onSuccess = async (token, metadata) => {
    await axios.post("/api/plaid/get_access_token", {
      publicToken: token,
      userName: email,
    });
  };

  useEffect(() => {
    // will run on first render, like componentDidMount
    auth.onAuthStateChanged((user) => {
      if (user) {
        // User is signed in.
        console.log("on auth state changed");
        console.log(user.email);
        setEmail(user.email);
        setAuthenticated(true);
      }
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
    console.log(email);
    auth.signInWithEmailAndPassword(email, pw).catch((error) => {
      console.error(error.message);
    });
  };

  const { open, ready, error } = usePlaidLink(config);
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
  return {
    props: {
      plaidPublicKey: envvar.string("PLAID_PUBLIC_KEY"),
    },
  };
};

export default Admin;
