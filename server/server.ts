import "./env.js";
import { resolve } from "path";
import cors from "cors";
import { existsSync } from "fs";
import { Request, Response, NextFunction } from "express";
import stripeRouter from "./routes/stripe.js";

// Express
import express, { json } from "express";
import { stripeSdk } from "./clients/stripe";

const app = express();

if (!process.env.STATIC_DIR) throw Error("STATIC_DIR not set");
app.use(express.static(process.env.STATIC_DIR));

app.use(cors({ origin: true }));
app.use(json()); // Parse JSON request bodies

const PORT = process.env.PORT || 4242

app.use(stripeRouter);

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

app.listen(PORT, () =>
  console.log(`Node server listening on port http://localhost:${PORT}`)
);
