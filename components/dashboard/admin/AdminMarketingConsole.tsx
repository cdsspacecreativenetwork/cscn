"use client";

import { useState, useTransition } from "react";
import { ReviewPublishStatus } from "@prisma/client";
import { Eye, Megaphone, Plus, Save, Star } from "lucide-react";
import { toast } from "sonner";

import {
  createHomepageReviewAction,
  updateHomepageReviewStatusAction,
  updateMarketingSettingsAction,
} from "@/actions/marketing";
import Button from "@/components/ui/Button";
import type { MarketingSettings } from "@/data/marketing";

interface HomepageReviewRow {
  id: string;
  name: string;
  role: string | null;
  content: string;
  rating: number | null;
  status: ReviewPublishStatus;
  featured: boolean;
  updatedAt: Date | string;
}

interface Props {
  settings: MarketingSettings;
  reviews: HomepageReviewRow[];
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-[12px] border border-[#E3E8F4] bg-white p-4 text-left"
    >
      <span className="text-[14px] font-bold text-[#040B37]">{label}</span>
      <span className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-[#1C4ED1]" : "bg-[#CBD5E1]"}`}>
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${checked ? "left-6" : "left-1"}`} />
      </span>
    </button>
  );
}

export function AdminMarketingConsole({ settings, reviews }: Props) {
  const [form, setForm] = useState(settings);
  const [reviewForm, setReviewForm] = useState({
    name: "",
    role: "",
    avatarUrl: "",
    content: "",
    rating: 5,
    source: "",
    featured: true,
    status: ReviewPublishStatus.PUBLISHED,
  });
  const [pending, startTransition] = useTransition();

  const saveSettings = () => {
    startTransition(async () => {
      const result = await updateMarketingSettingsAction(form);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Marketing settings saved.");
    });
  };

  const createReview = () => {
    startTransition(async () => {
      const result = await createHomepageReviewAction(reviewForm);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Homepage review created.");
      setReviewForm({
        name: "",
        role: "",
        avatarUrl: "",
        content: "",
        rating: 5,
        source: "",
        featured: true,
        status: ReviewPublishStatus.PUBLISHED,
      });
    });
  };

  const setReviewStatus = (id: string, status: ReviewPublishStatus, featured: boolean) => {
    startTransition(async () => {
      const result = await updateHomepageReviewStatusAction(id, status, featured);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Review updated.");
    });
  };

  return (
    <div className="mx-auto max-w-[1728px] space-y-6 p-[clamp(16px,2.78vw,48px)] pb-28 font-jakarta">
      <div>
        {/* <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#1C4ED1]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#1C4ED1]">
          <Megaphone size={13} /> Marketing control
        </p> */}
        <h1 className="text-[28px] font-black tracking-[-0.04em] text-[#040B37] md:text-[34px]">Launch & Homepage</h1>
        <p className="mt-1 text-[14px] font-medium leading-relaxed text-[#9CA3AF]">
          Control launch mode, homepage course behavior, pioneer registration, and published homepage reviews without code changes.
        </p>
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-[18px] border border-[#E3E8F4] bg-white p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[20px] font-black tracking-[-0.03em] text-[#040B37]">Platform launch state</h2>
              <p className="mt-1 text-[13px] font-medium text-[#9CA3AF]">Homepage courses remain featured-only in every mode.</p>
            </div>
            <Button type="button" size="sm" rounded="[10px]" hasBorder={false} leftIcon={<Save size={16} />} loading={pending} disabled={pending} onClick={saveSettings}>
              Save
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Toggle label="Launch mode" checked={form.launchMode} onChange={(launchMode) => setForm((current) => ({ ...current, launchMode }))} />
            <Toggle label="Award Pioneer badge during launch" checked={form.pioneerBadgeEnabled} onChange={(pioneerBadgeEnabled) => setForm((current) => ({ ...current, pioneerBadgeEnabled }))} />
            <Toggle label="Show published homepage reviews" checked={form.homepageReviewsEnabled} onChange={(homepageReviewsEnabled) => setForm((current) => ({ ...current, homepageReviewsEnabled }))} />
            <div className="rounded-[12px] border border-[#E3E8F4] bg-[#F8FAFF] p-4">
              <p className="text-[12px] font-black uppercase tracking-[0.12em] text-[#9CA3AF]">Course mode</p>
              <p className="mt-1 text-[14px] font-bold text-[#040B37]">Featured published courses only</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-[13px] font-black text-[#040B37]">First course rollout date</span>
              <input
                type="date"
                value={form.firstCourseRolloutDate}
                onChange={(event) => setForm((current) => ({ ...current, firstCourseRolloutDate: event.target.value }))}
                className="h-12 w-full rounded-[10px] border border-[#E3E8F4] bg-white px-4 text-[14px] font-semibold text-[#040B37] outline-none focus:border-[#1C4ED1]"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-[13px] font-black text-[#040B37]">Launch CTA</span>
              <input
                value={form.launchCtaLabel}
                onChange={(event) => setForm((current) => ({ ...current, launchCtaLabel: event.target.value }))}
                className="h-12 w-full rounded-[10px] border border-[#E3E8F4] bg-white px-4 text-[14px] font-semibold text-[#040B37] outline-none focus:border-[#1C4ED1]"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="mb-2 block text-[13px] font-black text-[#040B37]">Launch headline</span>
              <input
                value={form.launchHeadline}
                onChange={(event) => setForm((current) => ({ ...current, launchHeadline: event.target.value }))}
                className="h-12 w-full rounded-[10px] border border-[#E3E8F4] bg-white px-4 text-[14px] font-semibold text-[#040B37] outline-none focus:border-[#1C4ED1]"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="mb-2 block text-[13px] font-black text-[#040B37]">Launch message</span>
              <textarea
                value={form.launchBody}
                rows={4}
                onChange={(event) => setForm((current) => ({ ...current, launchBody: event.target.value }))}
                className="w-full resize-none rounded-[10px] border border-[#E3E8F4] bg-white px-4 py-3 text-[14px] font-semibold leading-relaxed text-[#040B37] outline-none focus:border-[#1C4ED1]"
              />
            </label>
          </div>
        </div>

        <div className="rounded-[18px] border border-[#E3E8F4] bg-white p-5 sm:p-6">
          <h2 className="text-[20px] font-black tracking-[-0.03em] text-[#040B37]">Add homepage review</h2>
          <p className="mt-1 text-[13px] font-medium text-[#9CA3AF]">Only published and featured reviews render on the homepage.</p>
          <div className="mt-5 space-y-3">
            <input value={reviewForm.name} onChange={(event) => setReviewForm((current) => ({ ...current, name: event.target.value }))} placeholder="Reviewer name" className="h-11 w-full rounded-[10px] border border-[#E3E8F4] px-3 text-[14px] font-semibold outline-none focus:border-[#1C4ED1]" />
            <input value={reviewForm.role} onChange={(event) => setReviewForm((current) => ({ ...current, role: event.target.value }))} placeholder="Role / title" className="h-11 w-full rounded-[10px] border border-[#E3E8F4] px-3 text-[14px] font-semibold outline-none focus:border-[#1C4ED1]" />
            <input value={reviewForm.avatarUrl} onChange={(event) => setReviewForm((current) => ({ ...current, avatarUrl: event.target.value }))} placeholder="Avatar URL" className="h-11 w-full rounded-[10px] border border-[#E3E8F4] px-3 text-[14px] font-semibold outline-none focus:border-[#1C4ED1]" />
            <textarea value={reviewForm.content} onChange={(event) => setReviewForm((current) => ({ ...current, content: event.target.value }))} rows={4} placeholder="Review content" className="w-full resize-none rounded-[10px] border border-[#E3E8F4] px-3 py-2 text-[14px] font-semibold outline-none focus:border-[#1C4ED1]" />
            <Button type="button" size="sm" rounded="[10px]" hasBorder={false} leftIcon={<Plus size={16} />} loading={pending} disabled={pending} onClick={createReview} className="w-full">
              Add review
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-[18px] border border-[#E3E8F4] bg-white shadow-sm">
        <div className="border-b border-[#E3E8F4] p-5 sm:p-6">
          <h2 className="text-[20px] font-black tracking-[-0.03em] text-[#040B37]">Homepage reviews</h2>
          <p className="mt-1 text-[13px] font-medium text-[#9CA3AF]">{reviews.length.toLocaleString()} review records.</p>
        </div>
        {reviews.length > 0 ? (
          <div className="divide-y divide-[#F4F6FB]">
            {reviews.map((review) => (
              <div key={review.id} className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_280px] md:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[15px] font-black text-[#040B37]">{review.name}</p>
                    {review.role && <span className="text-[12px] font-bold text-[#9CA3AF]">{review.role}</span>}
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${review.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700" : review.status === "ARCHIVED" ? "bg-[#F4F6FB] text-[#9CA3AF]" : "bg-amber-50 text-amber-700"}`}>
                      {review.status}
                    </span>
                    {review.featured && <span className="inline-flex items-center gap-1 rounded-full bg-[#1C4ED1]/10 px-2.5 py-1 text-[11px] font-black text-[#1C4ED1]"><Star size={12} /> Featured</span>}
                  </div>
                  <p className="mt-2 line-clamp-2 text-[13px] font-medium leading-relaxed text-[#4B5563]">{review.content}</p>
                </div>
                <div className="flex flex-wrap gap-2 md:justify-end">
                  <button type="button" onClick={() => setReviewStatus(review.id, ReviewPublishStatus.PUBLISHED, true)} className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-[#E3E8F4] px-3 text-[12px] font-bold text-[#1C4ED1] hover:bg-[#F8FAFF]">
                    <Eye size={13} /> Publish
                  </button>
                  <button type="button" onClick={() => setReviewStatus(review.id, ReviewPublishStatus.PENDING, false)} className="inline-flex h-9 items-center rounded-[10px] border border-[#E3E8F4] px-3 text-[12px] font-bold text-[#4B5563] hover:bg-[#F8FAFF]">
                    Unfeature
                  </button>
                  <button type="button" onClick={() => setReviewStatus(review.id, ReviewPublishStatus.ARCHIVED, false)} className="inline-flex h-9 items-center rounded-[10px] border border-red-100 bg-red-50 px-3 text-[12px] font-bold text-red-600 hover:bg-red-100">
                    Archive
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-14 text-center">
            <p className="text-[15px] font-bold text-[#040B37]">No homepage reviews yet</p>
            <p className="mt-1 text-[13px] font-medium text-[#9CA3AF]">The homepage review section stays hidden until real reviews are published.</p>
          </div>
        )}
      </section>
    </div>
  );
}
