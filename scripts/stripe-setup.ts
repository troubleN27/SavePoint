/**
 * Однократная настройка Stripe: товар SavePoint Pro, цены (месяц/год) и вебхук.
 * Повторный запуск безопасен — существующие объекты переиспользуются.
 *
 *   npm run stripe:setup                       — товар и цены
 *   npm run stripe:setup -- --webhook <url>    — плюс вебхук, печатает STRIPE_WEBHOOK_SECRET
 */
import Stripe from "stripe";

const KEY = process.env.STRIPE_SECRET_KEY;
if (!KEY) throw new Error("STRIPE_SECRET_KEY is not set");
const stripe = new Stripe(KEY);

const PRODUCT_NAME = "SavePoint Pro";
const PRICES = [
  { lookup_key: "savepoint_pro_monthly", unit_amount: 499, interval: "month" as const, nickname: "Pro — месяц" },
  { lookup_key: "savepoint_pro_yearly", unit_amount: 3999, interval: "year" as const, nickname: "Pro — год" },
];
const WEBHOOK_EVENTS: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
];

async function main() {
  const mode = KEY!.startsWith("sk_live") ? "LIVE" : "test";
  console.log(`Stripe mode: ${mode}`);

  const existing = await stripe.products.search({ query: `name:"${PRODUCT_NAME}" AND active:"true"` });
  const product =
    existing.data[0] ??
    (await stripe.products.create({
      name: PRODUCT_NAME,
      description: "Безлимитная коллекция, статистика, итог года, AI-рекомендации, полки и публичный профиль",
    }));
  console.log(`product ${product.id}`);

  for (const p of PRICES) {
    const found = await stripe.prices.list({ lookup_keys: [p.lookup_key], active: true, limit: 1 });
    const price =
      found.data[0] ??
      (await stripe.prices.create({
        product: product.id,
        currency: "usd",
        unit_amount: p.unit_amount,
        recurring: { interval: p.interval },
        lookup_key: p.lookup_key,
        nickname: p.nickname,
      }));
    console.log(`price ${p.lookup_key} → ${price.id} (${price.unit_amount! / 100} ${price.currency}/${p.interval})`);
  }

  const i = process.argv.indexOf("--webhook");
  if (i !== -1) {
    const url = process.argv[i + 1];
    if (!url?.startsWith("https://")) throw new Error("--webhook needs an https:// URL");
    const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
    const old = endpoints.data.find((e) => e.url === url);
    // Секрет выдаётся только при создании, поэтому существующий вебхук пересоздаём
    if (old) await stripe.webhookEndpoints.del(old.id);
    const endpoint = await stripe.webhookEndpoints.create({ url, enabled_events: WEBHOOK_EVENTS, description: "SavePoint billing" });
    console.log(`webhook ${endpoint.id} → ${url}`);
    console.log(`STRIPE_WEBHOOK_SECRET=${endpoint.secret}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
