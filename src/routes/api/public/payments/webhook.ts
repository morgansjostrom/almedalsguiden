import { createFileRoute } from "@tanstack/react-router";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";

// Signature-verified Stripe events keep public.subscriptions current.
// Organizer access is derived from an active subscription (see has_active_subscription).
async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function fields(subscription: any) {
  const item = subscription.items?.data?.[0];
  const priceId = item?.price?.lookup_key || item?.price?.metadata?.lovable_external_id || item?.price?.id;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;
  return {
    product_id: typeof item?.price?.product === "string" ? item.price.product : item?.price?.product?.id ?? "",
    price_id: priceId ?? "",
    status: subscription.status,
    current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: subscription.cancel_at_period_end || false,
    updated_at: new Date().toISOString(),
  };
}

async function handle(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  const sub = event.data.object;
  const db = await admin();
  switch (event.type) {
    case "customer.subscription.created": {
      const userId = sub.metadata?.userId;
      if (!userId) { console.error("No userId in subscription metadata"); return; }
      await db.from("subscriptions").upsert(
        { user_id: userId, stripe_subscription_id: sub.id, stripe_customer_id: sub.customer, environment: env, ...fields(sub) },
        { onConflict: "stripe_subscription_id" },
      );
      break;
    }
    case "customer.subscription.updated":
      await db.from("subscriptions").update(fields(sub)).eq("stripe_subscription_id", sub.id).eq("environment", env);
      break;
    case "customer.subscription.deleted":
      await db.from("subscriptions").update({ status: "canceled", updated_at: new Date().toISOString() }).eq("stripe_subscription_id", sub.id).eq("environment", env);
      break;
    default:
      console.log("Unhandled event:", event.type);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") return Response.json({ received: true, ignored: "invalid env" });
        try {
          await handle(request, rawEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
