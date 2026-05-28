"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  MessageSquareWarning,
  PlayCircle,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { ReviewStatus } from "@prisma/client";

import {
  approvePricingProposalAction,
  rejectPricingProposalAction,
  reviewCourseAction,
} from "@/actions/admin-courses";
import Button from "@/components/ui/Button";

type ReviewCourse = {
  id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  promoVideo?: string | null;
  status: string;
  price: unknown;
  baseCurrency?: string;
  category?: { name: string } | null;
  _count?: { enrollments: number };
  instructor?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    payoutSetup: boolean;
    payoutDetails: unknown;
  } | null;
  pricingProposals?: {
    id: string;
    proposedPrice: unknown;
    currentPriceSnapshot: unknown;
    currency: string;
    status: string;
    adminNote: string | null;
    createdAt: Date | string;
    reviewedAt: Date | string | null;
    submittedBy?: { name: string | null; email: string };
  }[];
  modules: {
    id: string;
    title: string;
    isPublished: boolean;
    lessons: { id: string; isPublished: boolean }[];
  }[];
};

interface Props {
  course: ReviewCourse;
  permissions: {
    canReviewCourses: boolean;
    canPublishCourses: boolean;
    canManageBilling: boolean;
  };
}

function formatPrice(value: unknown, currency = "NGN") {
  if (value === null || value === undefined) return "Free";
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "Free";
  return `${currency.toUpperCase()} ${amount.toLocaleString()}`;
}

function payoutReady(course: ReviewCourse) {
  const details = (course.instructor?.payoutDetails || {}) as {
    payoutCountry?: unknown;
    preferredCurrency?: unknown;
  };
  return Boolean(course.instructor?.payoutSetup && details.payoutCountry && details.preferredCurrency);
}

