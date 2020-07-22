import envvar from "envvar";
import { NextFunction, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import admin from "firebase-admin";

export const checkAuth = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV !== "production") {
    next();
    return;
  }

  if (req.headers.authtoken) {
    admin
      .auth()
      .verifyIdToken(req.headers.authtoken as string)
      .then((decodedToken) => {
        const tokenUID = decodedToken.uid;
        if (req.query.uid && req.query.uid !== tokenUID)
          res.status(403).send("Unauthorized");
        else if (req.body.uid && req.body.uid !== tokenUID)
          res.status(403).send("Unauthorized");
        else next();
      })
      .catch(() => {
        res.status(403).send("Unauthorized");
      });
  } else {
    res.status(403).send("Unauthorized");
  }
};

export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV !== "production") {
    next();
    return;
  }

  const adminUID = envvar.string("ADMIN_UID");

  if (req.headers.authtoken) {
    admin
      .auth()
      .verifyIdToken(req.headers.authtoken as string)
      .then((decodedToken) => {
        const tokenUID = decodedToken.uid;
        if (tokenUID === adminUID) next();
        else res.status(403).send("Unauthorized");
      })
      .catch(() => {
        res.status(403).send("Unauthorized");
      });
  } else {
    res.status(403).send("Unauthorized");
  }
};

export const textValidator = (key: string, message: string) => {
  return body(key)
    .not()
    .isEmpty()
    .withMessage(message)
    .not()
    .contains("<script>")
    .withMessage("Please don't try to hack me")
    .isLength({ min: 0, max: 1000 })
    .withMessage("Too long, max 1000 characters")
    .trim();
};

export const validateComment = [
  textValidator("text", "Please write something before clicking Reply"),
  body("dateTime").isISO8601().withMessage("Invalid date"),
  body("transactionId").isUUID().withMessage("Invalid transactionId"),
  // body("parentId")
  //   // .if(body("transactionId").exists())
  //   .isUUID()
  //   .withMessage("Invalid transactionId"),
];

export const validateTransaction = [
  body("date").isISO8601().withMessage("Invalid date"),
  body("amount")
    .isCurrency({ allow_negatives: false })
    .isFloat({ min: 0.01, max: 100000 })
    .withMessage("Invalid Amount"),
  textValidator("description", "Please write in a Description"),
  textValidator("category", "Please write in a Category"),

  body("reason")
    .optional({ checkFalsy: true })
    .not()
    .contains("<script>")
    .withMessage("Please don't try to hack me")
    .trim(),
];

export const returnValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors: Array<Record<string, string>> = [];
  errors.array().map((err) => extractedErrors.push({ [err.param]: err.msg }));
  // errors.array().map((err) => extractedErrors.push(err.msg));

  return res.status(422).json({
    errors: extractedErrors,
  });
};
