import "firebase/auth";
import _ from "lodash";
import React, { useState } from "react";
import { Button, Form, Icon, Input } from "semantic-ui-react";
import { authenticatedRequest } from "../common/axios";
import { auth } from "../common/firebase";

interface EditTransactionProps {
  transaction: UserTransaction;
  categoryOptions: string[];
  postSubmit: () => void;
}

const EditTransaction: React.FC<EditTransactionProps> = ({
  transaction,
  categoryOptions,
  postSubmit,
}) => {
  const [date, setDate] = useState(transaction.date);
  const [amount, setAmount] = useState(transaction.amount);
  const [description, setDescription] = useState(transaction.description);
  const [category, setCategory] = useState(transaction.category);
  // reason will appear as the top comment
  const [reason, setReason] = useState("");

  const [submitError, setSubmitError] = useState(null as null | string);

  const editTransaction = async () => {
    try {
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        await authenticatedRequest(
          firebaseUser,
          "post",
          "/api/transactions/edit",
          {
            data: {
              id: 
              date: moment(date).toISOString(),
              description,
              amount: amount ? (amount as number).toFixed(2) : 0,
              category,
              reason,
            },
          }
        );

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
          label="Description"
          placeholder="What did you buy?"
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
        onClick={() => editTransaction()}
        type="submit"
      >
        <Icon name="pencil alternate" />
        Edit Transaction
      </Button>
    </Form>
  );
};

export default EditTransaction;
