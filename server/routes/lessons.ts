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
  console.log("🚀 ~ create-payment-intent req.body:", req.body);
  try {
    // Extract details from request body
    const {
      confirmation_token_id,
      amount,
      currency = "usd",
      customer_id,
      setup_future_usage,
    } = req.body;

    // Create a PaymentIntent
    const paymentIntent = await stripeSdk.paymentIntents.create({
      amount,
      currency,
      confirmation_token: confirmation_token_id,
      confirm: true,
      automatic_payment_methods: { enabled: true },
      ...(customer_id && { customer: customer_id }),
      ...(setup_future_usage && { setup_future_usage }),
      return_url: "com.nellis.stripe://stripe-redirect",
    });

    // Send client secret to client
    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: any) {
    console.error("Error creating payment intent:", error);
    res.status(400).json({ error: { message: error.message } });
  }
});

router.post("/create-intent", async (req, res) => {
  const customer_id = "cus_TUmiUmrxCQZ6hr";

  try {
    const {
      confirmation_token_id,
      amount = 1099,
      currency = "usd",
      setup_future_usage,
    } = req.body;

    console.log("🚀 ~ create-intent body:", req.body);

    // Check if confirmation_token_id is actually a payment method ID (starts with pm_)
    const isPaymentMethod = confirmation_token_id?.startsWith("pm_");
    const isConfirmationToken = confirmation_token_id?.startsWith("ctoken_");

    var args: any = {
      amount,
      currency,
      confirm: true,
      customer: customer_id,
      return_url: "com.nellis.stripe://stripe-redirect",
    };

    if (isPaymentMethod) {
      // Check if this is a new payment method that needs to be attached
      const pm = await stripeSdk.paymentMethods.retrieve(confirmation_token_id);

      if (!pm.customer && setup_future_usage) {
        // This is a NEW payment method that needs to be saved
        console.log(
          "🆕 New payment method to be saved:",
          confirmation_token_id
        );

        // Attach it to the customer BEFORE creating the payment intent
        await stripeSdk.paymentMethods.attach(confirmation_token_id, {
          customer: customer_id,
        });
        console.log("✅ Payment method attached to customer");

        args.payment_method = confirmation_token_id;
        args.setup_future_usage = setup_future_usage;
      } else if (pm.customer) {
        // This is an existing saved payment method
        console.log("📌 Using saved payment method:", confirmation_token_id);
        args.payment_method = confirmation_token_id;
        args.off_session = true;
      } else {
        // New payment method but user doesn't want to save it
        console.log(
          "🔓 Using payment method without saving:",
          confirmation_token_id
        );
        args.payment_method = confirmation_token_id;
      }
    } else if (isConfirmationToken) {
      // Using a new payment method with confirmation token
      console.log(
        "🆕 Using new card with confirmation token:",
        confirmation_token_id
      );
      args.confirmation_token = confirmation_token_id;
      args.automatic_payment_methods = { enabled: true };
      if (setup_future_usage) {
        console.log(
          "💾 Saving card for future use with setup_future_usage:",
          setup_future_usage
        );
        args.setup_future_usage = setup_future_usage;
      } else {
        console.log("⚠️ No setup_future_usage - card will NOT be saved");
      }
    } else {
      throw new Error("Invalid payment method or confirmation token");
    }

    console.log("📋 Final payment intent args:", JSON.stringify(args, null, 2));
    const intent = await stripeSdk.paymentIntents.create(args);
    console.log("✅ Payment intent created successfully:", {
      id: intent.id,
      status: intent.status,
      payment_method: intent.payment_method,
      setup_future_usage: intent.setup_future_usage,
      customer: intent.customer,
    });

    // If this was a new card, we need to ensure the payment method is attached to customer
    // When using confirmation_token with confirm:true, the payment method is created but may not be attached
    if (
      isConfirmationToken &&
      setup_future_usage &&
      intent.payment_method &&
      intent.status === "succeeded"
    ) {
      try {
        const pmId =
          typeof intent.payment_method === "string"
            ? intent.payment_method
            : intent.payment_method.id;

        // Check if payment method is already attached to customer
        const pm = await stripeSdk.paymentMethods.retrieve(pmId);
        console.log("💳 Payment method details:", {
          id: pm.id,
          customer: pm.customer,
          attached: !!pm.customer,
        });

        if (!pm.customer) {
          console.log("🔗 Attaching payment method to customer:", pmId);
          await stripeSdk.paymentMethods.attach(pmId, {
            customer: customer_id,
          });
          console.log("✅ Payment method attached to customer successfully");
        } else {
          console.log("✅ Payment method already attached to customer");
        }
      } catch (attachError: any) {
        console.error(
          "⚠️ Warning: Failed to attach payment method:",
          attachError.message
        );
        // Don't fail the whole request if attachment fails
      }
    }

    res.json({
      client_secret: intent.client_secret,
      clientSecret: intent.client_secret,
    });
  } catch (err: any) {
    console.error("❌ Error creating intent:", err.message);
    res.status(err.statusCode || 400).json({ error: err.message });
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

// Debug endpoint - check saved payment methods for a customer
router.get("/debug/payment-methods/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;

    const paymentMethods = await stripeSdk.paymentMethods.list({
      customer: customerId,
      type: "card",
    });

    res.json({
      customer: customerId,
      count: paymentMethods.data.length,
      paymentMethods: paymentMethods.data.map((pm) => ({
        id: pm.id,
        card: pm.card
          ? {
              brand: pm.card.brand,
              last4: pm.card.last4,
              exp_month: pm.card.exp_month,
              exp_year: pm.card.exp_year,
            }
          : null,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching payment methods:", error);
    res.status(400).json({ error: { message: error.message } });
  }
});

// Debug endpoint - check a specific payment method
router.get("/debug/payment-method/:pmId", async (req, res) => {
  try {
    const { pmId } = req.params;

    const paymentMethod = await stripeSdk.paymentMethods.retrieve(pmId);

    res.json({
      id: paymentMethod.id,
      customer: paymentMethod.customer,
      type: paymentMethod.type,
      card: paymentMethod.card
        ? {
            brand: paymentMethod.card.brand,
            last4: paymentMethod.card.last4,
            exp_month: paymentMethod.card.exp_month,
            exp_year: paymentMethod.card.exp_year,
          }
        : null,
    });
  } catch (error: any) {
    console.error("Error fetching payment method:", error);
    res.status(400).json({ error: { message: error.message } });
  }
});

export default router;
