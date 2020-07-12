import _ from "lodash";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { Button, Comment, Form, Segment } from "semantic-ui-react";
import { axios } from "../common/axios";
import SignUpModal from "./EmailSignUpModal";

interface CommentThreadProps {
  meta: TransactionComment;
  currentUID: string;
  emailPopup: boolean;
}

const CommentThread: React.FC<CommentThreadProps> = ({
  meta,
  currentUID,
  emailPopup,
}) => {
  const [commentChildren, setCommentChildren] = useState([]);

  const fetchChildren = async () => {
    try {
      const res = await axios.get("/api/transactions/comments", {
        params: {
          parentId: meta.id,
        },
      });
      if (res.data.comments) setCommentChildren(res.data.comments);
    } catch {
      console.log("Error on comment children");
    }
  };

  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [showModal, setShowModal] = useState(false);

  const reply = async (text: string, uid: string) => {
    try {
      const res = await axios.post("/api/transactions/comments/reply", {
        comment: {
          dateTime: moment(),
          text,
          uid,
          parentId: meta.id,
        },
      });
      setShowReply(false);
      setReplyContent("");
      if (emailPopup) setShowModal(true);
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
      <SignUpModal open={showModal} setOpen={setShowModal} />
      <Comment.Group>
        <Comment>
          <Comment.Content>
            {showComment && (
              <div>
                {/* {meta.user && meta.user !== "Anon" ? (
                  <Comment.Author as="a" href={meta.profile}>
                    {meta.user}
                  </Comment.Author>
                ) : ( */}

                {/* TODO:  handle getting the display name right */}
                <Comment.Author as="a">Anon</Comment.Author>
                {/* )} */}
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
          </Comment.Content>
          {showComment &&
            renderChildren(commentChildren, currentUID, emailPopup)}
        </Comment>
      </Comment.Group>
    </Segment>
  );
};

const renderChildren = (
  children: Array<TransactionComment>,
  currentUID: string,
  emailPopup: boolean
) => {
  if (children.length > 0) {
    return _.map(children, (child: TransactionComment) => (
      <CommentThread
        key={child.id}
        meta={child}
        currentUID={currentUID}
        emailPopup={emailPopup}
      />
    ));
  }
};

export default CommentThread;
