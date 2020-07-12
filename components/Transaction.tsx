import _ from "lodash";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { Button, Divider, Feed, Form } from "semantic-ui-react";
import { axios } from "../common/axios";
import { svgs } from "../common/imagery";
import CommentThread from "./CommentThread";
import SignUpModal from "./EmailSignUpModal";

interface TransactionProps {
  transaction: UserTransaction;
  currentUID: string;
  commenting: boolean;
  emailPopup: boolean;
  postDelete: () => void;
}

const renderComments = (
  comments: Array<TransactionComment>,
  currentUID: string,
  emailPopup: boolean
) => {
  if (comments.length > 0) {
    return _(comments)
      .sortBy(["dateTime"])
      .reverse()
      .map((comment: TransactionComment) => (
        <CommentThread
          key={comment.id}
          meta={comment}
          currentUID={currentUID}
          emailPopup={emailPopup}
        />
      ))
      .value();
  }
};

const Transaction: React.FC<TransactionProps> = ({
  transaction,
  currentUID,
  commenting,
  emailPopup,
  postDelete,
}) => {
  //TODO: reconcile _id and id
  const { id, uid, date, description, amount, category } = transaction;
  const [comments, setComments] = useState([]);

  const fetchComments = async () => {
    try {
      const res = await axios.get("/api/transactions/comments", {
        params: {
          transactionId: id,
        },
        headers: { "Cache-Control": "no-cache" },
      });
      setComments(res.data.comments);
    } catch (err) {
      console.error("Oh no, no comments");
    }
  };

  useEffect(() => {
    // will run on first render, like componentDidMount
    if (commenting) fetchComments();
  }, []);

  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [showComments, setShowComments] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const reply = async (text: string, uid: string) => {
    try {
      const res = await axios.post("/api/transactions/comment", {
        comment: {
          dateTime: moment(),
          text,
          uid,
          transactionId: id,
        },
      });
      setShowReply(false);
      setReplyContent("");
      setShowComments(true);
      if (emailPopup) setShowModal(true);
      fetchComments();
    } catch {
      console.log("Error on comment children");
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await axios.post("/api/transactions/delete", { id });
      postDelete();
    } catch (err) {
      console.error(err);
    }
  };

  //TODO: store display names with uids in a table on postgres

  return (
    <Feed.Event>
      <SignUpModal open={showModal} setOpen={setShowModal} />

      <Feed.Label>
        <div dangerouslySetInnerHTML={{ __html: svgs[category] }}></div>
      </Feed.Label>
      <Feed.Content>
        <Feed.Summary>
          <a href="https://twitter.com/anderjaska1">Michael</a>
          {` spent \$${amount ? amount.toFixed(2) : "Error"} on ${description}`}
          <Feed.Date>{moment(date).format("MM/DD")}</Feed.Date>
        </Feed.Summary>
        <Feed.Extra text>{`${category}`}</Feed.Extra>
        {commenting && (
          <Feed.Meta
            className="comment-meta"
            onClick={() => setShowComments(!showComments)}
          >
            {showComments ? <a> [ - ] </a> : <a> [ + ] </a>}
          </Feed.Meta>
        )}
        {commenting && (
          <Feed.Meta
            className="comment-meta"
            onClick={() => {
              setShowReply(!showReply);
            }}
          >
            <a> Leave a Comment</a>
          </Feed.Meta>
        )}
        {currentUID !== "" && currentUID === uid && id && (
          // TODO: is this secure?

          <Feed.Meta
            className="comment-meta"
            onClick={() => {
              deleteTransaction(id);
            }}
          >
            <a> Delete</a>
          </Feed.Meta>
        )}
        {showReply && (
          <Form style={{ marginTop: "1vh" }} reply>
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
              onClick={() => reply(replyContent, currentUID)}
            />
            <Button
              content="Cancel"
              labelPosition="left"
              icon="cancel"
              primary
              onClick={() => setShowReply(!showReply)}
            />
          </Form>
        )}
        {showComments &&
          commenting &&
          renderComments(comments, currentUID, emailPopup)}
        <Divider />
      </Feed.Content>
    </Feed.Event>
  );
};

export default Transaction;