function CheckItem({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <div className={`rounded-[12px] border px-4 py-3 ${ok ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
      <div className="flex items-start gap-2.5">
        {ok ? <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-600" /> : <AlertTriangle size={17} className="mt-0.5 shrink-0 text-amber-600" />}
        <div>
          <p className={`text-[13px] font-black ${ok ? "text-emerald-800" : "text-amber-800"}`}>{label}</p>
          <p className={`mt-0.5 text-[12px] font-semibold ${ok ? "text-emerald-700/75" : "text-amber-700/75"}`}>{detail}</p>
        </div>
      </div>
    </div>
  );
}

export function AdminCourseApprovalWorkspace({ course, permissions }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [pricingRejectOpen, setPricingRejectOpen] = useState(false);
  const [pricingNote, setPricingNote] = useState("");
  const pendingPricing = course.pricingProposals?.find((proposal) => proposal.status === "PENDING") ?? null;
  const currency = pendingPricing?.currency ?? course.baseCurrency ?? "NGN";
  const publishedModules = course.modules.filter((module) => module.isPublished);
  const publishedLessons = course.modules.flatMap((module) => module.lessons).filter((lesson) => lesson.isPublished);
  const isPaid = Number(course.price ?? pendingPricing?.proposedPrice ?? 0) > 0;

  const checklist = useMemo(
    () => [
      { ok: Boolean(course.thumbnail), label: "Thumbnail", detail: course.thumbnail ? "Launch image is present." : "A course thumbnail is required before publishing." },
      { ok: Boolean(course.promoVideo), label: "Trailer", detail: course.promoVideo ? "Course trailer is present." : "A trailer builds trust and is required before publishing." },
      { ok: publishedModules.length > 0, label: "Published module", detail: publishedModules.length > 0 ? `${publishedModules.length} module(s) published.` : "Publish at least one module before approval." },
      { ok: publishedLessons.length > 0, label: "Published lesson", detail: publishedLessons.length > 0 ? `${publishedLessons.length} lesson(s) published.` : "Publish at least one lesson before approval." },
      { ok: !isPaid || payoutReady(course), label: "Payout readiness", detail: !isPaid ? "Free course, payout is not required." : payoutReady(course) ? "Instructor payout details are ready." : "Paid courses need payout region and currency before publishing." },
      { ok: !pendingPricing, label: "Pricing resolved", detail: pendingPricing ? "Resolve the pending price before publishing." : "No pending price review blocks publishing." },
    ],
    [course, isPaid, pendingPricing, publishedLessons.length, publishedModules.length]
  );

  const canPublishNow = checklist.every((item) => item.ok) && course.status === "PENDING_REVIEW";

  const submitReview = (status: ReviewStatus) => {
    startTransition(async () => {
      const res = await reviewCourseAction(course.id, status, reviewNote);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(status === "APPROVED" ? "Course approved and published." : status === "REJECTED" ? "Course rejected." : "Changes requested.");
      setReviewStatus(null);
      setReviewNote("");
      router.refresh();
    });
  };

  const approvePricing = () => {
    if (!pendingPricing) return;
    startTransition(async () => {
      const res = await approvePricingProposalAction(pendingPricing.id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Pricing approved.");
      router.refresh();
    });
  };

  const rejectPricing = () => {
    if (!pendingPricing) return;
    startTransition(async () => {
      const res = await rejectPricingProposalAction(pendingPricing.id, pricingNote);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Pricing rejected.");
      setPricingRejectOpen(false);
      setPricingNote("");
      router.refresh();
    });
  };

  return (
    <section className="mx-auto w-full max-w-[1728px] space-y-5 bg-background px-6 pt-6 font-jakarta lg:px-8">
      <div className="overflow-hidden rounded-[20px] border border-[#E3E8F4] bg-white shadow-sm">
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row">
              <div className="relative h-[150px] w-full shrink-0 overflow-hidden rounded-[16px] bg-[#F4F6FB] lg:w-[240px]">
                {course.thumbnail ? (
                  <Image src={course.thumbnail} alt={course.title} fill className="object-cover" unoptimized />
                ) : (
                  <div className="flex h-full items-center justify-center bg-[#1C4ED1]/5 text-[#1C4ED1]">
                    <BookOpen size={34} />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#1C4ED1]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-[#1C4ED1]">
                    Course governance
                  </span>
                  <span className="rounded-full bg-[#F4F6FB] px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-[#4B5563]">
                    {course.status.replace("_", " ")}
                  </span>
                  {pendingPricing && (
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-amber-700">
                      Pricing pending
                    </span>
                  )}
                </div>
                <h1 className="text-[24px] font-black leading-tight tracking-[-0.04em] text-[#040B37] md:text-[30px]">
                  {course.title}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] font-bold text-[#9CA3AF]">
                  <span>{course.category?.name ?? "Uncategorized"}</span>
                  <span>{course.modules.length} modules</span>
                  <span>{publishedLessons.length} published lessons</span>
                  <span>{course._count?.enrollments ?? 0} enrollments</span>
                  <span>{formatPrice(course.price, course.baseCurrency)}</span>
                </div>
                {course.instructor && (
                  <div className="mt-4 flex items-center gap-3 rounded-[14px] border border-[#E3E8F4] bg-[#F8FAFF] p-3">
                    <div className="relative h-10 w-10 overflow-hidden rounded-full bg-[#1C4ED1]/10">
                      {course.instructor.image ? (
                        <Image src={course.instructor.image} alt={course.instructor.name ?? "Instructor"} fill className="object-cover" unoptimized />
                      ) : (
                        <span className="flex h-full items-center justify-center text-sm font-black text-[#1C4ED1]">
                          {(course.instructor.name ?? course.instructor.email).charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-black text-[#040B37]">{course.instructor.name ?? "Instructor"}</p>
                      <p className="truncate text-[12px] font-semibold text-[#9CA3AF]">{course.instructor.email}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {checklist.map((item) => (
                <CheckItem key={item.label} {...item} />
              ))}
            </div>
          </div>

          <aside className="border-t border-[#E3E8F4] bg-[#F8FAFF] p-5 sm:p-6 xl:border-l xl:border-t-0">
            <div className="space-y-4">
              <div className="rounded-[16px] border border-[#E3E8F4] bg-white p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-1 text-[#1C4ED1]" size={20} />
                  <div>
                    <h2 className="text-[16px] font-black text-[#040B37]">Approval decision</h2>
                    <p className="mt-1 text-[12px] font-semibold leading-relaxed text-[#9CA3AF]">
                      Review content quality separately from publishing. Publishing requires the readiness checklist and publish permission.
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    rounded="[10px]"
                    hasBorder={false}
                    disabled={!permissions.canPublishCourses || !canPublishNow || pending}
                    loading={pending && reviewStatus === "APPROVED"}
                    leftIcon={<CheckCircle2 size={15} />}
                    onClick={() => setReviewStatus("APPROVED")}
                  >
                    Approve & Publish
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    rounded="[10px]"
                    disabled={!permissions.canReviewCourses || course.status !== "PENDING_REVIEW" || pending}
                    leftIcon={<MessageSquareWarning size={15} />}
                    onClick={() => setReviewStatus("CHANGES_REQUESTED")}
                  >
                    Request Changes
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    rounded="[10px]"
                    disabled={!permissions.canReviewCourses || course.status !== "PENDING_REVIEW" || pending}
                    leftIcon={<XCircle size={15} />}
                    onClick={() => setReviewStatus("REJECTED")}
                    className="text-red-600 hover:border-red-300 hover:text-red-600"
                  >
                    Reject
                  </Button>
                </div>
                {!canPublishNow && course.status === "PENDING_REVIEW" && (
                  <p className="mt-3 text-[11px] font-bold text-amber-700">
                    Publishing is locked until all readiness checks pass.
                  </p>
                )}
              </div>

              {pendingPricing && (
                <div className="rounded-[16px] border border-[#E3E8F4] bg-white p-4">
                  <div className="flex items-start gap-3">
                    <CreditCard className="mt-1 text-[#1C4ED1]" size={20} />
                    <div>
                      <h2 className="text-[16px] font-black text-[#040B37]">Pricing review</h2>
                      <p className="mt-1 text-[12px] font-semibold text-[#9CA3AF]">
                        Current: <span className="text-[#040B37]">{formatPrice(pendingPricing.currentPriceSnapshot, currency)}</span> · Proposed:{" "}
                        <span className="text-[#040B37]">{formatPrice(pendingPricing.proposedPrice, currency)}</span>
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      rounded="[10px]"
                      disabled={!permissions.canManageBilling || pending}
                      loading={pending && !pricingRejectOpen}
                      leftIcon={<CheckCircle2 size={15} />}
                      onClick={approvePricing}
                    >
                      Approve Price
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      rounded="[10px]"
                      disabled={!permissions.canManageBilling || pending}
                      leftIcon={<XCircle size={15} />}
                      onClick={() => setPricingRejectOpen((value) => !value)}
                      className="text-red-600 hover:border-red-300 hover:text-red-600"
                    >
                      Reject Price
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/courses/${course.slug}${course.status === "PUBLISHED" ? "" : "?preview=true"}`}
                  target="_blank"
                  className="inline-flex items-center gap-2 rounded-[10px] border border-[#E3E8F4] bg-white px-4 py-2 text-[13px] font-bold text-[#040B37] transition hover:border-[#1C4ED1] hover:text-[#1C4ED1]"
                >
                  <ExternalLink size={14} /> Preview course
                </Link>
                {course.promoVideo && (
                  <Link
                    href={course.promoVideo}
                    target="_blank"
                    className="inline-flex items-center gap-2 rounded-[10px] border border-[#E3E8F4] bg-white px-4 py-2 text-[13px] font-bold text-[#040B37] transition hover:border-[#1C4ED1] hover:text-[#1C4ED1]"
                  >
                    <PlayCircle size={14} /> Open trailer
                  </Link>
                )}
              </div>
            </div>
          </aside>
        </div>

        {(reviewStatus || pricingRejectOpen) && (
          <div className="border-t border-[#E3E8F4] bg-white p-5 sm:p-6">
            {reviewStatus && (
              <div className="space-y-3">
                <label className="text-[12px] font-black uppercase tracking-[0.1em] text-[#040B37]">
                  {reviewStatus === "APPROVED" ? "Optional publishing note" : "Feedback for instructor"}
                </label>
                <textarea
                  value={reviewNote}
                  onChange={(event) => setReviewNote(event.target.value)}
                  rows={3}
                  placeholder={reviewStatus === "APPROVED" ? "Optional note after approval." : "Tell the instructor exactly what to fix and why."}
                  className="w-full resize-none rounded-[12px] border border-[#E3E8F4] bg-[#F8FAFF] px-4 py-3 text-[14px] font-semibold text-[#040B37] outline-none transition focus:border-[#1C4ED1] focus:ring-2 focus:ring-[#1C4ED1]/10"
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" rounded="[10px]" disabled={pending} onClick={() => setReviewStatus(null)}>
                    Cancel
                  </Button>
                  <Button type="button" size="sm" rounded="[10px]" disabled={pending} loading={pending} onClick={() => submitReview(reviewStatus)}>
                    Confirm decision
                  </Button>
                </div>
              </div>
            )}

            {pricingRejectOpen && (
              <div className="space-y-3">
                <label className="text-[12px] font-black uppercase tracking-[0.1em] text-[#040B37]">Pricing rejection note</label>
                <textarea
                  value={pricingNote}
                  onChange={(event) => setPricingNote(event.target.value)}
                  rows={3}
                  placeholder="Explain what price or justification you need before approval."
                  className="w-full resize-none rounded-[12px] border border-[#E3E8F4] bg-[#F8FAFF] px-4 py-3 text-[14px] font-semibold text-[#040B37] outline-none transition focus:border-[#1C4ED1] focus:ring-2 focus:ring-[#1C4ED1]/10"
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" rounded="[10px]" disabled={pending} onClick={() => setPricingRejectOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="button" size="sm" rounded="[10px]" disabled={pending} loading={pending} onClick={rejectPricing} className="bg-red-600 hover:bg-red-700">
                    Reject pricing
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
