import type Stripe from "stripe";
import { syncSubscription } from "@/lib/billing";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

const SUBSCRIPTION_EVENTS = new Set<Stripe.Event.Type>([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
]);

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  if (!secret || !signature) return new Response("Webhook not configured", { status: 400 });

  let event: Stripe.Event;
  try {
    // Подпись проверяется по «сырому» телу запроса
    event = stripe().webhooks.constructEvent(await req.text(), signature, secret);
  } catch (error) {
    console.error("[stripe webhook] bad signature", error);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      if (session.mode === "subscription" && session.subscription) {
        await syncSubscription(typeof session.subscription === "string" ? session.subscription : session.subscription.id);
      }
    } else if (SUBSCRIPTION_EVENTS.has(event.type)) {
      await syncSubscription((event.data.object as Stripe.Subscription).id);
    }
  } catch (error) {
    // 500 — Stripe повторит доставку события позже
    console.error(`[stripe webhook] failed to handle ${event.type}`, error);
    return new Response("Handler error", { status: 500 });
  }

  return Response.json({ received: true });
}
