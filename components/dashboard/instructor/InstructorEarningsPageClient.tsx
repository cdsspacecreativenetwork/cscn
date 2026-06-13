"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Banknote, Clock3, CreditCard, ReceiptText, WalletCards } from "lucide-react";

import { InstructorEarningsCard } from "@/components/dashboard/instructor/InstructorEarningsCard";
import { formatCurrency } from "@/lib/money";
import type { getInstructorEarningsDetail } from "@/data/admin-billing";

type EarningsData = Awaited<ReturnType<typeof getInstructorEarningsDetail>>;

interface Props {
  data: EarningsData;
}

function formatMoney(amount: number, currency: string) {
  return formatCurrency(amount, currency, "en-US");
}

function formatDate(value?: Date | string | null) {
  if (!value) return "Not available yet";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function statusClass(status: string) {
  if (status === "PAID") return "bg-emerald-50 text-emerald-700";
  if (status === "AVAILABLE" || status === "APPROVED") return "bg-[#1C4ED1]/10 text-[#1C4ED1]";
  if (status === "PENDING" || status === "REQUESTED") return "bg-amber-50 text-amber-700";
  return "bg-[#F4F6FB] text-[#9CA3AF]";
}

export function InstructorEarningsPageClient({ data }: Props) {
  const [isCurrencyUpdating, setIsCurrencyUpdating] = useState(false);
  const currency = data.summary.displayCurrency;
  const summaryCards = [
    { label: "Available balance", value: data.summary.available, icon: WalletCards, detail: "Ready for withdrawal" },
    { label: "Pending release", value: data.summary.pending, icon: Clock3, detail: "Held for learner protection" },
    { label: "This month", value: data.summary.thisMonth, icon: Banknote, detail: "Instructor share earned" },
    { label: "Lifetime earnings", value: data.summary.lifetime, icon: ReceiptText, detail: "All non-reversed earnings" },
  ];

  useEffect(() => {
    const handleCurrencyPending = (event: Event) => {
      setIsCurrencyUpdating(Boolean((event as CustomEvent<boolean>).detail));
    };
    window.addEventListener("display-currency-pending", handleCurrencyPending);
    return () => window.removeEventListener("display-currency-pending", handleCurrencyPending);
  }, []);

  return (
    <div className="mx-auto max-w-[1728px] space-y-6 p-[clamp(16px,2.78vw,48px)] pb-28 font-jakarta">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#1C4ED1]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#1C4ED1]">
            <CreditCard size={13} /> Instructor finance
          </p>
          <h1 className="text-[28px] font-black tracking-[-0.04em] text-[#040B37] md:text-[34px]">Earnings</h1>
          <p className="mt-1 max-w-3xl text-[14px] font-medium leading-relaxed text-[#9CA3AF]">
            Track what every course is earning, what is still on hold, and when your payout requests move through finance.
          </p>
        </div>
        <Link
          href="/dashboard/instructor/courses"
          className="inline-flex items-center gap-2 rounded-[10px] bg-[#1C4ED1] px-4 py-3 text-[13px] font-bold text-white shadow-sm transition hover:bg-[#163fa3]"
        >
          Manage courses <ArrowUpRight size={15} />
        </Link>
      </div>

      <InstructorEarningsCard
        available={data.summary.available}
        pending={data.summary.pending}
        threshold={data.summary.threshold}
        currency={currency}
      />

      <section className="grid grid-cols-1 gap-[clamp(16px,1.39vw,24px)] sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="flex min-h-[142px] flex-col gap-5 rounded-[12px] border border-[#E3E8F4] bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-[15px] font-semibold text-[#9CA3AF]">{card.label}</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#F4F6FB] text-[#1C4ED1]">
                <card.icon size={20} />
              </div>
            </div>
            {isCurrencyUpdating ? (
              <div className="space-y-2">
                <div className="h-8 w-32 animate-pulse rounded-md bg-[#1C4ED1]/5" />
                <div className="h-4 w-36 animate-pulse rounded-md bg-[#1C4ED1]/5" />
              </div>
            ) : (
              <div>
                <p className="text-[28px] font-black leading-none text-[#040B37]">{formatMoney(card.value, currency)}</p>
                <p className="mt-2 text-[12px] font-semibold text-[#9CA3AF]">{card.detail}</p>
              </div>
            )}
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[18px] border border-[#E3E8F4] bg-white shadow-sm">
          <div className="border-b border-[#E3E8F4] p-5">
            <h2 className="text-[18px] font-black text-[#040B37]">Per-course earnings</h2>
            <p className="mt-1 text-[12px] font-semibold text-[#9CA3AF]">See which courses are creating your instructor revenue.</p>
          </div>
          {data.courseBreakdown.length > 0 ? (
            <div className="divide-y divide-[#F4F6FB]">
              {data.courseBreakdown.map((course) => (
                <div key={course.courseId} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-black text-[#040B37]">{course.title}</p>
                    <p className="mt-1 text-[12px] font-semibold text-[#9CA3AF]">{course.sales} paid sale{course.sales === 1 ? "" : "s"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-right sm:grid-cols-4">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#9CA3AF]">Total</p>
                      <p className="text-[13px] font-black text-[#040B37]">{formatMoney(course.lifetime, currency)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#9CA3AF]">Available</p>
                      <p className="text-[13px] font-black text-[#040B37]">{formatMoney(course.available, currency)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#9CA3AF]">Pending</p>
                      <p className="text-[13px] font-black text-[#040B37]">{formatMoney(course.pending, currency)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#9CA3AF]">Paid</p>
                      <p className="text-[13px] font-black text-[#040B37]">{formatMoney(course.paid, currency)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-[13px] font-semibold text-[#9CA3AF]">
              No earnings yet. Paid course purchases will appear here after checkout events are recorded.
            </div>
          )}
        </div>

        <div className="rounded-[18px] border border-[#E3E8F4] bg-white shadow-sm">
          <div className="border-b border-[#E3E8F4] p-5">
            <h2 className="text-[18px] font-black text-[#040B37]">Payout history</h2>
            <p className="mt-1 text-[12px] font-semibold text-[#9CA3AF]">Withdrawal requests and finance status.</p>
          </div>
          {data.payoutHistory.length > 0 ? (
            <div className="divide-y divide-[#F4F6FB]">
              {data.payoutHistory.map((request) => (
                <div key={request.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[14px] font-black text-[#040B37]">{formatMoney(request.amount, currency)}</p>
                      <p className="mt-1 text-[12px] font-semibold text-[#9CA3AF]">{request.payoutMethod ?? "Payout method"} | {formatDate(request.requestedAt)}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${statusClass(request.status)}`}>{request.status}</span>
                  </div>
                  {request.adminNote && <p className="mt-3 rounded-[10px] bg-[#F8FAFF] p-3 text-[12px] font-semibold text-[#4B5563]">{request.adminNote}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-[13px] font-semibold text-[#9CA3AF]">
              No payout requests yet. Once your available balance reaches the threshold, you can request a withdrawal.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[18px] border border-[#E3E8F4] bg-white shadow-sm">
        <div className="border-b border-[#E3E8F4] p-5">
          <h2 className="text-[18px] font-black text-[#040B37]">Recent earnings ledger</h2>
        </div>
        {data.recentEarnings.length > 0 ? (
          <div className="divide-y divide-[#F4F6FB]">
            {data.recentEarnings.map((earning) => (
              <div key={earning.id} className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center">
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-black text-[#040B37]">{earning.courseTitle}</p>
                  <p className="mt-1 text-[12px] font-semibold text-[#9CA3AF]">
                    {earning.learnerName} | Earned {formatDate(earning.createdAt)} | {earning.status === "PENDING" ? "Releases" : "Available"} {formatDate(earning.status === "PENDING" ? earning.holdUntil : earning.availableAt)}
                  </p>
                </div>
                <div className="flex items-center gap-4 md:justify-end">
                  <div className="text-right">
                    <p className="text-[13px] font-black text-[#040B37]">{formatMoney(earning.instructorAmount, currency)}</p>
                    <p className="text-[11px] font-semibold text-[#9CA3AF]">after {formatMoney(earning.platformFee, currency)} platform fee</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${statusClass(earning.status)}`}>{earning.status}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-[13px] font-semibold text-[#9CA3AF]">No ledger entries yet.</div>
        )}
      </section>
    </div>
  );
}
