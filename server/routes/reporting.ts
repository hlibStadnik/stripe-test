import { Router, Request, Response } from "express";
import { FailedPayment, Nullable } from "../types";
import { Stripe, stripeSdk } from "../clients/stripe";

const router = Router();

router.get("/calculate-lesson-total", async (req: Request, res: Response) => {
  try {
    const timestamp = Math.floor(Date.now() / 1000) - 36 * 60 * 60;

    let payment_total = 0;
    let fee_total = 0;

    let hasMore = true;
    let startingAfter: string | undefined = undefined;

    while (hasMore) {
      const charges: Stripe.ApiList<Stripe.Charge> =
        await stripeSdk.charges.list({
          created: { gte: timestamp },
          limit: 100,
          starting_after: startingAfter,
        });

      for (const charge of charges.data) {
        payment_total += charge.amount_captured;

        if (charge.balance_transaction) {
          const balanceTransaction =
            await stripeSdk.balanceTransactions.retrieve(
              charge.balance_transaction as string
            );

          fee_total += balanceTransaction.fee;
        }
      }

      hasMore = charges.has_more;
      if (hasMore && charges.data.length > 0) {
        startingAfter = charges.data[charges.data.length - 1].id;
      }
    }

    res.json({
      payment_total,
      fee_total,
      net_total: payment_total - fee_total,
    });
  } catch (error) {
    console.error("Error calculating lesson total:", error);
    res
      .status(500)
      .json({
        error: error instanceof Error ? error.message : "Unknown error",
      });
  }
});

router.get(
  "/find-customers-with-failed-payments",
  async (req: Request, res: Response) => {
    try {
      const timestamp = Math.floor(Date.now() / 1000) - 36 * 60 * 60;

      const customerLatestPayment = new Map<string, Stripe.PaymentIntent>();

      let hasMore = true;
      let startingAfter: string | undefined = undefined;

      while (hasMore) {
        const paymentIntents: Stripe.ApiList<Stripe.PaymentIntent> =
          await stripeSdk.paymentIntents.list({
            created: { gte: timestamp },
            limit: 100,
            starting_after: startingAfter,
          });

        for (const pi of paymentIntents.data) {
          if (pi.customer) {
            const customerId =
              typeof pi.customer === "string" ? pi.customer : pi.customer.id;
            const existing = customerLatestPayment.get(customerId);

            if (!existing || pi.created > existing.created) {
              customerLatestPayment.set(customerId, pi);
            }
          }
        }

        hasMore = paymentIntents.has_more;
        if (hasMore && paymentIntents.data.length > 0) {
          startingAfter =
            paymentIntents.data[paymentIntents.data.length - 1].id;
        }
      }

      const failedPayments: FailedPayment[] = [];

      for (const [customerId, paymentIntent] of customerLatestPayment) {
        if (paymentIntent.last_payment_error) {
          try {
            const customer = (await stripeSdk.customers.retrieve(
              customerId
            )) as Stripe.Customer;

            if (customer.deleted) {
              continue;
            }

            const declineCode =
              paymentIntent.last_payment_error?.decline_code ||
              paymentIntent.last_payment_error?.code ||
              "generic_decline";
            failedPayments.push({
              customer: {
                id: customer.id,
                email: customer.email || "",
                name: customer.name || "",
              },
              payment_intent: {
                created: paymentIntent.created,
                description: paymentIntent.description || "",
                status: "failed",
                error: declineCode,
              },
              payment_method: {
                last4:
                  paymentIntent.last_payment_error.payment_method?.card
                    ?.last4 || "",
                brand:
                  paymentIntent.last_payment_error.payment_method?.card
                    ?.brand || "",
              },
            });
          } catch (err) {
            console.log(
              `Skipping customer ${customerId}: ${err instanceof Error ? err.message : "Unknown error"}`
            );
            continue;
          }
        }
      }

      res.json(failedPayments);
    } catch (error) {
      console.error("Error finding customers with failed payments:", error);
      res
        .status(500)
        .json({
          error: error instanceof Error ? error.message : "Unknown error",
        });
    }
  }
);

export default router;
