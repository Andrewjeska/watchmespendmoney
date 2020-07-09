import _ from "lodash";
import React from "react";
import { Feed } from "semantic-ui-react";
import { auth } from "../utils/firebase";
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
  const currentUser = {
    handle: auth.currentUser?.displayName || "Anon",
    profile: "",
  };

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
