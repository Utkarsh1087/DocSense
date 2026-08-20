/**
 * /api/stripe/webhook — Stripe webhook handler for billing events.
 * 
 * Handles:
 *   - checkout.session.completed → upgrade user to Pro
 *   - customer.subscription.deleted → downgrade user to Starter
 * 
 * Signature verification requires STRIPE_WEBHOOK_SECRET in .env
 */
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { findUserById, findUserByStripeCustomerId, updateStripeInfo } from "../../../../lib/userHelpers";

export const dynamic = "force-dynamic";

// Disable Next.js body parsing — Stripe needs raw body for signature verification
export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20" as any,
});

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const isProduction = process.env.NODE_ENV === "production";
  if (!webhookSecret && isProduction) {
    console.error("FATAL: STRIPE_WEBHOOK_SECRET is not configured in production.");
    return NextResponse.json({ error: "Webhook signature verification required." }, { status: 500 });
  }


  const rawBody = await req.arrayBuffer();
  const body = Buffer.from(rawBody);
  const sig = req.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else if (!isProduction) {
      // Dev fallback: parse body without verification only in non-production
      event = JSON.parse(body.toString()) as Stripe.Event;
    } else {
      return NextResponse.json({ error: "Missing webhook signature in production." }, { status: 400 });
    }
  } catch (err: any) {
    console.error("Stripe webhook signature verification failed:", err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }


  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const customerId = session.customer as string;

        if (!userId) {
          console.error("Webhook: No userId in checkout session metadata");
          break;
        }

        // Verify user exists
        const user = await findUserById(userId);
        if (!user) {
          console.error(`Webhook: User not found for id: ${userId}`);
          break;
        }

        // Upgrade to Pro and store Stripe IDs
        await updateStripeInfo(userId, {
          plan: "Pro",
          stripeCustomerId: customerId,
          stripeSubscriptionId: session.subscription as string,
        });

        console.log(`✅ Webhook: Upgraded user ${userId} to Pro (customer: ${customerId})`);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const status = sub.status;

        // If subscription becomes past_due or unpaid, keep Pro but log it
        if (status === "active") {
          const user = await findUserByStripeCustomerId(customerId);
          if (user) {
            await updateStripeInfo(user.id, { plan: "Pro" });
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        const user = await findUserByStripeCustomerId(customerId);
        if (user) {
          await updateStripeInfo(user.id, {
            plan: "Starter",
            stripeSubscriptionId: undefined,
          });
          console.log(`⬇️ Webhook: Downgraded user ${user.id} to Starter (subscription cancelled)`);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        console.warn(`⚠️ Webhook: Payment failed for customer ${customerId}`);
        // Could send email here — for now just log
        break;
      }

      default:
        // Unhandled event type — ignore silently
        break;
    }
  } catch (err: any) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Webhook handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
