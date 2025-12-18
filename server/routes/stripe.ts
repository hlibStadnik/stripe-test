import { Router } from "express";
import { stripeSdk } from "../clients/stripe";

const router = Router();
const customer_id = "cus_TUmiUmrxCQZ6hr"; //stripe customer ID

router.post("/create-intent", async (req, res) => {
  try {
    const {
      paymentMethodId,
      amount,
      currency = "usd",
      setup_future_usage,
      storeCreditApplied = 0,
      total = 0,
    } = req.body;
    console.log("🚀 ~ req.body:", req.body);

    // If amount is 0 after store credit, complete the order without Stripe
    if (total === storeCreditApplied) {
      console.log("💰 Order fully paid with store credit");

      // Deduct store credit

      return res.json({
        success: true,
        paidWithStoreCredit: true,
        amount: 0,
        storeCreditUsed: storeCreditApplied,
      });
    }

    var args: any = {
      amount,
      currency,
      confirm: true,
      customer: customer_id,
      return_url: "com.nellis.stripe://stripe-redirect",
      payment_method: paymentMethodId,
      setup_future_usage,
      // Add metadata and description for clarity
      description:
        "Payment for order XYZ, used store credit: " + storeCreditApplied,
      metadata: {
        store_credit_applied: storeCreditApplied.toString(),
        total: total.toString(),
      },
    };

    const intent = await stripeSdk.paymentIntents.create(args);
    console.log("🚀 ~ intent:", intent);

    const resResult = {
      clientSecret: intent.client_secret,
    };

    res.json(resResult);
  } catch (err: any) {
    console.error("❌ Error creating intent:", err.message);
    res.status(err.statusCode || 400).json({ error: err.message });
  }
});

router.post("/payment-sheet", async (req, res) => {
  try {
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
      paymentIntent: customerSession.client_secret,
      customer: customer_id,
    });
  } catch (error: any) {
    res.status(400).json({ error: { message: error.message } });
  }
});

router.post("/payment-intent-for-payment-sheet", async (req, res) => {
  console.log("payment-intent-for-payment-sheet");
  console.log(req.body);

  try {
    const paymentIntent = await stripeSdk.paymentIntents.create({
      amount: req.body.amount,
      currency: "usd",
      // payment_method: req.body.paymentMethodId,
      customer: customer_id,
      // payment_method_options: req.body.paymentMethodOptions,
      metadata: {
        store_credit_applied: req.body.storeCreditApplied,
      },
      automatic_payment_methods: { enabled: true },
    });

    return res.send({ clientSecret: paymentIntent.client_secret });
  } catch (e) {
    return res.send({ error: e });
  }
});

export default router;
