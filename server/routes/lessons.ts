import { resolve } from "path";
import { existsSync } from "fs";
import { Router, Request, Response } from "express";
import { stripeSdk } from "../clients/stripe";

const router = Router();
interface User {
  name: string;
  email: string;
}

router.post("/create-intent", async (req, res) => {
  const customer_id = "cus_TUmiUmrxCQZ6hr";

  try {
    const {
      confirmation_token_id,
      amount,
      currency = "usd",
      setup_future_usage,
      store_credit_applied = 0,
      isSplittingPayment = false,
      total = 0,
    } = req.body;
    console.log("🚀 ~ req.body:", req.body);

    // If amount is 0 after store credit, complete the order without Stripe
    if (amount === store_credit_applied && !isSplittingPayment) {
      console.log("💰 Order fully paid with store credit");

      // Deduct store credit
      if (storeCreditBalances[customer_id]) {
        storeCreditBalances[customer_id] -= store_credit_applied;
      }

      return res.json({
        success: true,
        paidWithStoreCredit: true,
        amount: 0,
        storeCreditUsed: store_credit_applied,
      });
    }

    // Check if confirmation_token_id is actually a payment method ID (starts with pm_)
    const isPaymentMethod = confirmation_token_id?.startsWith("pm_");
    const isConfirmationToken = confirmation_token_id?.startsWith("ctoken_");

    var args: any = {
      amount,
      currency,
      confirm: true,
      customer: customer_id,
      return_url: "com.nellis.stripe://stripe-redirect",
      description:
        "Payment for order XYZ, used store credit: " + store_credit_applied,
      metadata: {
        store_credit_applied: store_credit_applied.toString(),
        total: total.toString(),
      },
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
    console.log("🚀 ~ intent:", intent);
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

    const resResult = {
      client_secret: intent.client_secret,
      clientSecret: intent.client_secret,
    };
    console.log("🚀 ~ resResult:", resResult);

    res.json(resResult);
  } catch (err: any) {
    console.error("❌ Error creating intent:", err.message);
    res.status(err.statusCode || 400).json({ error: err.message });
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

// Store credit endpoints
// In-memory store credit storage (replace with database in production)
const storeCreditBalances: Record<string, number> = {
  cus_TUmiUmrxCQZ6hr: 5000, // $50.00 in cents
};

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

// Deduct store credit (called after successful payment)
router.post("/store-credit/deduct", async (req, res) => {
  try {
    const { customerId, amount } = req.body;

    if (!storeCreditBalances[customerId]) {
      storeCreditBalances[customerId] = 0;
    }

    if (storeCreditBalances[customerId] < amount) {
      return res.status(400).json({
        error: { message: "Insufficient store credit" },
      });
    }

    storeCreditBalances[customerId] -= amount;

    res.json({
      success: true,
      newBalance: storeCreditBalances[customerId],
      deducted: amount,
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
