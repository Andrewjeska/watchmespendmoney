import { Router } from "express";
import plaidAPI from "./plaid";
const apiRoutes = Router();

apiRoutes.use("/plaid", plaidAPI);

export default apiRoutes;
