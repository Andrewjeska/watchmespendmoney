import React, { useState } from "react";
import MailchimpSubscribe, { EmailFormFields } from "react-mailchimp-subscribe";
import { Form } from "semantic-ui-react";

const url =
  "https://watchmespendmoney.us10.list-manage.com/subscribe/post?u=6e1744dabb23f9a55f6fb87b8&amp;id=fdede097e8";

const SignUp: React.FC = () => {
  return (
    <MailchimpSubscribe
      url={url}
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
