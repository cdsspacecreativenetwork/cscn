"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Archive, CalendarClock, ExternalLink, Megaphone, Pencil, Plus, Send, Users } from "lucide-react";
import { toast } from "sonner";

import {
  archiveAnnouncementAction,
  createAnnouncementAction,
  updateAnnouncementAction,
} from "@/actions/admin-announcements";
import type { AdminAnnouncementRow } from "@/data/announcements";
import Button from "@/components/ui/Button";
import { CustomSelect } from "@/components/ui/CustomSelect";

type AnnouncementAudienceValue = "ALL" | "STUDENTS" | "INSTRUCTORS" | "ADMINS";
type AnnouncementStatusValue = "DRAFT" | "PUBLISHED" | "ARCHIVED";

type FormState = {
  id?: string;
  title: string;
  body: string;
  audience: AnnouncementAudienceValue;
  status: AnnouncementStatusValue;
  priority: number;
  linkUrl: string;
  publishedAt: string;
  expiresAt: string;
};

interface Props {
  announcements: AdminAnnouncementRow[];
}

const emptyForm: FormState = {
  title: "",
  body: "",
  audience: "ALL",
  status: "DRAFT",
  priority: 0,
  linkUrl: "",
  publishedAt: "",
  expiresAt: "",
};

const audienceOptions = [
  { value: "ALL", label: "Everyone" },
  { value: "STUDENTS", label: "Students" },
  { value: "INSTRUCTORS", label: "Instructors" },
  { value: "ADMINS", label: "Admins" },
];

const statusOptions = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Publish / schedule" },
  { value: "ARCHIVED", label: "Archived" },
];

