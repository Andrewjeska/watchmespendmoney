import axios from "axios";
import envvar from "envvar";
import { Router } from "express";
import plaidAPI from "./plaid";
import { prettyPrintError } from "./utils";

const apiRoutes = Router();

apiRoutes.use("/plaid", plaidAPI);

apiRoutes.post("/email", async (req, res) => {
  const { email } = req.body;

  const url = `https://emailoctopus.com/api/1.5/lists/${envvar.string(
    "EMAIL_OCTOPUS_LIST_ID"
  )}/contacts`;

  try {
    const eo_res = await axios.post(url, {
      api_key: envvar.string("EMAIL_OCTOPUS_API_KEY"),
      email_address: email,
    });
    return res.status(200).json({ message: `submitted ${email}` });
  } catch (error) {
    prettyPrintError(error.response);
    return res.status(500).json({
      error,
    });
  }
});

export default apiRoutes;
