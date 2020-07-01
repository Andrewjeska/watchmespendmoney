import axios from "axios";
import _ from "lodash";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { Button, Divider, Feed, Form } from "semantic-ui-react";
import { svgs } from "../common/imagery";
import { auth } from "../utils/firebase";
import CommentThread from "./CommentThread";

interface TransactionProps {
  transaction: UserTransaction;
}

const renderComments = (comments: Array<TransactionComment>) => {
  if (comments.length > 0) {
    return _(comments)
      .sortBy(["dateTime"])
      .reverse()
      .map((comment: TransactionComment) => (
        <CommentThread key={comment._id} meta={comment} />
      ))
      .value();
  }
};

const Transaction: React.FC<TransactionProps> = ({ transaction }) => {
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
    fetchComments();
  }, []);

  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [showComments, setShowComments] = useState(true);

  const reply = async (text: string, handle: string) => {
    try {
      const res = await axios.post("/api/transactions/comment_reply", {
        comment: {
          dateTime: moment(),
          text,
          user: handle,
          transactionId: id,
        },
      });
      setShowReply(false);
      setReplyContent("");
      setShowComments(true);
      fetchComments();
    } catch {
      console.log("Error on comment children");
    }
  };

  const [user, setUser] = useState("");

  useEffect(() => {
    // will run on first render, like componentDidMount
    auth.onAuthStateChanged((user) => {
      if (user && user.email) {
        // User is signed in.

        // admin mode
        if (user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL)
          setUser("Michael");
      }
    });
  }, []);

  return (
    <Feed.Event>
      <Feed.Label>
        <div dangerouslySetInnerHTML={{ __html: svgs[category] }}></div>
      </Feed.Label>
      <Feed.Content>
        <Feed.Summary>
          <a href="https://twitter.com/anderjaska1">Michael</a>
          {` spent \$${amount?.toFixed(2)} at ${description}`}
          <Feed.Date>{moment(date).format("MM/DD")}</Feed.Date>
        </Feed.Summary>
        <Feed.Extra text>{`${category}`}</Feed.Extra>
        <Feed.Meta
          className="comment-meta"
          onClick={() => setShowComments(!showComments)}
        >
          {showComments ? <p> [ - ] </p> : <p> [ + ] </p>}
        </Feed.Meta>
        <Feed.Meta
          className="comment-meta"
          onClick={() => setShowReply(!showReply)}
        >
          <p> Leave a Comment</p>
        </Feed.Meta>
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
              onClick={() => reply(replyContent, user)}
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
        {showComments && renderComments(comments)}
        <Divider />
      </Feed.Content>
    </Feed.Event>
  );
};

export default Transaction;
