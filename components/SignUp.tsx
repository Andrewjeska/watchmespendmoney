import axios from "axios";
import React, { useState } from "react";
import { Button, Form } from "semantic-ui-react";

const signUp = async (email: string) => {
  try {
    const res = await axios.post("/api/email", {
      email,
    });
  } catch (err) {
    console.error("Could not submit the email");
  }
};

const SignUp: React.FC = () => {
  const [email, setEmail] = useState("");

  return (
    <Form>
      <Form.Field>
        <input
          onChange={(e) => setEmail(e.target.value)}
          placeholder="hello@there.com"
        />
      </Form.Field>

      <Button primary onClick={() => signUp(email)} type="submit">
        Start saving money
      </Button>
    </Form>
  );
};

export default SignUp;
