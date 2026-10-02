import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { syncSubscription } from "@/lib/billing";
import { stripe } from "@/lib/stripe";

/**
 * Возврат из Stripe Checkout. Синхронизируем подписку сразу, не дожидаясь вебхука,
 * чтобы Pro открылся мгновенно; вебхук потом повторит то же самое без вреда.
 */
export async function GET(req: NextRequest) {
  const settings = new URL("/settings", req.url);
  settings.hash = "plan";

  const user = await getCurrentUser();
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!user) return NextResponse.redirect(new URL("/login", req.url));
  if (!sessionId) return NextResponse.redirect(settings);

  try {
    const session = await stripe().checkout.sessions.retrieve(sessionId);
    // Сессия должна принадлежать текущему пользователю
    if (session.client_reference_id === user.id && session.subscription) {
      await syncSubscription(typeof session.subscription === "string" ? session.subscription : session.subscription.id);
      settings.searchParams.set("checkout", "success");
    }
  } catch (error) {
    console.error("[billing] success sync failed", error);
    settings.searchParams.set("checkout", "pending");
  }
  return NextResponse.redirect(settings);
}
