import "server-only";
import Stripe from "stripe";

export { SITE_URL } from "./config";

let client: Stripe | null = null;

/**
 * Lazily creates the Stripe client. Nothing touches Stripe at build time or
 * import time, so the app builds and runs with no Stripe variables set
 * (free beta). Only the paid flow calls this.
 */
export function stripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe is not configured: set STRIPE_SECRET_KEY or turn on NEXT_PUBLIC_FREE_BETA.");
  }
  if (!client) {
    client = new Stripe(process.env.STRIPE_SECRET_KEY, {
      appInfo: { name: "LeavePath", url: "https://leavepath.co.uk" },
    });
  }
  return client;
}
