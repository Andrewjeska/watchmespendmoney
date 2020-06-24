import React, { useState } from "react";
import MailchimpSubscribe, { EmailFormFields } from "react-mailchimp-subscribe";
import { Form } from "semantic-ui-react";

const url =
  "https://watchmespendmoney.us10.list-manage.com/subscribe/post?u=33597da28b16af5f987e0d21c&amp;id=2663625ea6";

const SignUp: React.FC = () => {
  return (
    <MailchimpSubscribe
      url={process.env.NEXT_PUBLIC_MAILCHIMP_URL || ""}
      render={({ subscribe, status, message }) => (
        <SemanticForm onSubmit={subscribe} status={status} message={message} />
      )}
    />
  );
};

interface SemFormProps {
  onSubmit: (data: EmailFormFields) => void;
  status: "success" | "error" | "sending" | null;
  message: string | null;
}

const SemanticForm: React.FC<SemFormProps> = ({
  onSubmit,
  status,
  message,
}) => {
  const [email, setEmail] = useState("");
  const [alerted, setAlerted] = useState(false);

  if (status === "sending" || !status) {
    if (alerted) setAlerted(false);
  } else {
    if (!alerted) {
      if (status === "success")
        alert(
          "Thanks for subscribing! Once the product is launched you'll be in the know!"
        );
      if (status === "error") alert(message);
      setAlerted(true);
    }
  }

  return (
    <div>
      <Form>
        {/* <Form.Group width="equal"> */}
        <Form.Input
          placeholder="hello@there.com"
          onChange={(e) => setEmail(e.target.value)}
        />
        <Form.Button primary onClick={() => onSubmit({ EMAIL: email })}>
          Save fat stacks now!
        </Form.Button>
        {/* </Form.Group> */}
      </Form>
    </div>
  );
};

export default SignUp;
