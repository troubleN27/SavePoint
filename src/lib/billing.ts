import "server-only";
import type Stripe from "stripe";
import { db } from "./db";
import { stripe } from "./stripe";

/** Статусы подписки, при которых доступ к Pro открыт (past_due — льготный период, пока Stripe повторяет списание). */
const PRO_STATUSES = new Set<Stripe.Subscription.Status>(["active", "trialing", "past_due"]);

export const isProStatus = (status: string | null | undefined) =>
  Boolean(status && PRO_STATUSES.has(status as Stripe.Subscription.Status));

/**
 * Синхронизирует тариф пользователя с подпиской Stripe.
 * Всегда берёт свежее состояние подписки из API, поэтому порядок и повторы вебхуков не важны.
 */
export async function syncSubscription(subscriptionId: string) {
  const sub = await stripe().subscriptions.retrieve(subscriptionId);
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  const user =
    (sub.metadata.userId && (await db.user.findUnique({ where: { id: sub.metadata.userId } }))) ||
    (await db.user.findUnique({ where: { stripeCustomerId: customerId } }));
  if (!user) {
    console.warn(`[billing] no user for subscription ${sub.id} (customer ${customerId})`);
    return;
  }

  const active = isProStatus(sub.status);
  // Событие по старой, уже закрытой подписке не должно отключить Pro, оплаченный новой
  if (!active && user.stripeSubscriptionId && user.stripeSubscriptionId !== sub.id && isProStatus(user.subscriptionStatus)) {
    return;
  }

  const item = sub.items.data[0];
  await db.user.update({
    where: { id: user.id },
    data: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: sub.id,
      subscriptionStatus: sub.status,
      subscriptionInterval: item?.price.recurring?.interval ?? null,
      currentPeriodEnd: item ? new Date(item.current_period_end * 1000) : null,
      cancelAtPeriodEnd: sub.cancel_at_period_end || sub.cancel_at !== null,
      plan: active ? "PRO" : "FREE",
      // Публичный профиль — Pro-функция: при окончании подписки скрываем его
      ...(active ? {} : { isPublic: false }),
    },
  });
}

/** Находит или создаёт клиента Stripe для пользователя. */
export async function ensureCustomer(user: { id: string; email: string; name: string; stripeCustomerId: string | null }) {
  if (user.stripeCustomerId) return user.stripeCustomerId;
  const customer = await stripe().customers.create({ email: user.email, name: user.name, metadata: { userId: user.id } });
  await db.user.update({ where: { id: user.id }, data: { stripeCustomerId: customer.id } });
  return customer.id;
}
