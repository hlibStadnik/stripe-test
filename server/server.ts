import "./env.js";
import { resolve } from "path";
import cors from "cors";
import { existsSync } from "fs";
import { Request, Response, NextFunction } from "express";
import lessonsRouter from "./routes/lessons";
import accountRouter from "./routes/account";
import reportingRouter from "./routes/reporting";

// Express
import express, { json } from "express";
import { stripeSdk } from "./clients/stripe";

const app = express();

if (!process.env.STATIC_DIR) throw Error("STATIC_DIR not set");
app.use(express.static(process.env.STATIC_DIR));

app.use(
  express.json({
    // Should use middleware or a function to compute it only when
    // hitting the Stripe webhook endpoint.
    verify: (req: Request, res: Response, buf: Buffer) => {
      if (req.originalUrl.startsWith("/webhook")) {
        req.body = buf.toString();
        handleHook(req, res);
      }
    },
  })
);
app.use(cors({ origin: true }));

const handleHook = (request: Request, response: Response) => {
  const sig = request.headers["stripe-signature"];
  const body = request.body;

  let event = null;

  try {
    event = stripeSdk.webhooks.constructEvent(
      request.body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    // invalid signature
    response.status(400).end();
    return;
  }

  let intent = null;
  switch (event["type"]) {
    case "setup_intent.succeeded":
      intent = event.data.object;

      break;
    case "setup_intent.setup_failed":
      intent = event.data.object;

      console.log("Failed:", intent.id);
      break;
  }

  // response.sendStatus(200);
};

// const asyncMiddleware = fn => (req, res, next) => {
//   Promise.resolve(fn(req, res, next)).catch(next);
// };

app.use(accountRouter);
app.use(lessonsRouter);
app.use(reportingRouter);

// Routes
app.get("/", (req: Request, res: Response) => {
  try {
    const path = resolve(`${process.env.STATIC_DIR}/index.html`);
    if (existsSync(path)) throw Error();
    res.sendFile(path);
  } catch (error) {
    const path = resolve("./public/static-file-error.html");
    res.sendFile(path);
  }
});

app.get("/config", (req: Request, res: Response) => {
  res.send({
    key: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});

function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  res.status(500).send({ error: { message: err.message, code: err.code } });
}

app.use(errorHandler);

app.listen(4242, () =>
  console.log(`Node server listening on port http://localhost:${4242}`)
);