function toDatetimeLocal(value: Date | string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

function statusTone(status: AnnouncementStatusValue, publishedAt: Date | string | null) {
  if (status === "ARCHIVED") return "bg-[#F4F6FB] text-[#9CA3AF]";
  if (status === "DRAFT") return "bg-amber-50 text-amber-700";
  if (publishedAt && new Date(publishedAt) > new Date()) return "bg-[#1C4ED1]/10 text-[#1C4ED1]";
  return "bg-emerald-50 text-emerald-700";
}

function statusLabel(status: AnnouncementStatusValue, publishedAt: Date | string | null) {
  if (status === "PUBLISHED" && publishedAt && new Date(publishedAt) > new Date()) return "SCHEDULED";
  return status;
}

function formatDate(value: Date | string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function AdminAnnouncementsConsole({ announcements }: Props) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isOpen, setIsOpen] = useState(announcements.length === 0);
  const [pending, startTransition] = useTransition();
  const editing = Boolean(form.id);

  const resetForm = () => {
    setForm(emptyForm);
    setIsOpen(false);
  };

  const startEdit = (announcement: AdminAnnouncementRow) => {
    setForm({
      id: announcement.id,
      title: announcement.title,
      body: announcement.body,
      audience: announcement.audience,
      status: announcement.status,
      priority: announcement.priority,
      linkUrl: announcement.linkUrl ?? "",
      publishedAt: toDatetimeLocal(announcement.publishedAt),
      expiresAt: toDatetimeLocal(announcement.expiresAt),
    });
    setIsOpen(true);
  };

  const submit = () => {
    startTransition(async () => {
      const action = form.id
        ? updateAnnouncementAction(form.id, form)
        : createAnnouncementAction(form);
      const result = await action;
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(editing ? "Announcement updated." : "Announcement created.");
      resetForm();
    });
  };

  const archive = (id: string) => {
    startTransition(async () => {
      const result = await archiveAnnouncementAction(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Announcement archived.");
    });
  };

  const activeCount = announcements.filter((item) => item.status === "PUBLISHED").length;
  const scheduledCount = announcements.filter((item) => item.status === "PUBLISHED" && item.publishedAt && new Date(item.publishedAt) > new Date()).length;

  return (
    <div className="mx-auto max-w-[1728px] space-y-6 p-[clamp(16px,2.78vw,48px)] pb-28 font-jakarta">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#1C4ED1]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#1C4ED1]">
            <Megaphone size={13} /> Operations
          </p>
          <h1 className="text-[28px] font-black tracking-[-0.04em] text-[#040B37] md:text-[34px]">Announcements</h1>
          <p className="mt-1 max-w-2xl text-[14px] font-medium leading-relaxed text-[#9CA3AF]">
            Editorial platform broadcasts for students, instructors, and admins. System notifications stay separate and event-driven.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          rounded="[10px]"
          hasBorder={false}
          leftIcon={<Plus size={16} />}
          onClick={() => {
            setForm(emptyForm);
            setIsOpen(true);
          }}
        >
          New announcement
        </Button>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Total broadcasts", value: announcements.length, icon: Megaphone },
          { label: "Published", value: activeCount, icon: Send },
          { label: "Scheduled", value: scheduledCount, icon: CalendarClock },
        ].map((item) => (
          <div key={item.label} className="flex min-h-[132px] flex-col gap-6 rounded-[12px] border border-[#E3E8F4] bg-white p-6">
            <div className="flex items-start justify-between">
              <p className="text-[16px] font-semibold text-[#9CA3AF]">{item.label}</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#F4F6FB] text-[#1C4ED1]">
                <item.icon size={20} />
              </div>
            </div>
            <p className="text-[34px] font-black leading-none text-[#040B37]">{item.value}</p>
          </div>
        ))}
      </section>

      {isOpen && (
        <section className="rounded-[18px] border border-[#E3E8F4] bg-white p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[20px] font-black tracking-[-0.03em] text-[#040B37]">
                {editing ? "Edit announcement" : "Create announcement"}
              </h2>
              <p className="mt-1 text-[13px] font-medium text-[#9CA3AF]">
                Publish now, keep as draft, or choose a future publish time to schedule it.
              </p>
            </div>
            <button type="button" onClick={resetForm} className="text-[13px] font-bold text-[#9CA3AF] hover:text-[#040B37]">
              Close
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-[13px] font-black text-[#040B37]">Title</span>
                <input
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Example: Live Q&A this Friday"
                  className="h-12 w-full rounded-[10px] border border-[#E3E8F4] bg-white px-4 text-[14px] font-semibold text-[#040B37] outline-none transition focus:border-[#1C4ED1] focus:ring-2 focus:ring-[#1C4ED1]/10"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-[13px] font-black text-[#040B37]">Message</span>
                <textarea
                  value={form.body}
                  onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
                  rows={5}
                  placeholder="Write the announcement students or instructors should see."
                  className="w-full resize-none rounded-[10px] border border-[#E3E8F4] bg-white px-4 py-3 text-[14px] font-semibold leading-relaxed text-[#040B37] outline-none transition focus:border-[#1C4ED1] focus:ring-2 focus:ring-[#1C4ED1]/10"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-[13px] font-black text-[#040B37]">Optional link</span>
                <input
                  value={form.linkUrl}
                  onChange={(event) => setForm((current) => ({ ...current, linkUrl: event.target.value }))}
                  placeholder="https://..."
                  className="h-12 w-full rounded-[10px] border border-[#E3E8F4] bg-white px-4 text-[14px] font-semibold text-[#040B37] outline-none transition focus:border-[#1C4ED1] focus:ring-2 focus:ring-[#1C4ED1]/10"
                />
              </label>
            </div>

            <div className="space-y-4 rounded-[16px] border border-[#E3E8F4] bg-[#F8FAFF] p-4">
              <div>
                <span className="mb-2 block text-[13px] font-black text-[#040B37]">Audience</span>
                <CustomSelect
                  value={form.audience}
                  options={audienceOptions}
                  onChange={(value) => setForm((current) => ({ ...current, audience: value as AnnouncementAudienceValue }))}
                />
              </div>
              <div>
                <span className="mb-2 block text-[13px] font-black text-[#040B37]">Status</span>
                <CustomSelect
                  value={form.status}
                  options={statusOptions}
                  onChange={(value) => setForm((current) => ({ ...current, status: value as AnnouncementStatusValue }))}
                />
              </div>
              <label className="block">
                <span className="mb-2 block text-[13px] font-black text-[#040B37]">Priority, 0-10</span>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={form.priority}
                  onChange={(event) => setForm((current) => ({ ...current, priority: Number(event.target.value) }))}
                  className="h-10 w-full rounded-[10px] border border-[#E3E8F4] bg-white px-4 text-[14px] font-semibold text-[#040B37] outline-none transition focus:border-[#1C4ED1] focus:ring-2 focus:ring-[#1C4ED1]/10"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-[13px] font-black text-[#040B37]">Publish time</span>
                <input
                  type="datetime-local"
                  value={form.publishedAt}
                  onChange={(event) => setForm((current) => ({ ...current, publishedAt: event.target.value }))}
                  className="h-10 w-full rounded-[10px] border border-[#E3E8F4] bg-white px-3 text-[13px] font-semibold text-[#040B37] outline-none transition focus:border-[#1C4ED1] focus:ring-2 focus:ring-[#1C4ED1]/10"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-[13px] font-black text-[#040B37]">Expiry time</span>
                <input
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(event) => setForm((current) => ({ ...current, expiresAt: event.target.value }))}
                  className="h-10 w-full rounded-[10px] border border-[#E3E8F4] bg-white px-3 text-[13px] font-semibold text-[#040B37] outline-none transition focus:border-[#1C4ED1] focus:ring-2 focus:ring-[#1C4ED1]/10"
                />
              </label>
              <Button
                type="button"
                size="sm"
                rounded="[10px]"
                hasBorder={false}
                loading={pending}
                disabled={pending}
                onClick={submit}
                className="w-full"
              >
                {editing ? "Save changes" : "Create announcement"}
              </Button>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-[18px] border border-[#E3E8F4] bg-white shadow-sm">
        <div className="border-b border-[#E3E8F4] p-5 sm:p-6">
          <h2 className="text-[20px] font-black tracking-[-0.03em] text-[#040B37]">Broadcast history</h2>
          <p className="mt-1 text-[13px] font-medium text-[#9CA3AF]">
            {announcements.length.toLocaleString()} announcements have been created.
          </p>
        </div>

        {announcements.length > 0 ? (
          <div className="admin-horizontal-scrollbar overflow-auto">
            <table className="w-full min-w-[1080px]">
              <thead className="bg-[#F8FAFF]">
                <tr className="border-b border-[#E3E8F4]">
                  <th className="px-6 py-3 text-left text-[12px] font-bold uppercase tracking-wider text-[#9CA3AF]">Announcement</th>
                  <th className="px-6 py-3 text-left text-[12px] font-bold uppercase tracking-wider text-[#9CA3AF]">Audience</th>
                  <th className="px-6 py-3 text-left text-[12px] font-bold uppercase tracking-wider text-[#9CA3AF]">Status</th>
                  <th className="px-6 py-3 text-left text-[12px] font-bold uppercase tracking-wider text-[#9CA3AF]">Timing</th>
                  <th className="px-6 py-3 text-left text-[12px] font-bold uppercase tracking-wider text-[#9CA3AF]">Owner</th>
                  <th className="px-6 py-3 text-right text-[12px] font-bold uppercase tracking-wider text-[#9CA3AF]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F6FB]">
                {announcements.map((announcement) => (
                  <tr key={announcement.id} className="transition hover:bg-[#F8FAFF]">
                    <td className="px-6 py-4">
                      <div className="max-w-[360px]">
                        <p className="whitespace-nowrap text-[14px] font-black text-[#040B37]">{announcement.title}</p>
                        <p className="mt-1 line-clamp-2 text-[12px] font-semibold leading-relaxed text-[#9CA3AF]">{announcement.body}</p>
                        {announcement.linkUrl && (
                          <Link href={announcement.linkUrl} target="_blank" className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold text-[#1C4ED1] hover:underline">
                            Open link <ExternalLink size={12} />
                          </Link>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-2 rounded-full bg-[#1C4ED1]/5 px-3 py-1 text-[12px] font-black text-[#1C4ED1]">
                        <Users size={13} /> {announcement.audience}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`rounded-full px-3 py-1 text-[11px] font-black ${statusTone(announcement.status, announcement.publishedAt)}`}>
                        {statusLabel(announcement.status, announcement.publishedAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-[12px] font-bold text-[#4B5563]">Publish: {formatDate(announcement.publishedAt)}</p>
                      <p className="mt-1 text-[12px] font-semibold text-[#9CA3AF]">Expire: {formatDate(announcement.expiresAt)}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-[13px] font-black text-[#4B5563]">{announcement.author?.name ?? "Admin"}</p>
                      <p className="mt-1 text-[11px] font-semibold text-[#9CA3AF]">{announcement.author?.email ?? "Unknown owner"}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(announcement)}
                          className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-[#E3E8F4] bg-white px-3 text-[12px] font-bold text-[#040B37] transition hover:border-[#1C4ED1] hover:text-[#1C4ED1]"
                        >
                          <Pencil size={13} /> Edit
                        </button>
                        {announcement.status !== "ARCHIVED" && (
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => archive(announcement.id)}
                            className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-red-100 bg-red-50 px-3 text-[12px] font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                          >
                            <Archive size={13} /> Archive
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="text-[15px] font-bold text-[#040B37]">No announcements yet</p>
            <p className="mt-1 text-[13px] font-medium text-[#9CA3AF]">Create the first broadcast when there is something worth surfacing.</p>
          </div>
        )}
      </section>
    </div>
  );
}
