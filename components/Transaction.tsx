import _ from "lodash";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { Button, Divider, Feed, Form, Loader } from "semantic-ui-react";
import { axios } from "../common/axios";
import { auth } from "../common/firebase";
import { svgs } from "../common/imagery";
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
  const [comments, setComments] = useState([]);

  const fetchComments = async () => {
    try {
      const res = await axios.get("/api/transactions/comments", {
        params: {
          transactionId: id,
          parentId: null,
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
  const [replyContent, setReplyContent] = useState("");
  const [showComments, setShowComments] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [commentError, setCommentError] = useState(null as null | string);

  const reply = async (text: string, uid: string | null) => {
    try {
      const res = await axios.post("/api/transactions/comment", {
        dateTime: moment().toISOString(),
        text,
        uid: uid, // might default because it's null?
        transactionId: id,
      });
      setCommentError(null);
      setShowReply(false);
      setReplyContent("");
      setShowComments(true);
      if (emailPopup) setShowModal(true);
      fetchComments();
    } catch (err) {
      console.error(err);
      if (err.response.data.errors) {
        const validationErrors = err.response.data.errors;
        const errorMsgs = _.reduce(
          validationErrors,
          (acc, err) => {
            return `${acc}${err}\n`;
          },
          ""
        );
        setCommentError(errorMsgs);
      }
    }
  };

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
          <Form style={{ marginTop: "1vh" }} reply>
            {commentError && (
              <p
                style={{ color: "red" }}
                dangerouslySetInnerHTML={{ __html: commentError }}
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
              onClick={() => reply(replyContent, currentUser.uid)}
            />
            <Button
              content="Cancel"
              labelPosition="left"
              icon="cancel"
              primary
              onClick={() => {
                setShowReply(!showReply);
                setCommentError(null);
              }}
            />
          </Form>
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
    .sortBy(["dateTime"])
    .reverse()
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
