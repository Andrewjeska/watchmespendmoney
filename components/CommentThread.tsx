import _ from "lodash";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { Button, Comment, Form, Loader, Segment } from "semantic-ui-react";
import { axios } from "../common/axios";
import { defaultDisplayName, maxNest } from "../common/constants";
import SignUpModal from "./EmailSignUpModal";

interface CommentThreadProps {
  style?: React.CSSProperties;
  meta: TransactionComment;
  currentUser: UserMeta;
  emailPopup: boolean;
  nest: number;
}

const CommentThread: React.FC<CommentThreadProps> = ({
  style,
  meta,
  currentUser,
  emailPopup,
  nest,
}) => {
  const { id, uid, dateTime, text, transactionId, parentId } = meta;

  const [commentChildren, setCommentChildren] = useState([]);

  const fetchChildren = async () => {
    try {
      const res = await axios.get("/api/transactions/comments", {
        params: {
          parentId: id,
        },
      });

      if (res.data.comments.length) setCommentChildren(res.data.comments);
    } catch {
      console.log("Error on comment children");
    }
  };

  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [showModal, setShowModal] = useState(false);

  const reply = async (text: string, uid: string | null) => {
    try {
      const res = await axios.post("/api/transactions/comments/reply", {
        comment: {
          dateTime: moment(),
          text,
          uid,
          parentId: id,
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

  const [displayName, setDisplayName] = useState(uid ? "" : defaultDisplayName);

  useEffect(() => {
    // will run on first render, like componentDidMount
    fetchChildren();

    if (uid) {
      axios
        .get("/api/users", {
          params: { uid },
        })
        .then((res) => {
          const user = res.data.user;
          if (user.displayName) setDisplayName(user.displayName);
          else console.error(`displayName wasn't available for uid ${uid}`);
        });
    }
  }, []);

  const [showComment, setShowComment] = useState(true);

  if (displayName === "") return <Loader></Loader>;

  return (
    <Segment style={style} className="wmsm-comment-segment">
      <SignUpModal open={showModal} setOpen={setShowModal} />
      <Comment.Group className="wmsm-comment-group">
        <Comment className="wmsm-comment">
          <Comment.Content className="wmsm-comment-content">
            <Comment.Author as="a">{displayName}</Comment.Author>
            <Comment.Metadata>
              <div>{moment(dateTime).format("MM/DD/YY h:mm a")}</div>
            </Comment.Metadata>
            {showComment && <Comment.Text>{text}</Comment.Text>}

            <Comment.Actions>
              <Comment.Action onClick={() => setShowComment(!showComment)}>
                {showComment ? <p> [ - ] </p> : <p> [ + ] </p>}
              </Comment.Action>

              {nest < maxNest && showComment && (
                <Comment.Action onClick={() => setShowReply(!showReply)}>
                  Reply
                </Comment.Action>
              )}
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
                  onClick={() => reply(replyContent, currentUser.uid)}
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
          {renderChildren(
            commentChildren,
            currentUser,
            emailPopup,
            nest,
            showComment
          )}
        </Comment>
      </Comment.Group>
    </Segment>
  );
};

const renderChildren = (
  children: Array<TransactionComment>,
  currentUser: UserMeta,
  emailPopup: boolean,
  nest: number,
  showComment: boolean
) => {
  return _.map(children, (child: TransactionComment) => (
    <CommentThread
      style={!showComment ? { display: "none" } : {}}
      key={child.id}
      meta={child}
      currentUser={currentUser}
      emailPopup={emailPopup}
      nest={nest + 1}
    />
  ));
};

export default CommentThread;
