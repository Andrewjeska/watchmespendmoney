import cors from "cors";
import express from "express";
import apiRoutes from "./api";
const port = parseInt(process.env.PORT || "5000", 10);

const app = express();

// let cache = apicache.middleware;
// app.use(cache("5 minutes"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.use("/api", apiRoutes);

app.get("/status", (req, res) => {
  res.json({ status: "ok" });
});

// tslint:disable-next-line:no-console
app.listen(port, (err) => {
  if (err) throw err;
  console.log(`> Ready on http://localhost:${port}`);
});
