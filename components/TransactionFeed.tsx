import _ from "lodash";
import React, { useEffect, useState } from "react";
import { Feed } from "semantic-ui-react";
import { DEFAULT_DISPLAY_NAME } from "../common/constants";
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
    displayName: DEFAULT_DISPLAY_NAME,
  } as UserMeta);

  useEffect(() => {
    // will run on first render, like componentDidMount
    const firebaseUnsub = auth.onAuthStateChanged(async (user) => {
      if (user && user.uid && user.displayName) {
        // get stored displayName

        setCurrentUser({
          uid: user.uid,
          displayName: user.displayName,
        });
      } else
        setCurrentUser({
          uid: null,
          displayName: DEFAULT_DISPLAY_NAME,
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
