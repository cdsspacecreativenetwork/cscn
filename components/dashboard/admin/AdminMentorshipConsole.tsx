"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  approveMentorshipApplicationAction,
  rejectMentorshipApplicationAction,
  requestMentorshipApplicationChangesAction,
} from "@/actions/admin-mentorship";
import { InstructorMentorshipToggle } from "@/components/dashboard/admin/InstructorMentorshipToggle";
import Button from "@/components/ui/Button";
import type { AdminMentorshipConsoleData } from "@/types/admin-mentorship";

type MentorshipApplication = AdminMentorshipConsoleData["applications"][number];

type Props = {
  data: AdminMentorshipConsoleData;
  canManageMentorship: boolean;
};

const APPLICATION_TABS = [
  { value: "PENDING", label: "Pending" },
  { value: "CHANGES_REQUESTED", label: "Changes requested" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
] as const;

function moneyLabel(amount: string | null, currency: string) {
  const numeric = Number(amount ?? 0);
  if (numeric <= 0) return "Free";
  return `${currency} ${numeric.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function dateLabel(value: string, timezone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function submittedLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function displayName(person: { name: string | null; email: string }) {
  return person.name || person.email;
}

function initials(person: { name: string | null; email: string }) {
  return displayName(person)
    .split(/[.\s@_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ").toLowerCase();
}

function statusClass(status: string) {
  if (status === "APPROVED") return "bg-emerald-50 text-emerald-700";
  if (status === "REJECTED") return "bg-red-50 text-red-600";
  if (status === "CHANGES_REQUESTED") return "bg-blue-50 text-[#1C4ED1]";
  return "bg-amber-50 text-amber-700";
}

function applicationPriceLabel(application: MentorshipApplication) {
  if (application.mentorshipFree) return "Free sessions";
  const amount = Number(application.proposedPrice ?? 0);
  if (amount <= 0) return `${application.proposedCurrency} price not set`;
  return `${application.proposedCurrency} ${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function IssueTone({ tone }: { tone: string }) {
  if (tone === "danger") return <AlertTriangle size={18} strokeWidth={1.9} className="text-red-500" />;
  if (tone === "warning") return <AlertTriangle size={18} strokeWidth={1.9} className="text-amber-500" />;
  return <CheckCircle2 size={18} strokeWidth={1.9} className="text-emerald-600" />;
}

function ReadinessPill({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${
        ok ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
      }`}
    >
      {label}
    </span>
  );
}

function ApplicationAvatar({ application }: { application: MentorshipApplication }) {
  return application.instructor.image ? (
    <img src={application.instructor.image} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
  ) : (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1C4ED1]/10 text-[13px] font-black text-[#1C4ED1]">
      {initials(application.instructor)}
    </div>
  );
}

function ApplicationRow({
  application,
  onReview,
}: {
  application: MentorshipApplication;
  onReview: (application: MentorshipApplication) => void;
}) {
  const topics = application.topics.slice(0, 3);

  return (
    <article className="rounded-[18px] border border-[#E3E8F4] bg-white p-4 shadow-sm transition hover:border-[#BFD0FF] hover:shadow-[0px_12px_28px_rgba(4,11,55,0.06)]">
      <div className="grid gap-4 xl:grid-cols-[minmax(260px,340px)_minmax(0,1fr)_auto] xl:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <ApplicationAvatar application={application} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-[15px] font-black text-[#040B37]">{displayName(application.instructor)}</p>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${statusClass(application.status)}`}>
                {statusLabel(application.status)}
              </span>
            </div>
            <p className="truncate text-[12px] font-semibold text-[#9CA3AF]">
              {application.instructor.headline || application.instructor.email}
            </p>
            <p className="mt-1 text-[11px] font-bold text-[#9CA3AF]">Submitted {submittedLabel(application.submittedAt)}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 xl:justify-end">
          <div className="flex flex-wrap gap-2 xl:max-w-[260px] xl:justify-end">
            <ReadinessPill label="Verified" ok={application.instructor.instructorVerificationStatus === "VERIFIED"} />
            <ReadinessPill label="Topics" ok={application.topics.length > 0} />
            <ReadinessPill label="Availability" ok={application.instructor.activeAvailability > 0} />
            <ReadinessPill label="Payout" ok={application.instructor.payoutSetup} />
          </div>
          <Button
            type="button"
            variant={application.status === "PENDING" || application.status === "CHANGES_REQUESTED" ? "primary" : "outline"}
            size="sm"
            rounded="md"
            onClick={() => onReview(application)}
            className="gap-2"
          >
            Review
            <ChevronRight size={14} strokeWidth={2} />
          </Button>
        </div>
      </div>
    </article>
  );
}

function ReviewDrawer({
  application,
  canManageMentorship,
  onClose,
}: {
  application: MentorshipApplication;
  canManageMentorship: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [decision, setDecision] = useState<"approve" | "changes" | "reject">("approve");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const isReviewable = application.status === "PENDING" || application.status === "CHANGES_REQUESTED";

  const runDecision = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("applicationId", application.id);
      if (note.trim()) formData.set("reviewNote", note.trim());

      const result =
        decision === "approve"
          ? await approveMentorshipApplicationAction(formData)
          : decision === "changes"
            ? await requestMentorshipApplicationChangesAction(formData)
            : await rejectMentorshipApplicationAction(formData);

      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("success" in result ? result.success : "Mentorship application updated.");
      onClose();
      router.refresh();
    });
  };

  return (
    <div className="fixed inset-0 z-[90] flex justify-end bg-[#040B37]/45 backdrop-blur-sm" onMouseDown={onClose}>
      <aside
        className="h-full w-full max-w-[720px] overflow-y-auto border-l border-[#D8E0EF] bg-[#F4F6FB] shadow-[0px_24px_80px_rgba(4,11,55,0.22)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#D8E0EF] bg-white/95 p-5 backdrop-blur">
          <div>
            <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] ${statusClass(application.status)}`}>
              {statusLabel(application.status)}
            </span>
            <h2 className="mt-3 text-[24px] font-black tracking-[-0.04em] text-[#040B37]">
              Review mentorship application
            </h2>
            <p className="mt-1 text-[13px] font-semibold text-[#9CA3AF]">
              Submitted {submittedLabel(application.submittedAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#D8E0EF] bg-white text-[#4B5563] transition hover:border-[#1C4ED1] hover:text-[#1C4ED1]"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <section className="rounded-[20px] border border-[#D8E0EF] bg-white p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <ApplicationAvatar application={application} />
              <div className="min-w-0 flex-1">
                <h3 className="text-[18px] font-black text-[#040B37]">{displayName(application.instructor)}</h3>
                <p className="mt-1 text-[13px] font-semibold text-[#9CA3AF]">
                  {application.instructor.headline || application.instructor.email}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <ReadinessPill label="Verified" ok={application.instructor.instructorVerificationStatus === "VERIFIED"} />
                  <ReadinessPill label="Topics" ok={application.topics.length > 0} />
                  <ReadinessPill label="Availability" ok={application.instructor.activeAvailability > 0} />
                  <ReadinessPill label="Payout" ok={application.instructor.payoutSetup} />
                </div>
              </div>
              {application.instructor.publicProfileSlug && (
                <Link
                  href={`/instructor/${application.instructor.publicProfileSlug}`}
                  target="_blank"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-[#D8E0EF] text-[#1C4ED1] transition hover:border-[#1C4ED1]"
                >
                  <ExternalLink size={16} strokeWidth={2} />
                </Link>
              )}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[18px] border border-[#D8E0EF] bg-white p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[#9CA3AF]">Session pricing</p>
              <p className="mt-2 text-[18px] font-black text-[#040B37]">{applicationPriceLabel(application)}</p>
            </div>
            <div className="rounded-[18px] border border-[#D8E0EF] bg-white p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[#9CA3AF]">Platform history</p>
              <p className="mt-2 text-[13px] font-bold text-[#040B37]">
                {application.instructor._count.taughtCourses} courses / {application.instructor._count.mentorBookings} bookings
              </p>
            </div>
          </section>

          <section className="rounded-[20px] border border-[#D8E0EF] bg-white p-5 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[#9CA3AF]">Mentorship pitch</p>
            <p className="mt-2 text-[14px] font-semibold leading-relaxed text-[#4B5563]">
              {application.pitch || "No pitch provided."}
            </p>
            {application.audience && (
              <>
                <p className="mt-5 text-[11px] font-black uppercase tracking-[0.08em] text-[#9CA3AF]">Best for</p>
                <p className="mt-2 text-[14px] font-semibold leading-relaxed text-[#4B5563]">{application.audience}</p>
              </>
            )}
            {application.instructions && (
              <>
                <p className="mt-5 text-[11px] font-black uppercase tracking-[0.08em] text-[#9CA3AF]">Booking instructions</p>
                <p className="mt-2 text-[14px] font-semibold leading-relaxed text-[#4B5563]">{application.instructions}</p>
              </>
            )}
          </section>

          {application.reviewNote && (
            <section className="rounded-[18px] border border-amber-100 bg-amber-50 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.08em] text-amber-700">Previous admin feedback</p>
              <p className="mt-2 text-[13px] font-semibold leading-relaxed text-[#4B5563]">{application.reviewNote}</p>
            </section>
          )}

          <section className="rounded-[20px] border border-[#D8E0EF] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-[18px] font-black text-[#040B37]">Decision</h3>
                <p className="mt-1 text-[12px] font-semibold text-[#9CA3AF]">
                  Approval grants eligibility. The mentor still controls public availability.
                </p>
              </div>
            </div>

            {isReviewable ? (
              <>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {[
                    { value: "approve", label: "Approve" },
                    { value: "changes", label: "Request changes" },
                    { value: "reject", label: "Reject" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setDecision(option.value as "approve" | "changes" | "reject")}
                      className={`h-11 rounded-[10px] border px-4 text-[13px] font-black transition ${
                        decision === option.value
                          ? option.value === "reject"
                            ? "border-red-200 bg-red-50 text-red-600"
                            : "border-[#1C4ED1] bg-[#1C4ED1]/5 text-[#1C4ED1]"
                          : "border-[#D8E0EF] bg-white text-[#4B5563] hover:border-[#1C4ED1]"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {decision !== "approve" && (
                  <label className="mt-4 block">
                    <span className="text-[13px] font-bold text-[#040B37]">
                      {decision === "changes" ? "Feedback for requested changes" : "Reason for rejection"}
                    </span>
                    <textarea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder={decision === "changes" ? "Tell the instructor what to improve before resubmitting." : "Explain why CSCN cannot approve this mentor application now."}
                      className={`mt-2 min-h-[110px] w-full rounded-[10px] border bg-white px-4 py-3 text-[14px] font-semibold text-[#040B37] outline-none transition ${
                        decision === "reject" ? "border-red-100 focus:border-red-300" : "border-[#D8E0EF] focus:border-[#1C4ED1]"
                      }`}
                    />
                  </label>
                )}

                <Button
                  type="button"
                  variant={decision === "reject" ? "outline" : "primary"}
                  rounded="md"
                  loading={pending}
                  disabled={!canManageMentorship || pending}
                  onClick={runDecision}
                  className={`mt-4 w-full ${decision === "reject" ? "border-red-200 text-red-600 hover:border-red-300 hover:text-red-700" : ""}`}
                >
                  {decision === "approve" ? "Approve mentor" : decision === "changes" ? "Send change request" : "Reject application"}
                </Button>
              </>
            ) : (
              <div className="mt-4 rounded-[14px] border border-[#E3E8F4] bg-[#F8FAFC] p-4 text-[13px] font-semibold text-[#4B5563]">
                This application has already been {statusLabel(application.status)}. It is kept here for review history.
              </div>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
}

export function AdminMentorshipConsole({ data, canManageMentorship }: Props) {
  const [activeTab, setActiveTab] = useState<(typeof APPLICATION_TABS)[number]["value"]>("PENDING");
  const [selectedApplication, setSelectedApplication] = useState<MentorshipApplication | null>(null);

  const applicationCounts = useMemo(() => {
    return APPLICATION_TABS.reduce<Record<string, number>>((acc, tab) => {
      acc[tab.value] = data.applications.filter((application) => application.status === tab.value).length;
      return acc;
    }, {});
  }, [data.applications]);

  const filteredApplications = data.applications.filter((application) => application.status === activeTab);

  return (
    <div className="mx-auto flex w-full max-w-[1728px] flex-col gap-6 p-[clamp(16px,2.78vw,48px)] pb-28 font-jakarta">
      <section className="overflow-hidden rounded-[26px] border border-[#D8E0EF] bg-[#040B37] text-white shadow-[0px_22px_70px_rgba(4,11,55,0.16)]">
        <div className="relative p-6 md:p-8">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-[#1C4ED1]/35 blur-3xl" />
          <div className="relative mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <h1 className="max-w-[760px] text-[32px] font-black leading-[1.02] tracking-[-0.05em] md:text-[46px]">
                Govern trust before learners book time with mentors.
              </h1>
              <p className="mt-4 max-w-[760px] text-[15px] font-semibold leading-relaxed text-white/68 md:text-[16px]">
                This console keeps mentorship separate from instructor management: admins review applications, watch booking health,
                and intervene when mentor quality or trust needs attention.
              </p>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-white/10 p-4">
              <p className="text-[12px] font-black uppercase tracking-[0.12em] text-white/55">Booking mix</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-[14px] bg-white/10 p-3">
                  <p className="text-[24px] font-black leading-none">{data.bookingMix.total}</p>
                  <p className="mt-1 text-[11px] font-bold text-white/58">Total bookings</p>
                </div>
                <div className="rounded-[14px] bg-white/10 p-3">
                  <p className="text-[24px] font-black leading-none">{data.bookingMix.paid}</p>
                  <p className="mt-1 text-[11px] font-bold text-white/58">Paid sessions</p>
                </div>
                <div className="rounded-[14px] bg-white/10 p-3">
                  <p className="text-[24px] font-black leading-none">{data.bookingMix.free}</p>
                  <p className="mt-1 text-[11px] font-bold text-white/58">Free sessions</p>
                </div>
                <div className="rounded-[14px] bg-white/10 p-3">
                  <p className="text-[24px] font-black leading-none">{data.bookingMix.pending}</p>
                  <p className="mt-1 text-[11px] font-bold text-white/58">Payment holds</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {data.stats.map((stat, index) => {
          const Icon = [ShieldCheck, UsersRound, CalendarClock, Sparkles][index] ?? ShieldCheck;
          return (
            <div key={stat.label} className="rounded-[18px] border border-[#D8E0EF] bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <p className="text-[14px] font-bold text-[#9CA3AF]">{stat.label}</p>
                <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#1C4ED1]/5 text-[#1C4ED1]">
                  <Icon size={20} strokeWidth={1.9} />
                </span>
              </div>
              <p className="mt-7 text-[32px] font-black leading-none tracking-[-0.04em] text-[#040B37]">{stat.value}</p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-[22px] border border-[#D8E0EF] bg-[#F8FAFC] p-4 shadow-sm lg:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-[22px] font-black tracking-[-0.04em] text-[#040B37]">Mentorship applications</h2>
              <p className="mt-1 text-[13px] font-semibold text-[#9CA3AF]">
                Review submissions in a focused drawer. Approved and rejected decisions stay available as quiet history.
              </p>
            </div>
            <Link href="/dashboard/admin/instructors?tab=verified" className="text-[13px] font-black text-[#1C4ED1] hover:underline">
              Review instructors
            </Link>
          </div>

          <div className="mt-5 overflow-x-auto rounded-[14px] bg-[#1C4ED1]/5 p-1">
            <div className="flex min-w-max gap-1">
              {APPLICATION_TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveTab(tab.value)}
                  className={`rounded-[10px] px-4 py-2 text-[12px] font-black transition ${
                    activeTab === tab.value
                      ? "bg-white text-[#1C4ED1] shadow-sm"
                      : "text-[#9CA3AF] hover:text-[#040B37]"
                  }`}
                >
                  {tab.label} <span className="ml-1 rounded-full bg-[#F4F6FB] px-1.5 py-0.5 text-[10px]">{applicationCounts[tab.value] ?? 0}</span>
                </button>
              ))}
            </div>
          </div>

          {filteredApplications.length === 0 ? (
            <div className="mt-5 rounded-[16px] border border-dashed border-[#D8E0EF] bg-white px-4 py-10 text-center">
              <ShieldCheck className="mx-auto text-[#1C4ED1]" size={34} strokeWidth={1.8} />
              <p className="mt-3 text-[14px] font-black text-[#040B37]">No {APPLICATION_TABS.find((tab) => tab.value === activeTab)?.label.toLowerCase()} applications</p>
              <p className="mt-1 text-[12px] font-semibold text-[#9CA3AF]">Mentorship applications will move here automatically as admin decisions are made.</p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {filteredApplications.map((application) => (
                <ApplicationRow
                  key={application.id}
                  application={application}
                  onReview={setSelectedApplication}
                />
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[22px] border border-[#D8E0EF] bg-white p-5 shadow-sm lg:p-6">
          <h2 className="text-[22px] font-black tracking-[-0.04em] text-[#040B37]">Needs attention</h2>
          <p className="mt-1 text-[13px] font-semibold text-[#9CA3AF]">Quality signals before this becomes a full disputes/no-show system.</p>
          <div className="mt-5 space-y-3">
            {data.issues.map((issue) => (
              <div key={issue.label} className="rounded-[16px] border border-[#E3E8F4] bg-[#F8FAFC] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-black text-[#040B37]">{issue.label}</p>
                    <p className="mt-1 text-[12px] font-semibold leading-relaxed text-[#9CA3AF]">{issue.description}</p>
                  </div>
                  <IssueTone tone={issue.tone} />
                </div>
                <p className="mt-4 text-[30px] font-black leading-none text-[#040B37]">{issue.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[22px] border border-[#D8E0EF] bg-white p-5 shadow-sm lg:p-6">
          <h2 className="text-[22px] font-black tracking-[-0.04em] text-[#040B37]">Active mentors</h2>
          <p className="mt-1 text-[13px] font-semibold text-[#9CA3AF]">Mentors approved for the marketplace, whether currently open or paused.</p>
          <div className="mt-5 space-y-3">
            {data.activeMentors.length === 0 ? (
              <div className="rounded-[16px] border border-dashed border-[#D8E0EF] bg-[#F8FAFC] px-4 py-8 text-center text-[13px] font-bold text-[#9CA3AF]">
                No mentorship-eligible instructors yet.
              </div>
            ) : (
              data.activeMentors.map((mentor) => (
                <article key={mentor.id} className="rounded-[16px] border border-[#E3E8F4] bg-[#F8FAFC] p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[14px] font-black text-[#040B37]">{displayName(mentor)}</p>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${mentor.mentorshipEnabled ? "bg-emerald-50 text-emerald-700" : "bg-[#F4F6FB] text-[#4B5563]"}`}>
                          {mentor.mentorshipEnabled ? "Open" : "Paused"}
                        </span>
                      </div>
                      <p className="mt-1 text-[12px] font-semibold text-[#9CA3AF]">{mentor.headline || mentor.email}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black text-[#4B5563]">
                        <span className="rounded-full bg-white px-2.5 py-1">{mentor.activeAvailability} active windows</span>
                        <span className="rounded-full bg-white px-2.5 py-1">{mentor.bookings} bookings</span>
                        <span className="rounded-full bg-white px-2.5 py-1">{mentor.paid} paid</span>
                        <span className="rounded-full bg-white px-2.5 py-1">{moneyLabel(mentor.mentorshipPrice, mentor.mentorshipCurrency)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.08em] text-[#9CA3AF]">Eligibility</p>
                        <InstructorMentorshipToggle
                          instructorId={mentor.id}
                          enabled={mentor.mentorshipEligible}
                          disabled={!canManageMentorship}
                        />
                      </div>
                      <Link
                        href={`/dashboard/admin/instructors?q=${encodeURIComponent(mentor.email)}`}
                        className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#D8E0EF] bg-white text-[#1C4ED1] transition hover:border-[#1C4ED1]"
                        aria-label={`Open ${displayName(mentor)} in instructors`}
                      >
                        <ExternalLink size={16} strokeWidth={1.9} />
                      </Link>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[22px] border border-[#D8E0EF] bg-white p-5 shadow-sm lg:p-6">
          <h2 className="text-[22px] font-black tracking-[-0.04em] text-[#040B37]">Bookings</h2>
          <p className="mt-1 text-[13px] font-semibold text-[#9CA3AF]">Upcoming and recent mentorship sessions across the platform.</p>
          <div className="mt-5 space-y-3">
            {data.recentBookings.length === 0 ? (
              <div className="rounded-[16px] border border-dashed border-[#D8E0EF] bg-[#F8FAFC] px-4 py-8 text-center text-[13px] font-bold text-[#9CA3AF]">
                No mentorship bookings yet.
              </div>
            ) : (
              data.recentBookings.map((booking) => (
                <article key={booking.id} className="rounded-[16px] border border-[#E3E8F4] bg-[#F8FAFC] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[14px] font-black text-[#040B37]">{booking.topic || "Mentorship session"}</p>
                      <p className="mt-1 text-[12px] font-semibold text-[#9CA3AF]">
                        {displayName(booking.student ?? { name: null, email: "Learner" })} with {displayName(booking.mentor)}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#1C4ED1]/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#1C4ED1]">
                      {booking.status}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black text-[#4B5563]">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1">
                      <CalendarClock size={13} strokeWidth={1.9} className="text-[#1C4ED1]" />
                      {dateLabel(booking.startsAt, booking.timezone)}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1">
                      <WalletCards size={13} strokeWidth={1.9} className="text-[#1C4ED1]" />
                      {moneyLabel(booking.price, booking.currency)}
                    </span>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      {selectedApplication && (
        <ReviewDrawer
          application={selectedApplication}
          canManageMentorship={canManageMentorship}
          onClose={() => setSelectedApplication(null)}
        />
      )}
    </div>
  );
}
