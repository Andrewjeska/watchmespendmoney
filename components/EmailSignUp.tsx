import moment from "moment";
import React, { useState } from "react";
import { Button, Form } from "semantic-ui-react";
import { bake_cookie } from "sfcookies";
import { axios } from "../common/axios";

const signUp = async (email: string) => {
  try {
    const res = await axios.post("/api/email", {
      email,
    });

    bake_cookie("signedUp", "true", moment().years(10).toDate());
    alert("Thanks!");
  } catch (err) {
    console.error("Could not submit the email");
    alert(
      "We had an issue, please try again later. If it persists, contact me at michael@anderjaska.com"
    );
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
