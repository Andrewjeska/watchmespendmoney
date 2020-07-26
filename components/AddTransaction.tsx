import "firebase/auth";
import _ from "lodash";
import moment from "moment";
import React, { useState } from "react";
import { Button, Form, Icon, Input } from "semantic-ui-react";
import { authenticatedRequest } from "../common/axios";
import { auth } from "../common/firebase";

interface AddTransactionProps {
  user: firebase.User;
  categoryOptions: string[];
  postSubmit: () => void;
}

const AddTransaction: React.FC<AddTransactionProps> = ({
  user,
  categoryOptions,
  postSubmit,
}) => {
  const [date, setDate] = useState(moment().format("YYYY-MM-DD"));
  const [amount, setAmount] = useState(null as null | number);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  // reason will appear as the top comment
  const [reason, setReason] = useState("");

  const [submitError, setSubmitError] = useState(null as null | string);

  const submitTransaction = async () => {
    try {
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        await authenticatedRequest(
          firebaseUser,
          "post",
          "/api/transactions/create",
          {
            data: {
              uid: user.uid,
              date: moment(date).toISOString(),
              description,
              amount: amount ? (amount as number).toFixed(2) : 0,
              category,
              reason,
            },
          }
        );
        setAmount(null);
        setDescription("");
        setCategory("");
        setReason("");
        setSubmitError(null);
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
          (acc, error) => {
            const key = Object.keys(error)[0];
            return `${acc}${key}: ${error[key]} <br/>`;
          },
          ""
        );
        setSubmitError(errorMsgs);
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
          min="0.00"
          label="Amount"
          placeholder="$"
          width={3}
          value={amount === null ? "" : amount}
          onChange={(e) => setAmount(parseFloat(e.target.value))}
        />
        <Form.Input label="Category" width={5}>
          <Input
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            list="categories"
          ></Input>
          <datalist id="categories">
            {_.map(categoryOptions, (cat) => (
              <option value={cat} />
            ))}
          </datalist>
        </Form.Input>

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
        style={{ position: "right", marginTop: "5%" }}
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
