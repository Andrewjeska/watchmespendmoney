import axios from "axios";
import _ from "lodash";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { Button, Divider, Feed, Form } from "semantic-ui-react";
import { svgs } from "../common/imagery";
import CommentThread from "./CommentThread";
import SignUpModal from "./SignUpModal";

interface TransactionProps {
  transaction: UserTransaction;
  currentUser: UserMeta;
  commenting: boolean;
}

const renderComments = (
  comments: Array<TransactionComment>,
  currentUser: UserMeta
) => {
  if (comments.length > 0) {
    return _(comments)
      .sortBy(["dateTime"])
      .reverse()
      .map((comment: TransactionComment) => (
        <CommentThread
          key={comment._id}
          meta={comment}
          currentUser={currentUser}
        />
      ))
      .value();
  }
};

const Transaction: React.FC<TransactionProps> = ({
  transaction,
  currentUser,
  commenting,
}) => {
  const { amount, date, category, description, id } = transaction;
  const [comments, setComments] = useState([]);

  const fetchComments = async () => {
    try {
      const res = await axios.get("/api/transactions/comments", {
        params: {
          transactionId: id,
        },
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

  const reply = async (text: string, user: UserMeta) => {
    try {
      const res = await axios.post("/api/transactions/comment_reply", {
        comment: {
          dateTime: moment(),
          text,
          user: currentUser.handle,
          profile: currentUser.profile,
          transactionId: id,
        },
      });
      setShowReply(false);
      setReplyContent("");
      setShowComments(true);
      setShowModal(true);
      fetchComments();
    } catch {
      console.log("Error on comment children");
    }
  };

  return (
    <Feed.Event>
      <SignUpModal open={showModal} setOpen={setShowModal} />

      <Feed.Label>
        <div dangerouslySetInnerHTML={{ __html: svgs[category] }}></div>
      </Feed.Label>
      <Feed.Content>
        <Feed.Summary>
          <a href="https://twitter.com/anderjaska1">Michael</a>
          {` spent \$${parseFloat(amount || 0.0).toFixed(2)} at ${description}`}
          <Feed.Date>{moment(date).format("MM/DD")}</Feed.Date>
        </Feed.Summary>
        <Feed.Extra text>{`${category}`}</Feed.Extra>
        {commenting && (
          <Feed.Meta
            className="comment-meta"
            onClick={() => setShowComments(!showComments)}
          >
            {showComments ? <p> [ - ] </p> : <p> [ + ] </p>}
          </Feed.Meta>
        )}
        {commenting && (
          <Feed.Meta
            className="comment-meta"
            onClick={() => {
              setShowReply(!showReply);
            }}
          >
            <p> Leave a Comment</p>
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
              onClick={() => reply(replyContent, currentUser)}
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
        {showComments && commenting && renderComments(comments, currentUser)}
        <Divider />
      </Feed.Content>
    </Feed.Event>
  );
};

export default Transaction;
