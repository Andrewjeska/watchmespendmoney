import "firebase/auth";
import { GetServerSideProps } from "next";
import Head from "next/head";
import React, { useEffect, useState } from "react";
import { Container } from "semantic-ui-react";
import { auth } from "../common/firebase";
import FeedWithDash from "../components/FeedWithDash";
import Navbar from "../components/Navbar";

interface UserFeedProps {
  uid: string;
}

const UserFeed: React.FC<UserFeedProps> = ({ uid }) => {
  const [currentUser, setCurrentUser] = useState(auth.currentUser);

  useEffect(() => {
    const firebaseUnsub = auth.onAuthStateChanged((user) => {
      if (user) setCurrentUser(user);
    });

    //Fun fact: we have to wait for the auth object to initialize, hence this call here
    setCurrentUser(auth.currentUser);

    return function cleanup() {
      firebaseUnsub();
    };
  }, []);

  return (
    <div>
      <Head>
        <meta name="robots" content="noindex" />
        <meta name="googlebot" content="noindex" />
      </Head>
      <Navbar></Navbar>
      <Container style={{ paddingTop: "10vh" }}>
        <FeedWithDash currentUser={currentUser} uid={uid} />
      </Container>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    props: { uid: context.query.uid }, // will be passed to the page component as props
  };
};

export default UserFeed;
