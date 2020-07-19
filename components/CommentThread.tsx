import _ from "lodash";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { Comment, Loader, Segment } from "semantic-ui-react";
import { axios } from "../common/axios";
import { defaultDisplayName, maxNest } from "../common/constants";
import AddComment from "./AddComment";
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
  const { id, uid, dateTime, text, transactionId, children } = meta;

  const [commentChildren, setCommentChildren] = useState(children);

  // const fetchChildren = async () => {
  //   try {
  //     const res = await axios.get("/api/transactions/comments", {
  //       params: {
  //         parentId: id,
  //       },
  //     });

  //     if (res.data.comments.length) setCommentChildren(res.data.comments);
  //   } catch (err) {
  //     console.error(err);
  //   }
  // };

  const [showReply, setShowReply] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [displayName, setDisplayName] = useState(uid ? "" : defaultDisplayName);

  useEffect(() => {
    // will run on first render, like componentDidMount
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
              <AddComment
                uid={currentUser.uid}
                transactionId={transactionId}
                parentId={id}
                postSubmit={(newComment) => {
                  setShowReply(false);
                  if (emailPopup) setShowModal(true);
                  setCommentChildren(_.concat(commentChildren, newComment));
                }}
                onClose={() => {
                  setShowReply(false);
                }}
              ></AddComment>
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
