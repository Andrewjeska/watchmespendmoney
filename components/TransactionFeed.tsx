import _ from "lodash";
import React, { useEffect, useState } from "react";
import { Feed } from "semantic-ui-react";
import { axios } from "../common/axios";
import { defaultDisplayName } from "../common/constants";
import { auth } from "../common/firebase";
import Transaction from "./Transaction";

interface TransactionFeedProps {
  transactions: Array<UserTransaction>;
  commenting?: boolean;
  emailPopup?: boolean;
  transactionPostDelete: () => void;
}

const TransactionFeed: React.FC<TransactionFeedProps> = ({
  transactions,
  commenting = true,
  emailPopup = false,
  transactionPostDelete,
}) => {
  const [currentUser, setCurrentUser] = useState({
    uid: "",
    displayName: defaultDisplayName,
  });

  // TODO: should we do this just once in a higher component?
  useEffect(() => {
    // will run on first render, like componentDidMount
    const firebaseUnsub = auth.onAuthStateChanged(async (user) => {
      if (user && user.uid) {
        // get stored displayName
        const { data: userMeta } = await axios.get("/api/users", {
          params: { uid: user.uid },
        });
        setCurrentUser({
          uid: user.uid,
          displayName: userMeta.displayName,
        });
      } else
        setCurrentUser({
          uid: "",
          displayName: defaultDisplayName,
        });
    });

    return function cleanup() {
      firebaseUnsub();
    };
  }, []);

  return (
    <Feed style={{ width: "100%" }}>
      {_.map(transactions, (t: UserTransaction, i: number) => (
        <Transaction
          key={t.id}
          transaction={t}
          postDelete={transactionPostDelete}
          currentUser={currentUser}
          commenting={commenting}
          emailPopup={emailPopup}
        />
      ))}
    </Feed>
  );
};

export default TransactionFeed;
