import _ from "lodash";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { Divider, Feed, Loader } from "semantic-ui-react";
import { axios } from "../common/axios";
import { auth } from "../common/firebase";
import { svgs } from "../common/imagery";
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
  const { id, uid, date, description, amount, category } = transaction;
  const [comments, setComments] = useState([] as Array<TransactionComment>);

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

  //TODO: this will be fixed once plaid transactions are regular transactions, we branch on email popup since that's the landing page

  const [displayName, setDisplayName] = useState(
    emailPopup ? "anderjaska" : ""
  );

  useEffect(() => {
    // will run on first render, like componentDidMount
    if (commenting) fetchComments();
    if (uid) {
      axios
        .get("/api/users", {
          params: { uid },
        })
        .then((res) => {
          const user = res.data.user;
          if (user && user.displayName) setDisplayName(user.displayName);
          else {
            console.error(`displayName wasn't available for uid ${uid}`);
          }
        })
        .catch((err) => {
          alert(err);
        });
    }
  }, []);

  const [showReply, setShowReply] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const deleteTransaction = async (id: string) => {
    try {
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken(true);
        await axios({
          method: "post",
          url: "/api/transactions/delete",
          data: { id },
          headers: { authToken: token },
        });
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

  if (displayName === "") return <Loader></Loader>;
  return (
    <Feed.Event>
      <SignUpModal open={showModal} setOpen={setShowModal} />

      <Feed.Label>
        <div dangerouslySetInnerHTML={{ __html: svgs[category] }}></div>
      </Feed.Label>
      <Feed.Content>
        <Feed.Summary>
          {displayName !== "" && <Feed.User>{displayName} </Feed.User>}
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
              setComments(_.concat(comments, newComment));
            }}
            onClose={() => setShowReply(false)}
          ></AddComment>
        )}
        {commenting &&
          renderComments(comments, currentUser, emailPopup, showComments)}
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
