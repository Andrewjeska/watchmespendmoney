import _ from "lodash";
import React, { useEffect, useState } from "react";
import { Feed } from "semantic-ui-react";
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
  emailPopup = true,
  transactionPostDelete,
}) => {
  const [currentUID, setCurrentUID] = useState("");

  // TODO: should we do this just once in a higher component?
  useEffect(() => {
    // will run on first render, like componentDidMount
    auth.onAuthStateChanged((user) => {
      if (user && user.uid) {
        setCurrentUID("uid");
      } else setCurrentUID("");
    });
  }, []);

  return (
    <Feed style={{ width: "100%" }}>
      {_.map(transactions, (t: UserTransaction, i: number) => (
        <Transaction
          key={t.id}
          transaction={t}
          postDelete={transactionPostDelete}
          currentUID={currentUID}
          commenting={commenting}
          emailPopup={emailPopup}
        />
      ))}
    </Feed>
  );
};

export default TransactionFeed;
