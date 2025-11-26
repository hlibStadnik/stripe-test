import { resolve } from "path";
import { existsSync } from "fs";
import { Router, Request, Response } from "express";
import { stripeSdk } from "../clients/stripe";

const router = Router();
interface User {
  name: string;
  email: string;
}

router.get("/lessons", (req: Request, res: Response) => {
  try {
    const path = resolve(`${process.env.STATIC_DIR}/lessons.html`);
    if (!existsSync(path)) throw Error();
    res.sendFile(path);
  } catch (error) {
    const path = resolve("./public/static-file-error.html");
    res.sendFile(path);
  }
});

router.post("/lessons", async (req: Request, res: Response) => {
  try {
    // const name = req.body.name;
    console.log("🚀 ~ req.body:", req.body);
    // const details = req.body.details;
    // const email = req.body.email;
    // let customer_id = "";

    // const users = (await stripeSdk.customers.list()).data;
    // const userInDb = users.find((u) => u.email === email);

    // if (userInDb) {
    //   customer_id = userInDb.id;
    //   return res
    //     .status(409)
    //     .json({ message: "User already exists", user: userInDb });
    // } else {
    //   const newCustomer = await stripeSdk.customers.create({
    //     name: name,
    //     email: email,
    //     metadata: {
    //       first_lesson: details,
    //     },
    //   });
    //   customer_id = newCustomer.id;
    // }

    const intent = await stripeSdk.paymentIntents.create({
      confirmation_token: req.body.confirmation_token_id,
      amount: req.body.amount,
      currency: "usd",
      // payment_method_types: ['auto'],
      // {
      // confirm: true,
      automatic_payment_methods: { enabled: true },
      // customer: customer_id,
      // metadata: {
      //   details: details,
      // },
    });

    console.log("Setup Intent created:", intent);

    return res.json({
      client_secret: intent.client_secret,
      // customer_id,
    });
  } catch (error) {
    console.log("🚀 ~ error:", error);
    const path = resolve("./public/static-file-error.html");
    res.sendFile(path);
  }
});

function isScheduleLessonBody(
  body: any
): body is { customer_id: string; amount: number; description: string } {
  return (
    typeof body.customer_id === "string" &&
    typeof body.amount === "number" &&
    typeof body.description === "string"
  );
}

router.post("/schedule-lesson", async (req: Request, res: Response) => {
  if (!isScheduleLessonBody(req.body)) {
    return res.status(400).send({
      error: {
        code: "invalid_body",
        message: "Missing or invalid parameters",
      },
    });
  }
  const { customer_id, amount, description } = req.body;

  const paymentMethods = await stripeSdk.paymentMethods.list({
    customer: customer_id,
    type: "card",
  });

  const paymentMethodId = paymentMethods.data[0]?.id;

  const paymentIntent = await stripeSdk.paymentIntents.create({
    amount,
    currency: "usd",
    customer: customer_id,
    description,
    capture_method: "manual",
    payment_method_types: ["card"],
    confirm: true,
    payment_method: paymentMethodId,
    automatic_payment_methods: { enabled: false },
  });
  return res.status(200).send({ payment: paymentIntent });
});

function isCompleteLessonPaymentBody(
  body: any
): body is { payment_intent_id: string; amount: number } {
  return (
    typeof body.payment_intent_id === "string" &&
    typeof body.amount === "number"
  );
}

router.post("/complete-lesson-payment", async (req: Request, res: Response) => {
  if (!isCompleteLessonPaymentBody(req.body)) {
    console.log("Invalid body for complete lesson payment");
    return res.status(400).send({
      error: {
        code: "invalid_body",
        message: "Missing or invalid parameters",
      },
    });
  }

  const { payment_intent_id, amount } = req.body;

  const paymentIntent = await stripeSdk.paymentIntents.capture(
    payment_intent_id,
    { amount_to_capture: amount }
  );
  return res.status(200).send({ payment: paymentIntent });
});

