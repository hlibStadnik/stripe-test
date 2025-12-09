import { resolve } from "path";
import { existsSync } from "fs";
import { Router, Request, Response } from "express";
import { stripeSdk } from "../clients/stripe";

// Store credit endpoints
// In-memory store credit storage (replace with database in production)
const storeCreditBalances: Record<string, number> = {
  cus_TUmiUmrxCQZ6hr: 5000, // $50.00 in cents
};

const router = Router();

router.post("/create-intent", async (req, res) => {
  const customer_id = "cus_TUmiUmrxCQZ6hr"; //stripe customer ID

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
      if (storeCreditBalances[customer_id]) {
        storeCreditBalances[customer_id] -= storeCreditApplied;
      }

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
    console.log("🚀 ~ args:", args);

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

// Get store credit balance
router.get("/store-credit/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;
    const balance = storeCreditBalances[customerId] || 0;

    res.json({
      customerId,
      balance,
      formatted: `$${(balance / 100).toFixed(2)}`,
    });
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

// For supporting customer-saved payment methods (optional)
router.post("/create-setup-intent", async (req, res) => {
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

router.post("/create-ephemeral-key", async (req: Request, res: Response) => {
  try {
    const { customerId } = req.body;
    console.log("🚀 ~ req.body:", req.body);

    if (!customerId) {
      return res.status(400).json({
        error: { message: "customerId is required" },
      });
    }

    const ephemeralKey = await stripeSdk.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: "2024-11-20.acacia" }
    );

    res.json({
      ephemeralKey: ephemeralKey.secret,
    });
  } catch (error: any) {
    res.status(400).json({ error: { message: error.message } });
  }
});

export default router;
