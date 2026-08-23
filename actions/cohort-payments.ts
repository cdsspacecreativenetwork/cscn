"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { isOfferExpired } from "@/lib/cohort-admission-decisions";
import { db } from "@/lib/db";
import { generatePaymentReference } from "@/lib/payments/ledger";
import { initializePaystackTransaction } from "@/lib/payments/paystack";
import { getAppBaseUrl } from "@/lib/payments/url";

export async function startCohortCheckoutAction(applicationId: string) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) return { error: "Sign in to accept this offer." };

  const application = await db.cohortApplication.findFirst({
    where: { id: applicationId, userId: session.user.id },
    select: {
      id: true,
      status: true,
      offerExpiresAt: true,
      cohort: { select: { id: true, slug: true, title: true, price: true, currency: true } },
      purchaseOrder: { select: { id: true, status: true } },
    },
  });
  if (!application || application.status !== "ACCEPTED") return { error: "A current accepted offer is required." };
  if (isOfferExpired(application.offerExpiresAt)) return { error: "This offer has expired. Contact admissions for help." };
  if (application.purchaseOrder?.status === "PAID") return { success: true, redirectUrl: `/cohorts/${application.cohort.slug}/apply` };

  const amount = Number(application.cohort.price ?? 0);
  if (amount <= 0) return { error: "This offer does not require payment." };
  if (application.cohort.currency !== "NGN") return { error: "Paystack checkout currently supports NGN cohort offers only." };
  if (!process.env.PAYSTACK_SECRET_KEY) return { error: "Checkout is unavailable in this local preview because Paystack is not configured." };

  const reference = generatePaymentReference("cscn_cohort");
  const order = application.purchaseOrder
    ? await db.purchaseOrder.update({
        where: { id: application.purchaseOrder.id },
        data: { status: "PENDING", amount, currency: application.cohort.currency, provider: "PAYSTACK", providerReference: reference },
        select: { id: true },
      })
    : await db.purchaseOrder.create({
        data: {
          userId: session.user.id,
          cohortApplicationId: application.id,
          type: "COHORT",
          status: "PENDING",
          amount,
          currency: application.cohort.currency,
          provider: "PAYSTACK",
          providerReference: reference,
          metadata: { applicationId: application.id, cohortId: application.cohort.id, cohortSlug: application.cohort.slug },
        },
        select: { id: true },
      });
  const payment = await db.payment.create({
    data: { orderId: order.id, userId: session.user.id, provider: "PAYSTACK", status: "PENDING", amount, currency: application.cohort.currency, providerReference: reference },
    select: { id: true },
  });

  try {
    const baseUrl = await getAppBaseUrl();
    const initialized = await initializePaystackTransaction({
      email: session.user.email,
      amount,
      currency: application.cohort.currency,
      reference,
      callbackUrl: `${baseUrl}/api/payments/paystack/callback?reference=${encodeURIComponent(reference)}`,
      metadata: { orderId: order.id, applicationId: application.id, cohortId: application.cohort.id, userId: session.user.id, type: "COHORT" },
    });
    if (!initialized.status || !initialized.data?.authorization_url) throw new Error(initialized.message || "Paystack initialization failed.");
    revalidatePath(`/cohorts/${application.cohort.slug}/apply`);
    return { success: true, authorizationUrl: initialized.data.authorization_url };
  } catch (error: unknown) {
    await Promise.all([
      db.purchaseOrder.update({ where: { id: order.id }, data: { status: "CANCELLED" } }),
      db.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } }),
    ]);
    console.error("Cohort checkout initialization failed:", error);
    return { error: "Checkout is temporarily unavailable. Please try again later." };
  }
}