function isRefundLessonBody(
  body: any
): body is { payment_intent_id: string; amount: number } {
  return (
    typeof body.payment_intent_id === "string" &&
    typeof body.amount === "number"
  );
}

router.post("/refund-lesson", async (req: Request, res: Response) => {
  if (!isRefundLessonBody(req.body)) {
    return res.status(400).send({
      error: {
        code: "invalid_body",
        message: "Missing or invalid parameters",
      },
    });
  }

  const { payment_intent_id, amount } = req.body;

  const refund = await stripeSdk.refunds.create({
    payment_intent: payment_intent_id,
    amount,
  });

  return res.status(200).send({ refund: refund.id });
});

// Create Payment Intent endpoint
router.post("/create-payment-intent", async (req, res) => {
  console.log("🚀 ~ req:", req);
  try {
    // Extract details from request body
    const { amount, currency = "usd" } = req.body;

    // Create a PaymentIntent
    const paymentIntent = await stripeSdk.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
    });

    // Send client secret to client
    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: any) {
    res.status(400).json({ error: { message: error.message } });
  }
});

router.post("/create-intent", async (req, res) => {
  const customer_id = "cus_TUmiUmrxCQZ6hr";

  try {
    var args = {
      amount: 1099,
      currency: "usd",
      // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
      automatic_payment_methods: { enabled: true },
      client: customer_id,
    };
    const intent = await stripeSdk.paymentIntents.create(args);
    res.json({
      client_secret: intent.client_secret,
    });
  } catch (err: any) {
    res.status(err.statusCode).json({ error: err.message });
  }
});

// For supporting customer-saved payment methods (optional)
router.post("/create-setup-intent", async (req, res) => {
  console.log("🚀 ~ req:", req);
  try {
    const { customerId } = req.body;

    // Create a SetupIntent
    const setupIntent = await stripeSdk.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
    });

    res.json({
      clientSecret: setupIntent.client_secret,
    });
  } catch (error: any) {
    res.status(400).json({ error: { message: error.message } });
  }
});

// Split bill functionality
router.post("/create-split-payment", async (req, res) => {
  try {
    const { totalAmount, portions, currency = "usd", metadata = {} } = req.body;

    // Create multiple payment intents for each portion
    const paymentIntents = await Promise.all(
      portions.map(async (amount: any, index: number) => {
        const intent = await stripeSdk.paymentIntents.create({
          amount,
          currency,
          automatic_payment_methods: { enabled: true },
          metadata: {
            ...metadata,
            splitPayment: `portion_${index + 1}_of_${portions.length}`,
            totalBill: totalAmount,
          },
        });

        return {
          portion: index + 1,
          amount,
          clientSecret: intent.client_secret,
          paymentIntentId: intent.id,
        };
      })
    );

    res.json({ paymentIntents });
  } catch (error: any) {
    res.status(400).json({ error: { message: error.message } });
  }
});

