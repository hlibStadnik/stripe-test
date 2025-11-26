import Stripe from "stripe";

const apiVersion = (process.env.STRIPE_API_VERSION ||
  "2025-07-30.basil") as Stripe.LatestApiVersion;

export const stripeSdk = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion,
});

export * from "stripe";
