import React, { useState } from "react";
import { Button, Form } from "semantic-ui-react";

interface SetHandleProps {
  user: firebase.User;
  postSubmit: () => void;
}
//TODO: unsure if we need this yet

const SetHandle: React.FC<SetHandleProps> = ({ user, postSubmit }) => {
  const [handle, setHandle] = useState("");

  const changeProfile = async (handle: string) => {
    try {
      await user.updateProfile({
        displayName: handle,
      });
      //TODO: watch for changes on profile somewhere (probably in firebase)
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <Form>
        <Form.Group>
          <Form.Input
            label="Set display name"
            placeholder="display name"
            onChange={(e) => setHandle(e.target.value)}
          />
          <Button onClick={() => changeProfile(handle)} type="submit">
            Submit
          </Button>
        </Form.Group>
      </Form>
    </div>
  );
};

export default SetHandle;
