import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getUserIdFromRequest, getPlanFromRequest } from "../../../../lib/auth";
import { findUserById } from "../../../../lib/userHelpers";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-06-20" as any,
});

export async function POST(req: Request) {
  try {
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: "Stripe integration is missing credentials. Set STRIPE_SECRET_KEY in server .env." },
        { status: 500 }
      );
    }

    const { planName = "pro" } = await req.json();

    if (planName.toLowerCase() !== "pro") {
      return NextResponse.json(
        { error: "Payments are only configured for the Pro Tier subscription." },
        { status: 400 }
      );
    }

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const userId = getUserIdFromRequest(req);

    // Look up user for email (to pre-fill Stripe checkout form)
    let customerEmail: string | undefined;
    try {
      const user = await findUserById(userId);
      customerEmail = user?.email;
    } catch {
      // Non-fatal — checkout still works without pre-filled email
    }

    // Create Stripe checkout session with userId in metadata for webhook lookup
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: customerEmail,
      metadata: {
        userId, // Critical: used by webhook to upgrade the correct user
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "DocSense Pro Subscription",
              description: "Unlimited PDF indexing, 128K context search, <150ms vector retrieval, page & source citations.",
            },
            unit_amount: 1200, // $12.00 USD
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/dashboard?checkout_status=success`,
      cancel_url: `${origin}/dashboard/settings?checkout_status=cancel`,
    });

    return NextResponse.json({ id: session.id, url: session.url });
  } catch (error: any) {
    console.error("Stripe Session Creation Failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

