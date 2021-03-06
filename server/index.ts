import cors from "cors";
import express from "express";
import admin from "firebase-admin";
import apiRoutes from "./api";
import webhookRoutes from "./hooks";

const port = parseInt(process.env.PORT || "5000", 10);

const app = express();

//
// app.use(cache("5 minutes"));

const serviceAccount =
  process.env.NODE_ENV === "production"
    ? JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT as string)
    : require("./firebaseAdminPrivKey.json");

// const serviceAccount = Buffer.from(envvar.string("FIREBASE_SERVICE_ACCOUNT"), "base64").toString('ascii')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://watchmespendmoney-d69c1.firebaseio.com",
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// max 20 requests per minute

// app.use(apiRateLimiter);

app.set("trust proxy", 1);

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
