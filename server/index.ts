import cors from "cors";
import express from "express";
import apiRoutes from "./api";
// const port = parseInt(process.env.PORT || "5000", 10);
//TODO figure out how dokku can do this
const port = 5000;
const dev = process.env.NODE_ENV !== "production";

const app = express();

//   app.use(bodyParser.json());
//   app.use(
//     session({
//       secret: "super-secret-key",
//       resave: false,
//       saveUninitialized: false,
//       cookie: { maxAge: 60000 },
//     })
//   );
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use("/api", apiRoutes);

// tslint:disable-next-line:no-console
app.listen(port, (err) => {
  if (err) throw err;
  console.log(`> Ready on http://localhost:${port}`);
});
