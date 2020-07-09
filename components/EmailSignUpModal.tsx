import moment from "moment";
import React from "react";
import { Grid, Modal } from "semantic-ui-react";
import { bake_cookie, read_cookie } from "sfcookies";
import SignUp from "./EmailSignUp";

interface SignUpModalProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const SignUpModal: React.FC<SignUpModalProps> = ({ open, setOpen }) => {
  if (read_cookie("signedUp").length > 0 || read_cookie("admin").length > 0)
    return <div></div>;

  return (
    <Modal
      open={open}
      onClose={() => {
        bake_cookie("signedUp", "true", moment().add("day").toDate());
        setOpen(false);
      }}
    >
      <Modal.Content>
        <h3>Thanks for leaving a comment!</h3>
        <p>
          It means alot to me that you're interested in what I'm doing here.
          It'd mean the world if you could sign up for updates on my beta. I
          will only let you know when the beta is ready. I respect your privacy{" "}
        </p>
        <Grid textAlign="center">
          <Grid.Row>
            <Grid.Column width={10}>
              <SignUp />
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Modal.Content>
    </Modal>
  );
};

export default SignUpModal;
