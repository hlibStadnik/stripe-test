import { resolve } from "path";
import { existsSync } from "fs";
import { Router, Request, Response } from "express";
import { Stripe, stripeSdk } from "../clients/stripe";

const router = Router();

router.get(
  "/account-update/:customer_id",
  async (req: Request, res: Response) => {
    try {
      const path = resolve(`${process.env.STATIC_DIR}/account-update.html`);
      if (!existsSync(path)) throw Error();
      res.sendFile(path);
    } catch (error) {
      const path = resolve("./public/static-file-error.html");
      res.sendFile(path);
    }
  }
);

router.get(
  "/payment-method/:customer_id",
  async (req: Request, res: Response) => {
    const customerId = req.params.customer_id;

    const paymentMethods = await stripeSdk.paymentMethods.list({
      type: "card",
      limit: 1,
      customer: customerId,
    });

    const customer = await stripeSdk.customers.retrieve(customerId);
    res.json({ ...paymentMethods.data[0], customer });
  }
);

function isUpdatePaymentDetailsBody(
  body: any
): body is { email: string; name: string } {
  return typeof body.email === "string" && typeof body.name === "string";
}

router.post(
  "/update-payment-details/:customer_id",
  async (req: Request, res: Response) => {
    if (!isUpdatePaymentDetailsBody(req.body)) {
      return res.status(400).send({
        error: {
          code: "invalid_body",
          message: "Missing or invalid parameters",
        },
      });
    }

    const customerId = req.params.customer_id;
    const { name, email } = req.body;

    const existingCustomer = await stripeSdk.customers.search({
      query: `email:'${email}'`,
      limit: 1,
    });

    if (
      existingCustomer?.data?.length &&
      existingCustomer.data[0]?.id !== customerId
    ) {
      return res.status(400).send({
        error: {
          code: "email_exists",
          message: "Customer email already exists!",
        },
      });
    }

    const user = await stripeSdk.customers.update(customerId, {
      name: name,
      email: email,
    });

    const intent = await stripeSdk.setupIntents.create({
      payment_method_types: ["card"],
      customer: customerId,
    });

    return res.json({
      client_secret: intent.client_secret,
      customerId: user.id,
    });
  }
);

function isAccountUpdateBody(body: any): body is {
  oldName: string;
  oldEmail: string;
  name: string;
  email: string;
  customerId: string;
  paymentMethodId: string;
} {
  return (
    typeof body.oldName === "string" &&
    typeof body.oldEmail === "string" &&
    typeof body.name === "string" &&
    typeof body.email === "string" &&
    typeof body.customerId === "string" &&
    typeof body.paymentMethodId === "string"
  );
}

router.post("/account-update", async (req: Request, res: Response) => {
  if (!isAccountUpdateBody(req.body)) {
    return res.status(400).send({
      error: {
        code: "invalid_body",
        message: "Missing or invalid parameters",
      },
    });
  }

  const { oldName, oldEmail, name, email, customerId, paymentMethodId } =
    req.body;

  const user = await stripeSdk.customers.update(customerId, {
    name: name,
    email: email,
  });

  const sds = await stripeSdk.paymentMethods.detach(paymentMethodId);
});

router.post(
  "/delete-account/:customer_id",
  async (req: Request, res: Response) => {
    const customerId = req.params.customer_id;

    const paymentIntents = await stripeSdk.paymentIntents.list({
      customer: customerId,
      limit: 100,
    });
    const uncapturedPayments = paymentIntents.data.filter(
      (pi) => pi.status === "requires_capture"
    );

    if (uncapturedPayments.length) {
      return res.status(400).json({
        uncaptured_payments: uncapturedPayments.map((pi) => pi.id),
      });
    } else {
      await stripeSdk.customers.del(customerId);
      return res.json({ deleted: true });
    }
  }
);

export default router;
