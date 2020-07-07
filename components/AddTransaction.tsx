import axios from "axios";
import "firebase/auth";
import moment from "moment";
import React, { useState } from "react";
import { Button, Form } from "semantic-ui-react";

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
      const res = await axios.post("/api/transactions/create", {
        transaction: {
          uid: user.uid,
          user: user.displayName,
          date,
          amount,
          description,
          category,
          reason,
        },
      });
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
          onChange={(e) => setAmount(parseFloat(e.target.value))}
        />
        <Form.Input
          label="Category"
          placeholder="Category"
          width={5}
          onChange={(e) => setCategory(e.target.value)}
        />
        <Form.Input
          label="Reason"
          placeholder="Why did you buy this? (Optional)"
          width={8}
          onChange={(e) => setReason(e.target.value)}
        />
      </Form.Group>

      <Button onClick={() => submitTransaction()} type="submit">
        Add Transaction
      </Button>
    </Form>
  );
};

export default AddTransaction;
