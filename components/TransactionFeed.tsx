import "firebase/auth";
import _ from "lodash";
import React from "react";
import { Feed } from "semantic-ui-react";
import Transaction from "./Transaction";

interface TransactionFeedProps {
  transactions: Array<UserTransaction>;
  currentUser: UserMeta;
  commenting?: boolean;
}

const TransactionFeed: React.FC<TransactionFeedProps> = ({
  transactions,
  currentUser,
  commenting = true,
}) => {
  return (
    <Feed style={{ width: "100%" }}>
      {_.map(transactions, (t: UserTransaction, i: number) => (
        <Transaction
          key={t.id}
          transaction={t}
          currentUser={currentUser}
          commenting={commenting}
        />
      ))}
    </Feed>
  );
};

export default TransactionFeed;
