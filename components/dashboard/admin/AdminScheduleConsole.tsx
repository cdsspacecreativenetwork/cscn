import Link from "next/link";
import { AlertTriangle, CalendarClock, CheckCircle2, ExternalLink, Link2, Radio, ShieldCheck, UsersRound, WalletCards, XCircle } from "lucide-react";

import {
  cancelAdminScheduleEventAction,
  completeAdminScheduleEventAction,
  requestMentorshipRefundReviewAction,
  reviewScheduleAttentionAction,
} from "@/actions/admin-schedule";
import Button from "@/components/ui/Button";
import type { AdminScheduleEvent } from "@/data/admin-schedule";

type AdminScheduleOverview = {
  stats: Array<{ label: string; value: number; helper: string }>;
  answers: Array<{ question: string; answer: string }>;
  attentionEvents: AdminScheduleEvent[];
  attentionPagination: { page: number; pageCount: number; total: number };
  events: AdminScheduleEvent[];
  eventsPagination: { page: number; pageCount: number; total: number };
};

function statusClass(status: string) {
  if (status === "CANCELLED") return "bg-red-50 text-red-600";
  if (status === "COMPLETED") return "bg-emerald-50 text-emerald-700";
  if (status === "LIVE") return "bg-blue-50 text-[#1C4ED1]";
  return "bg-[#1C4ED1]/10 text-[#1C4ED1]";
}

function eventRiskLabels(event: AdminScheduleEvent) {
  const labels: string[] = [];
  if (event.needsMeetingLink) labels.push("Missing meeting link");
  if (event.startsSoon) labels.push("Starts soon");
  if (event.hasNoAttendees) labels.push("No attendee records");
  if (event.mentorship?.canRequestRefund && event.status === "CANCELLED") labels.push("Refund review eligible");
  return labels;
}

function Pagination({
  basePath,
  page,
  pageCount,
  param,
}: {
  basePath: string;
  page: number;
  pageCount: number;
  param: string;
}) {
  if (pageCount <= 1) return null;

  const previous = Math.max(1, page - 1);
  const next = Math.min(pageCount, page + 1);

  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
      <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">
        Page {page} of {pageCount}
      </p>
      <div className="flex gap-2">
        <Link
          href={`${basePath}?${param}=${previous}`}
          className={`rounded-[10px] border border-[#D8E0EF] px-4 py-2 text-[12px] font-bold transition ${
            page <= 1 ? "pointer-events-none opacity-40" : "text-[#040B37] hover:border-[#1C4ED1] hover:text-[#1C4ED1]"
          }`}
        >
          Previous
        </Link>
        <Link
          href={`${basePath}?${param}=${next}`}
          className={`rounded-[10px] border border-[#D8E0EF] px-4 py-2 text-[12px] font-bold transition ${
            page >= pageCount ? "pointer-events-none opacity-40" : "text-[#040B37] hover:border-[#1C4ED1] hover:text-[#1C4ED1]"
          }`}
        >
          Next
        </Link>
      </div>
    </div>
  );
}

