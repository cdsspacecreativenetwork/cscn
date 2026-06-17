"use client";

import { useState } from "react";
import { AlertTriangle, Banknote, CreditCard, ReceiptText, RefreshCcw, WalletCards } from "lucide-react";

import type { getAdminBillingOverview } from "@/data/admin-billing";
import { PayoutRequestActions } from "@/components/dashboard/admin/PayoutRequestActions";
import { RefundRequestActions } from "@/components/dashboard/admin/RefundRequestActions";
import { formatCurrency } from "@/lib/money";
import { CurrencyPreferenceSelect } from "@/components/dashboard/CurrencyPreferenceSelect";

type BillingData = Awaited<ReturnType<typeof getAdminBillingOverview>>;

interface Props {
  data: BillingData;
}

function formatMoney(amount: number, currency = "NGN") {
  return formatCurrency(amount, currency, "en-US");
}

function formatDate(value?: Date | string | null) {
  if (!value) return "Not paid yet";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function statusClass(status: string) {
  if (["PAID", "SUCCEEDED", "APPROVED"].includes(status)) return "bg-emerald-50 text-emerald-700";
  if (["PENDING", "REQUESTED", "PROCESSING"].includes(status)) return "bg-amber-50 text-amber-700";
  if (["FAILED", "REJECTED", "CANCELLED", "REFUNDED"].includes(status)) return "bg-red-50 text-red-600";
  return "bg-[#F4F6FB] text-[#9CA3AF]";
}

export function AdminBillingConsole({ data }: Props) {
  const [isCurrencyUpdating, setIsCurrencyUpdating] = useState(false);
  const displayCurrency = data.summary.displayCurrency;
  const cards = [
    { label: "Gross revenue", value: formatMoney(data.summary.grossRevenue, displayCurrency), detail: `${data.summary.paidOrders} paid orders`, icon: Banknote },
    { label: "This month", value: formatMoney(data.summary.monthRevenue, displayCurrency), detail: `${data.summary.monthOrders} paid orders`, icon: CreditCard },
    { label: "Platform revenue", value: formatMoney(data.summary.estimatedPlatformRevenue, displayCurrency), detail: "Estimated 20% platform share", icon: ReceiptText },
    { label: "Instructor liability", value: formatMoney(data.summary.availableInstructorBalance, displayCurrency), detail: "Available unpaid earnings", icon: WalletCards },
  ];

  return (
    <div className="mx-auto max-w-[1728px] space-y-6 p-[clamp(16px,2.78vw,48px)] pb-28 font-jakarta">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#1C4ED1]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#1C4ED1]">
            <Banknote size={13} /> Finance operations
          </p>
          <h1 className="text-[28px] font-black tracking-[-0.04em] text-[#040B37] md:text-[34px]">Billing</h1>
          <p className="mt-1 max-w-3xl text-[14px] font-medium leading-relaxed text-[#9CA3AF]">
            Provider-agnostic finance command center for orders, payments, refunds, invoices, instructor earnings, and payout operations.
          </p>
        </div>
        <div className="w-full max-w-[280px]">
          <p className="mb-2 text-[12px] font-black uppercase tracking-[0.12em] text-[#9CA3AF]">Display currency</p>
          <CurrencyPreferenceSelect value={displayCurrency} onPendingChange={setIsCurrencyUpdating} />
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="flex min-h-[142px] flex-col gap-5 rounded-[12px] border border-[#E3E8F4] bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-[15px] font-semibold text-[#9CA3AF]">{card.label}</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#F4F6FB] text-[#1C4ED1]">
                <card.icon size={20} />
              </div>
            </div>
            {isCurrencyUpdating ? (
              <div className="space-y-2">
                <div className="h-8 w-36 animate-pulse rounded-md bg-[#1C4ED1]/5" />
                <div className="h-4 w-28 animate-pulse rounded-md bg-[#1C4ED1]/5" />
              </div>
            ) : (
              <div>
                <p className="text-[28px] font-black leading-none text-[#040B37]">{card.value}</p>
                <p className="mt-2 text-[12px] font-semibold text-[#9CA3AF]">{card.detail}</p>
              </div>
            )}
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-[16px] border border-[#E3E8F4] bg-white p-5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-amber-600" size={22} />
            <div>
              <h2 className="text-[16px] font-black text-[#040B37]">Needs finance attention</h2>
              <p className="text-[12px] font-semibold text-[#9CA3AF]">Queues finance admins should watch daily.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between rounded-[12px] bg-[#F8FAFF] px-4 py-3">
              <span className="text-[13px] font-bold text-[#4B5563]">Pending orders</span>
              <span className="text-[16px] font-black text-[#040B37]">{data.summary.pendingOrders}</span>
            </div>
            <div className="flex items-center justify-between rounded-[12px] bg-[#F8FAFF] px-4 py-3">
              <span className="text-[13px] font-bold text-[#4B5563]">Failed payments</span>
              <span className="text-[16px] font-black text-[#040B37]">{data.summary.failedPayments}</span>
            </div>
            <div className="flex items-center justify-between rounded-[12px] bg-[#F8FAFF] px-4 py-3">
              <span className="text-[13px] font-bold text-[#4B5563]">Open refunds</span>
              <span className="text-[16px] font-black text-[#040B37]">{data.summary.openRefunds}</span>
            </div>
          </div>
        </div>

        <div className="rounded-[16px] border border-[#E3E8F4] bg-white p-5">
          <div className="flex items-center gap-3">
            <RefreshCcw className="text-[#1C4ED1]" size={22} />
            <div>
              <h2 className="text-[16px] font-black text-[#040B37]">Payout queue</h2>
              <p className="text-[12px] font-semibold text-[#9CA3AF]">Instructor withdrawal requests awaiting finance review.</p>
            </div>
          </div>
          <div className="mt-5 rounded-[12px] bg-[#1C4ED1]/5 p-4">
            {isCurrencyUpdating ? (
              <div className="h-8 w-40 animate-pulse rounded-md bg-[#1C4ED1]/10" />
            ) : (
              <p className="text-[28px] font-black text-[#040B37]">{formatMoney(data.summary.pendingPayoutAmount, displayCurrency)}</p>
            )}
            <p className="mt-1 text-[12px] font-bold text-[#1C4ED1]">{data.summary.pendingPayouts} pending payout requests</p>
          </div>
        </div>

        <div className="rounded-[16px] border border-[#E3E8F4] bg-white p-5">
          <h2 className="text-[16px] font-black text-[#040B37]">Provider readiness</h2>
          <p className="mt-1 text-[12px] font-semibold text-[#9CA3AF]">Ledger is ready before payment rails are connected.</p>
          <div className="mt-5 space-y-2">
            {["Paystack collection", "Paystack transfers", "Stripe checkout", "Manual reconciliation"].map((item, index) => (
              <div key={item} className="flex items-center justify-between rounded-[12px] bg-[#F8FAFF] px-4 py-3">
                <span className="text-[13px] font-bold text-[#4B5563]">{item}</span>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${index === 3 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                  {index === 3 ? "READY" : "NEXT"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[18px] border border-[#E3E8F4] bg-white shadow-sm">
        <div className="border-b border-[#E3E8F4] p-5">
          <h2 className="text-[18px] font-black text-[#040B37]">Refund review queue</h2>
          <p className="mt-1 text-[12px] font-semibold text-[#9CA3AF]">
            Refund cases opened from purchases, mentorship cancellations, or finance review.
          </p>
        </div>
        {data.recentRefundRequests.length > 0 ? (
          <div className="divide-y divide-[#F4F6FB]">
            {data.recentRefundRequests.map((refund) => {
              const subject =
                refund.order.course?.title ??
                refund.order.mentorBooking?.topic ??
                refund.order.type;
              const mentorName = refund.order.mentorBooking?.mentor.name ?? refund.order.mentorBooking?.mentor.email;

              return (
                <div key={refund.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${statusClass(refund.status)}`}>{refund.status}</span>
                      <span className="rounded-full bg-[#1C4ED1]/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#1C4ED1]">
                        {refund.order.type}
                      </span>
                    </div>
                    <p className="mt-3 text-[14px] font-black text-[#040B37]">{subject}</p>
                    <p className="mt-1 text-[12px] font-semibold text-[#9CA3AF]">
                      {refund.order.user.name ?? refund.order.user.email} | {formatDate(refund.createdAt)}
                    </p>
                    {mentorName && (
                      <p className="mt-1 text-[12px] font-semibold text-[#4B5563]">Mentor: {mentorName}</p>
                    )}
                    {refund.reason && (
                      <p className="mt-2 max-w-3xl text-[12px] font-medium leading-relaxed text-[#4B5563]">{refund.reason}</p>
                    )}
                  </div>
                  <div className="text-left lg:text-right">
                    <p className="text-[15px] font-black text-[#040B37]">{formatMoney(refund.amount, refund.currency)}</p>
                    <RefundRequestActions refundId={refund.id} status={refund.status} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-[13px] font-semibold text-[#9CA3AF]">No refund cases need review right now.</div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[18px] border border-[#E3E8F4] bg-white shadow-sm">
          <div className="border-b border-[#E3E8F4] p-5">
            <h2 className="text-[18px] font-black text-[#040B37]">Recent orders</h2>
          </div>
          {data.recentOrders.length > 0 ? (
            <div className="divide-y divide-[#F4F6FB]">
              {data.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-black text-[#040B37]">{order.course?.title ?? order.type}</p>
                    <p className="mt-1 text-[12px] font-semibold text-[#9CA3AF]">{order.user.name ?? order.user.email} | {formatDate(order.paidAt ?? order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[14px] font-black text-[#040B37]">{formatMoney(order.amount, order.currency)}</p>
                    <span className={`mt-1 inline-block rounded-full px-2.5 py-1 text-[10px] font-black ${statusClass(order.status)}`}>{order.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-[13px] font-semibold text-[#9CA3AF]">No orders yet. Successful checkout webhooks will populate this table.</div>
          )}
        </div>

        <div className="rounded-[18px] border border-[#E3E8F4] bg-white shadow-sm">
          <div className="border-b border-[#E3E8F4] p-5">
            <h2 className="text-[18px] font-black text-[#040B37]">Recent payout requests</h2>
          </div>
          {data.recentPayoutRequests.length > 0 ? (
            <div className="divide-y divide-[#F4F6FB]">
              {data.recentPayoutRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-black text-[#040B37]">{request.instructor.name ?? request.instructor.email}</p>
                    <p className="mt-1 text-[12px] font-semibold text-[#9CA3AF]">{request.payoutMethod ?? "No payout method"} | {formatDate(request.requestedAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[14px] font-black text-[#040B37]">{formatMoney(request.amount, request.currency)}</p>
                    <span className={`mt-1 inline-block rounded-full px-2.5 py-1 text-[10px] font-black ${statusClass(request.status)}`}>{request.status}</span>
                    <PayoutRequestActions requestId={request.id} status={request.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-[13px] font-semibold text-[#9CA3AF]">No payout requests yet. Instructor withdrawals will appear here.</div>
          )}
        </div>
      </section>
    </div>
  );
}
