import "server-only";
import Stripe from "stripe";
import { headers } from "next/headers";
import type { BillingInterval } from "./plans";

/** Ключи цен в Stripe; сами цены создаёт scripts/stripe-setup.ts. */
export const PRICE_LOOKUP_KEYS: Record<BillingInterval, string> = {
  month: "savepoint_pro_monthly",
  year: "savepoint_pro_yearly",
};

export const isBillingEnabled = () => Boolean(process.env.STRIPE_SECRET_KEY);

let client: Stripe | null = null;

export function stripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not set");
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY);
  return client;
}

const priceCache = new Map<BillingInterval, string>();

/** ID цены по lookup key (кэшируется на время жизни функции). */
export async function priceIdFor(interval: BillingInterval): Promise<string> {
  const cached = priceCache.get(interval);
  if (cached) return cached;
  const { data } = await stripe().prices.list({ lookup_keys: [PRICE_LOOKUP_KEYS[interval]], active: true, limit: 1 });
  if (!data[0]) throw new Error(`Stripe price "${PRICE_LOOKUP_KEYS[interval]}" not found. Run: npm run stripe:setup`);
  priceCache.set(interval, data[0].id);
  return data[0].id;
}

/** Конфигурация клиентского портала: берём активную или создаём (смена тарифа, отмена, карты, счета). */
export async function portalConfigurationId(): Promise<string> {
  const { data } = await stripe().billingPortal.configurations.list({ active: true, limit: 1 });
  if (data[0]) return data[0].id;
  const [monthly, yearly] = await Promise.all([priceIdFor("month"), priceIdFor("year")]);
  const price = await stripe().prices.retrieve(monthly);
  const product = typeof price.product === "string" ? price.product : price.product.id;
  const config = await stripe().billingPortal.configurations.create({
    business_profile: { headline: "SavePoint Pro — управление подпиской" },
    features: {
      customer_update: { enabled: true, allowed_updates: ["email", "name"] },
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: { enabled: true, mode: "at_period_end" },
      subscription_update: {
        enabled: true,
        default_allowed_updates: ["price"],
        proration_behavior: "create_prorations",
        products: [{ product, prices: [monthly, yearly] }],
      },
    },
  });
  return config.id;
}

/** Базовый URL сайта для ссылок возврата из Stripe. */
export async function appUrl(): Promise<string> {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
