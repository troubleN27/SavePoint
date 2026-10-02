"use server";

import Stripe from "stripe";
import { getCurrentUser } from "@/lib/auth";
import { ensureCustomer, isProStatus } from "@/lib/billing";
import { appUrl, isBillingEnabled, portalConfigurationId, priceIdFor, stripe } from "@/lib/stripe";
import { BILLING_INTERVALS, type BillingInterval } from "@/lib/plans";
import type { ActionResult } from "./types";

function billingError(error: unknown): { ok: false; error: string } {
  if (error instanceof Stripe.errors.StripeError) console.error(`[billing] Stripe ${error.type}:`, error.message);
  else console.error("[billing]", error);
  return { ok: false, error: "Не удалось открыть оплату. Попробуй ещё раз чуть позже." };
}

/** Создаёт сессию Stripe Checkout для подписки Pro и возвращает ссылку на оплату. */
export async function startCheckout(interval: BillingInterval): Promise<ActionResult<{ url: string }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, code: "AUTH", error: "Нужно войти" };
  if (!BILLING_INTERVALS.includes(interval)) return { ok: false, code: "VALIDATION", error: "Неверный период" };
  if (!isBillingEnabled()) return { ok: false, error: "Оплата временно недоступна" };

  try {
    const base = await appUrl();
    // Уже есть действующая подписка — отправляем в портал, чтобы не оформить вторую
    if (user.stripeCustomerId && isProStatus(user.subscriptionStatus)) {
      return openBillingPortal();
    }
    const customer = await ensureCustomer(user);
    const session = await stripe().checkout.sessions.create({
      mode: "subscription",
      customer,
      client_reference_id: user.id,
      line_items: [{ price: await priceIdFor(interval), quantity: 1 }],
      subscription_data: { metadata: { userId: user.id } },
      metadata: { userId: user.id },
      allow_promotion_codes: true,
      success_url: `${base}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/settings?checkout=cancelled#plan`,
    });
    if (!session.url) throw new Error("Checkout session has no url");
    return { ok: true, data: { url: session.url } };
  } catch (error) {
    return billingError(error);
  }
}

/** Ссылка на клиентский портал Stripe: смена тарифа, карта, счета, отмена. */
export async function openBillingPortal(): Promise<ActionResult<{ url: string }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, code: "AUTH", error: "Нужно войти" };
  if (!isBillingEnabled() || !user.stripeCustomerId) return { ok: false, error: "Подписка не найдена" };
  try {
    const session = await stripe().billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      configuration: await portalConfigurationId(),
      return_url: `${await appUrl()}/settings#plan`,
    });
    return { ok: true, data: { url: session.url } };
  } catch (error) {
    return billingError(error);
  }
}
