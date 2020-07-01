import axios from "axios";
import _ from "lodash";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { Button, Comment, Form, Segment } from "semantic-ui-react";
import { auth } from "../utils/firebase";

interface CommentThreadProps {
  meta: TransactionComment;
}

const CommentThread: React.FC<CommentThreadProps> = ({ meta }) => {
  const [commentChildren, setCommentChildren] = useState([]);

  const fetchChildren = async () => {
    try {
      const res = await axios.get("/api/transactions/comments", {
        params: {
          parentId: meta._id,
        },
      });
      if (res.data.comments) setCommentChildren(res.data.comments);
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

  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState("");

  const reply = async (text: string, handle = "Anon") => {
    try {
      const res = await axios.post("/api/transactions/comment_reply", {
        comment: {
          dateTime: moment(),
          text,
          user: handle,
          parentId: meta._id,
        },
      });
      setShowReply(false);
      setReplyContent("");
      fetchChildren();
    } catch {
      console.log("Error on comment children");
    }
  };

  useEffect(() => {
    // will run on first render, like componentDidMount
    fetchChildren();
  }, []);

  const [showComment, setShowComment] = useState(true);

  return (
    <Segment className="comment-segment">
      <Comment.Group>
        <Comment>
          <Comment.Content>
            {showComment && (
              <div>
                {meta.user ? (
                  <a href={meta.profile}>{meta.user}</a>
                ) : (
                  <Comment.Author as="a">Anon</Comment.Author>
                )}
                <Comment.Metadata>
                  <div>{moment(meta.dateTime).format("MM/DD/YY h:mm a")}</div>
                </Comment.Metadata>
                <Comment.Text>{meta.text}</Comment.Text>
              </div>
            )}

            <Comment.Actions>
              <Comment.Action
                // className="comment-meta"
                onClick={() => setShowComment(!showComment)}
              >
                {showComment ? <p> [ - ] </p> : <p> [ + ] </p>}
              </Comment.Action>
              <Comment.Action onClick={() => setShowReply(!showReply)}>
                Reply
              </Comment.Action>
            </Comment.Actions>
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
          </Comment.Content>
          {showComment && renderChildren(commentChildren)}
        </Comment>
      </Comment.Group>
    </Segment>
  );
};

const renderChildren = (children: Array<TransactionComment>) => {
  if (children.length > 0) {
    return _.map(children, (child: TransactionComment) => (
      <CommentThread key={child._id} meta={child} />
    ));
  }
};

export default CommentThread;
