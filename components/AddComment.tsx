import _ from "lodash";
import moment from "moment";
import React, { useState } from "react";
import { Button, Form } from "semantic-ui-react";
import { axios } from "../common/axios";

interface AddCommentProps {
  uid: string | null;
  transactionId: string;
  parentId?: string;
  postSubmit: (newComment?: any) => void;
  onClose: () => void;
}

const AddComment: React.FC<AddCommentProps> = ({
  uid,
  transactionId,
  parentId = null,
  postSubmit,
  onClose,
}) => {
  const [submitError, setSubmitError] = useState(null as null | string);
  const [replyContent, setReplyContent] = useState("");

  const reply = async (text: string) => {
    try {
      const res = await axios.post("/api/transactions/comment", {
        dateTime: moment().toISOString(),
        text,
        uid: uid,
        transactionId,
        parentId,
      });
      setSubmitError(null);
      setReplyContent("");
      postSubmit(res.data.comments);
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
    <Form style={{ marginTop: "1vh" }} reply>
      {submitError && (
        <p
          style={{ color: "red" }}
          dangerouslySetInnerHTML={{ __html: submitError }}
        ></p>
      )}
      <Form.TextArea
        onChange={(e) =>
          setReplyContent((e.target as HTMLTextAreaElement).value)
        }
      />
      <Button
        content="Reply"
        labelPosition="left"
        icon="edit"
        primary
        onClick={() => reply(replyContent)}
      />
      <Button
        content="Cancel"
        labelPosition="left"
        icon="cancel"
        primary
        onClick={() => {
          onClose();
          setSubmitError(null);
        }}
      />
    </Form>
  );
};

export default AddComment;
