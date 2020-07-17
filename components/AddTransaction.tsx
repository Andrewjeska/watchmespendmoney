import "firebase/auth";
import moment from "moment";
import React, { useState } from "react";
import { Button, Form, Icon } from "semantic-ui-react";
import { axios } from "../common/axios";
import { auth } from "../common/firebase";

interface AddTransactionProps {
  user: firebase.User;
  postSubmit: () => void;
}

const AddTransaction: React.FC<AddTransactionProps> = ({
  user,
  postSubmit,
}) => {
  const [date, setDate] = useState(moment().format("YYYY-MM-DD"));
  const [amount, setAmount] = useState(0.0);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  // reason will appear as the top comment
  const [reason, setReason] = useState("");

  const submitTransaction = async () => {
    try {
      const firebaseUser = auth.currentUser;
      var token = "";
      if (firebaseUser) token = await firebaseUser.getIdToken(true);
      else {
        console.error("firebase.auth() not ready");
        return;
      }
      await axios({
        method: "post",
        url: "/api/transactions/create",
        data: {
          transaction: {
            uid: user.uid,
            date: moment(date).toISOString(),
            description,
            amount,
            category,
            reason,
          },
          headers: { AuthToken: token },
        },
      });
      setAmount(0.0);
      setDescription("");
      setCategory("");
      setReason("");
      postSubmit();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Form>
      <Form.Group>
        <Form.Input
          label="Date"
          placeholder="date"
          width={8}
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <Form.Input
          label="What did you buy?"
          placeholder="Description"
          width={8}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Form.Group>
      <Form.Group>
        <Form.Input
          type="number"
          step="0.01"
          label="Amount"
          placeholder="$"
          width={3}
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value))}
        />
        <Form.Input
          label="Category"
          placeholder="Category"
          width={5}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <Form.Input
          label="Reason"
          placeholder="Why did you buy this? (Optional)"
          width={8}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </Form.Group>

      <Button
        color="teal"
        icon
        labelPosition="left"
        style={{ position: "right" }}
        onClick={() => submitTransaction()}
        type="submit"
      >
        <Icon name="plus" />
        Add Transaction
      </Button>
    </Form>
  );
};

export default AddTransaction;
