import axios from "axios";
import envvar from "envvar";
import { NextApiRequest, NextApiResponse } from "next";
import { prettyPrintError } from "../../utils/index";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { email } = req.body;

  const url = `https://emailoctopus.com/api/1.5/lists/${envvar.string(
    "EMAIL_OCTOPUS_LIST_ID"
  )}/contacts`;

  try {
    const eo_res = await axios.post(url, {
      api_key: envvar.string("EMAIL_OCTOPUS_API_KEY"),
      email_address: email,
    });
    return res.status(200).json({ message: "submitted" });
  } catch (error) {
    prettyPrintError(error.response);
    return res.status(500).json({
      error,
    });
  }
};
