import _ from "lodash";
import moment from "moment";
import React, { useState } from "react";
import { Divider, Feed } from "semantic-ui-react";
import { authenticatedRequest } from "../common/axios";
import { auth } from "../common/firebase";
import AddComment from "./AddComment";
import CommentThread from "./CommentThread";
import SignUpModal from "./EmailSignUpModal";

interface TransactionProps {
  transaction: UserTransaction;
  currentUser: UserMeta;
  commenting: boolean;
  emailPopup: boolean;
  postDelete: () => void;
}

const Transaction: React.FC<TransactionProps> = ({
  transaction,
  currentUser,
  commenting,
  emailPopup,
  postDelete,
}) => {
  const {
    id,
    uid,
    displayName,
    date,
    description,
    amount,
    category,
    comments,
  } = transaction;
  const [currentComments, setCurrentComments] = useState(comments);

  const [showReply, setShowReply] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const deleteTransaction = async (id: string) => {
    try {
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        await authenticatedRequest(
          firebaseUser,
          "post",
          "/api/transactions/delete",
          { data: { id } }
        );
        postDelete();
      } else {
        // not great if this happens, but it will resolve
        console.error("firebase.auth() not ready");
      }
    } catch (err) {
      alert(err);
      console.error(err);
    }
  };

  return (
    <Feed.Event>
      <SignUpModal open={showModal} setOpen={setShowModal} />

      {/* <Feed.Label>
        <div dangerouslySetInnerHTML={{ __html: svgs[category] }}></div>
      </Feed.Label> */}
      <Feed.Content>
        <Feed.Summary>
          <Feed.User>{displayName} </Feed.User>
          {` spent \$${amount ? amount.toFixed(2) : "Error"} on ${description}`}
          {/* moment is a bit weird about rendering midnight */}
          <Feed.Date>{moment(date).format("MM/DD")}</Feed.Date>
        </Feed.Summary>
        <Feed.Extra text>{`${category}`}</Feed.Extra>
        {commenting && (
          <Feed.Meta
            className="wmsm-comment-meta"
            onClick={() => setShowComments(!showComments)}
          >
            {showComments ? <a> [ - ] </a> : <a> [ + ] </a>}
          </Feed.Meta>
        )}
        {commenting && (
          <Feed.Meta
            className="wmsm-comment-meta"
            onClick={() => {
              setShowReply(!showReply);
            }}
          >
            <a> Leave a Comment</a>
          </Feed.Meta>
        )}
        {currentUser.uid && currentUser.uid === uid && (
          // {/* // TODO: is this secure? */}
          <Feed.Meta
            className="wmsm-comment-meta"
            onClick={() => {
              deleteTransaction(id);
            }}
          >
            <a> Delete</a>
          </Feed.Meta>
        )}
        {showReply && (
          <AddComment
            uid={currentUser.uid}
            transactionId={id}
            postSubmit={(newComment: TransactionComment) => {
              setShowReply(false);
              setShowComments(true);
              if (emailPopup) setShowModal(true);
              setCurrentComments(_.concat(currentComments, newComment));
            }}
            onClose={() => setShowReply(false)}
          ></AddComment>
        )}
        {commenting &&
          renderComments(
            currentComments,
            currentUser,
            emailPopup,
            showComments
          )}
        <Divider />
      </Feed.Content>
    </Feed.Event>
  );
};

const renderComments = (
  comments: Array<TransactionComment>,
  currentUser: UserMeta,
  emailPopup: boolean,
  showComments: boolean
) => {
  return _(comments)
    .orderBy(["dateTime"], ["desc"])
    .map((comment: TransactionComment) => (
      <CommentThread
        style={!showComments ? { display: "none" } : {}}
        key={comment.id}
        meta={comment}
        currentUser={currentUser}
        emailPopup={emailPopup}
        nest={0}
      />
    ))
    .value();
};

export default Transaction;
