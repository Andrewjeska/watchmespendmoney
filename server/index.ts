import express from "express";
import next from "next";
import { parse } from "url";

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  //   server.use(bodyParser.json());
  //   server.use(
  //     session({
  //       secret: "super-secret-key",
  //       resave: false,
  //       saveUninitialized: false,
  //       cookie: { maxAge: 60000 },
  //     })
  //   );

  //   server.use("/api", apiRoutes);

  server.get("/:uid", (req, res) => {
    console.log("here");
    const parsedUrl = parse(req.url!, true);
    return app.render(req, res, "/", parsedUrl.query);
  });

  server.all("*", (req, res) => {
    return handle(req, res);
  });

  // tslint:disable-next-line:no-console
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
