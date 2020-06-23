import React, { useState } from "react";
import MailchimpSubscribe, { EmailFormFields } from "react-mailchimp-subscribe";
import { Button, Form } from "semantic-ui-react";

const url =
  "https://watchmespendmoney.us10.list-manage.com/subscribe/post?u=6e1744dabb23f9a55f6fb87b8&amp;id=fdede097e8";

const SignUp: React.FC = () => {
  return (
    <MailchimpSubscribe
      url={url}
      render={({ subscribe, status, message }) => (
        <SemanticForm onSubmit={subscribe} status={status} />
      )}
    />
  );
};

interface SemFormProps {
  onSubmit: (data: EmailFormFields) => void;
  status: "success" | "error" | "sending" | null;
}

const SemanticForm: React.FC<SemFormProps> = ({ onSubmit, status }) => {
  const [email, setEmail] = useState("");
  return (
    <div>
      <Form>
        <Form.Group inline>
          {status === "success" && (
            <span style={{ marginRight: "1vw" }}>Thanks! </span>
          )}
          <Form.Input
            placeholder="hello@there.com"
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button primary onClick={() => onSubmit({ EMAIL: email })}>
            Interested?
          </Button>
        </Form.Group>
      </Form>
    </div>
  );
};

export default SignUp;