// Payment Intent for Payment Sheet (Google Pay / Apple Pay)
router.post("/payment-intent-for-payment-sheet", async (req, res) => {
  try {
    const { amount = 6099, currency = "usd", customerId } = req.body;

    // Create a PaymentIntent with automatic payment methods enabled
    // This supports Google Pay, Apple Pay, and other payment methods
    const paymentIntent = await stripeSdk.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
      ...(customerId && { customer: customerId }),
      metadata: {
        paymentType: "platform_pay",
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error("Error creating payment intent for payment sheet:", error);
    res.status(400).json({ error: { message: error.message } });
  }
});

// Discount codes configuration
const DISCOUNT_CODES: Record<
  string,
  { percentage?: number; fixedAmount?: number; description: string }
> = {
  SAVE10: { percentage: 10, description: "10% off" },
  SAVE20: { percentage: 20, description: "20% off" },
  FLAT500: { fixedAmount: 500, description: "$5.00 off" },
  WELCOME15: { percentage: 15, description: "Welcome discount 15% off" },
  FIRST25: { percentage: 25, description: "First time customer 25% off" },
};

// Apply discount code endpoint
router.post("/apply-discount", async (req, res) => {
  try {
    const { discountCode, originalAmount = 6099 } = req.body;

    if (!discountCode) {
      return res.status(400).json({
        error: { message: "Discount code is required" },
      });
    }

    // Validate discount code (case-insensitive)
    const normalizedCode = discountCode.toUpperCase();
    const discount = DISCOUNT_CODES[normalizedCode];

    if (!discount) {
      return res.status(404).json({
        error: { message: "Invalid discount code" },
        valid: false,
      });
    }

    // Calculate discounted amount
    let discountedAmount = originalAmount;
    let discountAmount = 0;

    if (discount.percentage) {
      discountAmount = Math.round((originalAmount * discount.percentage) / 100);
      discountedAmount = originalAmount - discountAmount;
    } else if (discount.fixedAmount) {
      discountAmount = discount.fixedAmount;
      discountedAmount = Math.max(originalAmount - discount.fixedAmount, 0);
    }

    // Optionally create or retrieve a Stripe promotion code
    // This can be used for tracking purposes
    let promotionCodeId;
    try {
      const coupons = await stripeSdk.coupons.list({ limit: 1 });
      const existingCoupon = coupons.data.find(
        (c) => c.metadata?.code === normalizedCode
      );

      if (!existingCoupon) {
        // Create a new coupon if it doesn't exist
        const coupon = await stripeSdk.coupons.create({
          ...(discount.percentage
            ? { percent_off: discount.percentage }
            : { amount_off: discount.fixedAmount }),
          currency: "usd",
          duration: "once",
          name: normalizedCode,
          metadata: {
            code: normalizedCode,
            description: discount.description,
          },
        });

        // Create promotion code
        const promoCode = await stripeSdk.promotionCodes.create({
          coupon: coupon.id,
          code: normalizedCode,
        });
        promotionCodeId = promoCode.id;
      }
    } catch (stripeError) {
      console.log("Note: Coupon creation skipped or failed", stripeError);
    }

    res.json({
      valid: true,
      discountCode: normalizedCode,
      description: discount.description,
      originalAmount,
      discountAmount,
      discountedAmount,
      percentageOff: discount.percentage,
      fixedAmountOff: discount.fixedAmount,
      ...(promotionCodeId && { promotionCodeId }),
    });
  } catch (error: any) {
    console.error("Error applying discount:", error);
    res.status(400).json({ error: { message: error.message } });
  }
});

// Get available discount codes (optional - for displaying to users)
router.get("/available-discounts", async (req, res) => {
  try {
    const discounts = Object.entries(DISCOUNT_CODES).map(([code, details]) => ({
      code,
      description: details.description,
      type: details.percentage ? "percentage" : "fixed",
      value: details.percentage || details.fixedAmount,
    }));

    res.json({ discounts });
  } catch (error: any) {
    res.status(400).json({ error: { message: error.message } });
  }
});

// Payment Sheet endpoint with CustomerSession for saved payment methods
router.post("/payment-sheet", async (req, res) => {
  try {
    const customer_id = "cus_TUmiUmrxCQZ6hr";
    console.log("🚀 ~ customer_id:", customer_id);
    // Create a CustomerSession with saved payment method features enabled
    const customerSession = await stripeSdk.customerSessions.create({
      customer: customer_id,
      components: {
        mobile_payment_element: {
          enabled: true,
          features: {
            payment_method_save: "enabled",
            payment_method_redisplay: "enabled",
            payment_method_remove: "enabled",
          },
        },
      } as any, // TypeScript workaround for mobile_payment_element
    });

    res.json({
      customerSessionClientSecret: customerSession.client_secret,
      customer: customer_id,
    });
  } catch (error: any) {
    res.status(400).json({ error: { message: error.message } });
  }
});

// Get Stripe config (publishable key)
router.get("/config", async (req, res) => {
  try {
    res.json({
      key: process.env.STRIPE_PUBLISHABLE_KEY || "",
    });
  } catch (error: any) {
    res.status(400).json({ error: { message: error.message } });
  }
});

export default router;
