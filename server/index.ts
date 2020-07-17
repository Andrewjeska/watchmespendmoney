import cors from "cors";
import express from "express";
import admin from "firebase-admin";
import apiRoutes from "./api";
import webhookRoutes from "./hooks";
const port = parseInt(process.env.PORT || "5000", 10);

const app = express();

// let cache = apicache.middleware;
// app.use(cache("5 minutes"));

const serviceAccount = require("./firebaseAdminPrivKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://watchmespendmoney-d69c1.firebaseio.com",
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.use("/api", apiRoutes);
app.use("/hooks", webhookRoutes);

app.get("/status", (req, res) => {
  res.json({ status: "ok" });
});

// tslint:disable-next-line:no-console
app.listen(port, (err) => {
  if (err) throw err;
  console.log(`> Ready on http://localhost:${port}`);
});
