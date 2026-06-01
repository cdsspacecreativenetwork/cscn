import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  BookOpen,
  Clock3,
  Download,
  FileText,
  GraduationCap,
  ReceiptText,
  RotateCcw,
  WalletCards,
} from "lucide-react";

import { auth } from "@/auth";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatDate, formatMoney, getStudentPurchasesDashboard } from "@/data/student-purchases";

function statusClass(status: string) {
  const normalized = status.toUpperCase();
  if (["PAID", "SUCCEEDED", "ACTIVE", "COMPLETED"].includes(normalized)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (["PENDING", "REQUESTED", "PROCESSING"].includes(normalized)) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (["FAILED", "CANCELLED", "REFUNDED", "LOCKED", "REJECTED"].includes(normalized)) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-[#E3E8F4] bg-[#F4F6FB] text-[#4B5563]";
}

function StatusPill({ status }: { status: string | null }) {
  if (!status) return null;
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-[12px] font-bold uppercase tracking-[0.08em] ${statusClass(status)}`}>
      {status.replace(/_/g, " ").toLowerCase()}
    </span>
  );
}

export default async function PurchasesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const data = await getStudentPurchasesDashboard(session.user.id);
  const hasPurchases = data.purchasedCourses.length > 0;
  const hasAccess = data.freeAccessCourses.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-[1728px] flex-col gap-8 p-[clamp(16px,2.78vw,48px)] pb-24 font-jakarta">
      <div className="flex flex-col gap-2">
        <h1 className="text-[24px] font-bold tracking-tight text-[#040B37] lg:text-[28px]">
          Purchases & Access
        </h1>
        <p className="max-w-2xl text-[14px] font-medium text-text-mute">
          View your paid courses, free enrollments, receipts, payment attempts, and course access in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-[clamp(16px,1.39vw,24px)] sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Courses Purchased"
          value={data.summary.coursesPurchased}
          icon={<GraduationCap className="h-5 w-5 text-[#1C4ED1]" strokeWidth={1.9} />}
        />
        <StatCard
          title="Total Spent"
          value={formatMoney(data.summary.totalSpent, data.summary.currency)}
          icon={<WalletCards className="h-5 w-5 text-[#1C4ED1]" strokeWidth={1.9} />}
        />
        <StatCard
          title="Active Access"
          value={data.summary.activeAccess}
          icon={<BookOpen className="h-5 w-5 text-[#1C4ED1]" strokeWidth={1.9} />}
        />
        <StatCard
          title="Pending Payments"
          value={data.summary.pendingPayments}
          icon={<Clock3 className="h-5 w-5 text-[#1C4ED1]" strokeWidth={1.9} />}
        />
      </div>

      <section className="rounded-[18px] border border-[#E3E8F4] bg-white shadow-[0px_1px_3px_rgba(16,24,40,0.05)]">
        <div className="flex flex-col gap-2 border-b border-[#E3E8F4] p-5 md:p-6">
          <h2 className="text-[20px] font-bold tracking-tight text-[#040B37]">Purchased Courses</h2>
          <p className="text-[13px] font-medium text-text-mute">
            Paid course orders and the access attached to each purchase.
          </p>
        </div>

        {hasPurchases ? (
          <div className="divide-y divide-[#E3E8F4]">
            {data.purchasedCourses.map((purchase) => (
              <article key={purchase.id} className="grid gap-5 p-5 md:grid-cols-[96px_1fr_auto] md:p-6">
                <div className="relative h-24 w-full overflow-hidden rounded-[14px] bg-[#F4F6FB] md:w-24">
                  {purchase.thumbnail ? (
                    <Image src={purchase.thumbnail} alt={purchase.title} fill className="object-cover" sizes="96px" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <BookOpen className="h-8 w-8 text-[#1C4ED1]/55" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-[18px] font-bold leading-snug tracking-tight text-[#040B37]">
                      {purchase.title}
                    </h3>
                    <p className="text-[13px] font-medium text-text-mute">
                      Instructor: {purchase.instructorName}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill status={purchase.status} />
                    <StatusPill status={purchase.accessStatus} />
                    {purchase.refundStatus && <StatusPill status={purchase.refundStatus} />}
                  </div>

                  <div className="grid gap-2 text-[13px] font-medium text-[#4B5563] sm:grid-cols-2 lg:grid-cols-4">
                    <span>Paid: {formatMoney(purchase.amount, purchase.currency)}</span>
                    <span>Date: {formatDate(purchase.purchasedAt ?? purchase.createdAt)}</span>
                    <span>Provider: {purchase.provider ?? "Not selected"}</span>
                    <span>Channel: {purchase.channel ?? "Checkout"}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-start gap-2 md:justify-end">
                  {purchase.slug && (
                    <Link
                      href={`/courses/${purchase.slug}`}
                      className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#1C4ED1] px-4 py-2 text-[13px] font-bold text-white shadow-[0px_4px_12px_rgba(28,78,209,0.15)] transition hover:bg-[#163fa3]"
                    >
                      Continue
                      <ArrowUpRight size={16} />
                    </Link>
                  )}
                  <button
                    type="button"
                    disabled={!purchase.invoiceNumber}
                    className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-[#E3E8F4] px-4 py-2 text-[13px] font-bold text-[#040B37] transition hover:border-[#1C4ED1] hover:text-[#1C4ED1] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Download size={16} />
                    Receipt
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1C4ED1]/5">
              <ReceiptText className="h-7 w-7 text-[#1C4ED1]" />
            </div>
            <h3 className="text-[18px] font-bold text-[#040B37]">No paid courses yet</h3>
            <p className="max-w-md text-[14px] font-medium text-text-mute">
              When you buy a course, your access, payment status, and receipts will appear here.
            </p>
            <Link
              href="/courses"
              className="mt-2 inline-flex items-center rounded-[10px] bg-[#1C4ED1] px-5 py-2.5 text-[14px] font-bold text-white shadow-[0px_4px_12px_rgba(28,78,209,0.15)]"
            >
              Browse courses
            </Link>
          </div>
        )}
      </section>

      {hasAccess && (
        <section className="rounded-[18px] border border-[#E3E8F4] bg-white p-5 shadow-[0px_1px_3px_rgba(16,24,40,0.05)] md:p-6">
          <div className="mb-5 flex flex-col gap-2">
            <h2 className="text-[20px] font-bold tracking-tight text-[#040B37]">Free & Preview Access</h2>
            <p className="text-[13px] font-medium text-text-mute">
              Courses you can access without a paid order.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.freeAccessCourses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.slug}`}
                className="group flex items-center gap-4 rounded-[14px] border border-[#E3E8F4] bg-[#F4F6FB]/50 p-3 transition hover:border-[#1C4ED1]/30 hover:bg-[#1C4ED1]/5"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[12px] bg-white">
                  {course.thumbnail ? (
                    <Image src={course.thumbnail} alt={course.title} fill className="object-cover" sizes="64px" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <BookOpen className="h-6 w-6 text-[#1C4ED1]/55" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-bold text-[#040B37]">{course.title}</p>
                  <p className="mt-1 text-[12px] font-medium text-text-mute">
                    Enrolled {formatDate(course.enrolledAt)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[18px] border border-[#E3E8F4] bg-white p-5 shadow-[0px_1px_3px_rgba(16,24,40,0.05)] md:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[20px] font-bold tracking-tight text-[#040B37]">Payment History</h2>
              <p className="mt-1 text-[13px] font-medium text-text-mute">Successful, pending, and failed course payment attempts.</p>
            </div>
            <FileText className="h-5 w-5 text-[#1C4ED1]" />
          </div>

          {data.paymentHistory.length > 0 ? (
            <div className="space-y-3">
              {data.paymentHistory.slice(0, 8).map((payment) => (
                <div key={payment.id} className="flex flex-col gap-3 rounded-[14px] border border-[#E3E8F4] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-bold text-[#040B37]">{payment.courseTitle}</p>
                    <p className="mt-1 text-[12px] font-medium text-text-mute">
                      {formatDate(payment.date)} - {payment.provider ?? "Provider pending"} {payment.channel ? `- ${payment.channel}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPill status={payment.status} />
                    <span className="text-[14px] font-bold text-[#040B37]">{formatMoney(payment.amount, payment.currency)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-[14px] border border-dashed border-[#E3E8F4] p-8 text-center text-[14px] font-medium text-text-mute">
              No payment attempts yet.
            </p>
          )}
        </div>

        <div className="rounded-[18px] border border-[#E3E8F4] bg-white p-5 shadow-[0px_1px_3px_rgba(16,24,40,0.05)] md:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#1C4ED1]/5">
              <RotateCcw className="h-5 w-5 text-[#1C4ED1]" />
            </div>
            <div>
              <h2 className="text-[20px] font-bold tracking-tight text-[#040B37]">Refunds & Access Policy</h2>
              <p className="text-[13px] font-medium text-text-mute">Built for course purchases, not monthly plans.</p>
            </div>
          </div>
          <div className="space-y-4 text-[14px] font-medium leading-relaxed text-[#4B5563]">
            <p>
              When Paystack confirms payment, CSCN creates your course access automatically and keeps the purchase record for support and receipts.
            </p>
            <p>
              Receipts are issued per course purchase, so you can track exactly what you bought, how much you paid, and when access was granted.
            </p>
            <p className="rounded-[12px] bg-[#1C4ED1]/5 p-4 text-[#1C4ED1]">
              Refund requests will appear here once finance review rules are enabled for eligible purchases.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