function EventRow({ event, compact = false, attention = false }: { event: AdminScheduleEvent; compact?: boolean; attention?: boolean }) {
  const risks = eventRiskLabels(event);
  const canOperate = event.status !== "CANCELLED" && event.status !== "COMPLETED";

  return (
    <article className="rounded-[18px] border border-[#E3E8F4] bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${statusClass(event.status)}`}>
              {event.status.toLowerCase()}
            </span>
            <span className="rounded-full bg-[#F4F6FB] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#4B5563]">
              {event.type.replaceAll("_", " ").toLowerCase()}
            </span>
            {risks.map((risk) => (
              <span key={risk} className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-amber-700">
                {risk}
              </span>
            ))}
          </div>
          <h3 className="mt-3 text-[17px] font-bold leading-tight text-[#040B37]">{event.title}</h3>
          <p className="mt-1 text-[13px] font-semibold text-[#4B5563]">
            {event.courseTitle ?? "Platform event"} {event.creatorName ? `by ${event.creatorName}` : ""}
          </p>
          {!compact && event.description && (
            <p className="mt-2 max-w-[820px] text-[13px] font-medium leading-relaxed text-[#9CA3AF]">{event.description}</p>
          )}
          {event.mentorship && (
            <div className="mt-3 grid gap-2 rounded-[14px] border border-[#E3E8F4] bg-[#F8FAFF] p-3 text-[12px] font-semibold text-[#4B5563] sm:grid-cols-2 xl:grid-cols-4">
              <span>
                <strong className="text-[#040B37]">Student:</strong> {event.mentorship.studentName ?? "Unknown"}
              </span>
              <span>
                <strong className="text-[#040B37]">Mentor:</strong> {event.mentorship.mentorName ?? "Unknown"}
              </span>
              <span>
                <strong className="text-[#040B37]">Payment:</strong>{" "}
                {event.mentorship.orderStatus ?? "No order"}
              </span>
              <span>
                <strong className="text-[#040B37]">Refund:</strong>{" "}
                {event.mentorship.refundStatus ?? "None"}
              </span>
            </div>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[520px]">
          <div className="rounded-[14px] bg-[#F4F6FB] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">When</p>
            <p className="mt-1 text-[14px] font-bold text-[#040B37]">{event.date}</p>
            <p className="text-[12px] font-semibold text-[#4B5563]">{event.time}</p>
            <p className="mt-1 text-[11px] font-semibold text-[#9CA3AF]">{event.timezone}</p>
          </div>
          <div className="rounded-[14px] bg-[#F4F6FB] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">Coverage</p>
            <p className="mt-1 text-[14px] font-bold text-[#040B37]">{event.attendeeCount} notified records</p>
            <p className="text-[12px] font-semibold text-[#4B5563]">{event.enrolledStudents} enrolled students</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {event.meetingUrl ? (
          <a
            href={event.meetingUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-[10px] border border-[#D8E0EF] px-4 py-2 text-[12px] font-bold text-[#1C4ED1] transition hover:border-[#1C4ED1]"
          >
            <ExternalLink size={14} strokeWidth={1.9} />
            Open meeting
          </a>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-2 text-[12px] font-bold text-amber-700">
            <Link2 size={14} strokeWidth={1.9} />
            Link missing
          </span>
        )}

        {canOperate && (
          <>
            <form action={completeAdminScheduleEventAction}>
              <input type="hidden" name="eventId" value={event.id} />
              <Button type="submit" variant="outline" rounded="md" size="sm" className="gap-2 border-emerald-200 text-emerald-700">
                <CheckCircle2 size={14} strokeWidth={1.9} />
                Mark complete
              </Button>
            </form>
            <form action={cancelAdminScheduleEventAction}>
              <input type="hidden" name="eventId" value={event.id} />
              <input type="hidden" name="reason" value="Cancelled from Platform Events by CSCN operations." />
              {event.mentorship?.canRequestRefund && <input type="hidden" name="requestRefund" value="on" />}
              <Button type="submit" variant="outline" rounded="md" size="sm" className="gap-2 border-red-200 text-red-600">
                <XCircle size={14} strokeWidth={1.9} />
                {event.mentorship?.canRequestRefund ? "Cancel + refund review" : "Cancel"}
              </Button>
            </form>
          </>
        )}
        {event.mentorship?.canRequestRefund && event.status === "CANCELLED" && (
          <form action={requestMentorshipRefundReviewAction}>
            <input type="hidden" name="eventId" value={event.id} />
            <input type="hidden" name="reason" value="Paid mentorship session was cancelled and needs finance review." />
            <Button type="submit" variant="secondary" rounded="md" size="sm" className="gap-2">
              <WalletCards size={14} strokeWidth={1.9} />
              Open refund review
            </Button>
          </form>
        )}
        {attention && (
          <form action={reviewScheduleAttentionAction}>
            <input type="hidden" name="eventId" value={event.id} />
            <input type="hidden" name="note" value="Reviewed from Platform Events attention queue." />
            <Button type="submit" variant="ghost" rounded="md" size="sm" className="gap-2 text-[#1C4ED1]">
              <CheckCircle2 size={14} strokeWidth={1.9} />
              Mark reviewed
            </Button>
          </form>
        )}
      </div>
    </article>
  );
}

export function AdminScheduleConsole({
  overview,
  error,
  cancelled,
  completed,
  reviewed,
  refund,
}: {
  overview: AdminScheduleOverview;
  error?: string;
  cancelled?: boolean;
  completed?: boolean;
  reviewed?: boolean;
  refund?: boolean;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[1728px] flex-col gap-8 p-[clamp(16px,2.78vw,48px)] pb-24 font-jakarta">
      <div className="flex flex-col gap-3">
        {/* <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#1C4ED1]/5 px-3 py-1 text-[12px] font-bold uppercase tracking-[0.08em] text-[#1C4ED1]">
          <ShieldCheck size={14} strokeWidth={1.9} />
          Platform operations
        </span> */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-[26px] font-bold tracking-tight text-[#040B37] lg:text-[32px]">Platform Events</h1>
            <p className="mt-2 max-w-[820px] text-[14px] font-medium leading-relaxed text-[#9CA3AF]">
              Govern live sessions, mentorship bookings, exams, deadlines, meeting links, cancellations, and refund-sensitive event issues from one calm operational view.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-[14px] font-semibold text-red-700">
          We could not complete that schedule action. Please try again.
        </div>
      )}
      {cancelled && (
        <div className="rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] font-semibold text-amber-700">
          Schedule event cancelled and affected users were notified.
        </div>
      )}
      {completed && (
        <div className="rounded-[14px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-[14px] font-semibold text-emerald-700">
          Schedule event marked complete.
        </div>
      )}
      {reviewed && (
        <div className="rounded-[14px] border border-[#BBD0FF] bg-[#1C4ED1]/5 px-4 py-3 text-[14px] font-semibold text-[#1C4ED1]">
          Attention item reviewed and removed from the active queue.
        </div>
      )}
      {refund && (
        <div className="rounded-[14px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-[14px] font-semibold text-emerald-700">
          Refund review case opened. Finance admins have been notified.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overview.stats.map((stat) => (
          <div key={stat.label} className="rounded-[16px] border border-[#E3E8F4] bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <p className="text-[13px] font-semibold text-[#9CA3AF]">{stat.label}</p>
              <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#1C4ED1]/5 text-[#1C4ED1]">
                <CalendarClock size={20} strokeWidth={1.9} />
              </span>
            </div>
            <p className="mt-5 text-[30px] font-bold leading-none text-[#040B37]">{stat.value}</p>
            <p className="mt-2 text-[12px] font-semibold text-[#4B5563]">{stat.helper}</p>
          </div>
        ))}
      </div>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[20px] border border-[#E3E8F4] bg-white p-5 shadow-sm lg:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#1C4ED1]/5 text-[#1C4ED1]">
              <Radio size={22} strokeWidth={1.9} />
            </div>
            <div>
              <h2 className="text-[20px] font-bold text-[#040B37]">Operational answers</h2>
              <p className="text-[13px] font-medium text-[#9CA3AF]">The questions admin should answer before schedule work begins.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3">
            {overview.answers.map((answer) => (
              <div key={answer.question} className="rounded-[14px] bg-[#F4F6FB] p-4">
                <p className="text-[13px] font-bold text-[#040B37]">{answer.question}</p>
                <p className="mt-1 text-[13px] font-medium leading-relaxed text-[#4B5563]">{answer.answer}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[20px] border border-[#E3E8F4] bg-white p-5 shadow-sm lg:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-amber-50 text-amber-600">
              <AlertTriangle size={22} strokeWidth={1.9} />
            </div>
            <div>
              <h2 className="text-[20px] font-bold text-[#040B37]">Needs attention</h2>
              <p className="text-[13px] font-medium text-[#9CA3AF]">Missing links, imminent sessions, no attendee records, and refund-sensitive cancelled mentorships.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {overview.attentionEvents.length > 0 ? (
              overview.attentionEvents.map((event) => <EventRow key={event.id} event={event} compact attention />)
            ) : (
              <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[16px] border border-dashed border-[#C8D1E0] bg-[#F4F6FB] p-8 text-center">
                <UsersRound size={30} className="text-[#1C4ED1]" strokeWidth={1.8} />
                <h3 className="mt-3 text-[17px] font-bold text-[#040B37]">No schedule risks right now</h3>
                <p className="mt-2 text-[13px] font-medium text-[#9CA3AF]">Sessions with missing links or notification coverage issues will appear here.</p>
              </div>
            )}
          </div>
          <Pagination
            basePath="/dashboard/admin/platform-events"
            page={overview.attentionPagination.page}
            pageCount={overview.attentionPagination.pageCount}
            param="attentionPage"
          />
        </div>
      </section>

      <section className="rounded-[20px] border border-[#E3E8F4] bg-[#F4F6FB] p-4 shadow-sm lg:p-5">
        <div className="mb-5 flex flex-col gap-1">
          <h2 className="text-[20px] font-bold text-[#040B37]">Recent platform events</h2>
          <p className="text-[13px] font-medium text-[#9CA3AF]">Most recent sessions and event items, including cancelled mentorship sessions.</p>
        </div>
        <div className="space-y-4">
          {overview.events.length > 0 ? (
            overview.events.map((event) => <EventRow key={event.id} event={event} />)
          ) : (
            <div className="rounded-[16px] border border-dashed border-[#C8D1E0] bg-white p-8 text-center text-[14px] font-semibold text-[#9CA3AF]">
              No schedule events have been created yet.
            </div>
          )}
        </div>
        <Pagination
          basePath="/dashboard/admin/platform-events"
          page={overview.eventsPagination.page}
          pageCount={overview.eventsPagination.pageCount}
          param="eventsPage"
        />
      </section>
    </div>
  );
}

