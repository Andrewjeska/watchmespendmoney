import "firebase/auth";
import _ from "lodash";
import moment from "moment";
import React, { useState } from "react";
import { Button, Form, Icon } from "semantic-ui-react";
import { authenticatedRequest } from "../common/axios";
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

  const [submitError, setSumbmitError] = useState(null as null | string);

  const submitTransaction = async () => {
    try {
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        var data: any = {
          uid: user.uid,
          date: moment(date).toISOString(),
          description,
          amount,
          category,
        };

        if (reason.length) data["reason"] = reason;

        await authenticatedRequest(
          firebaseUser,
          "post",
          "/api/transactions/create",
          {
            data,
          }
        );
        setAmount(0.0);
        setDescription("");
        setCategory("");
        setReason("");
        setSumbmitError(null);
        postSubmit();
      } else {
        console.error("firebase.auth() not ready");
      }
    } catch (err) {
      console.error(err);
      if (err.response.data.errors) {
        const validationErrors = err.response.data.errors;
        const errorMsgs = _.reduce(
          validationErrors,
          (acc, err) => {
            return `${acc}${err}<br/>`;
          },
          ""
        );
        setSumbmitError(errorMsgs);
      }
    }
  };

  return (
    <Form>
      {submitError && (
        <p
          style={{ color: "red" }}
          dangerouslySetInnerHTML={{ __html: submitError }}
        ></p>
      )}
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
