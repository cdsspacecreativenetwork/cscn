"use client";

import { useState, useTransition } from "react";
import { Settings2 } from "lucide-react";
import { updateAdminPermissions, AdminPermissions } from "@/actions/admin";

interface AdminPermissionsEditorProps {
  userId: string;
  permissions: AdminPermissions;
}

const PERMISSION_LABELS: { key: keyof AdminPermissions; label: string }[] = [
  { key: "canManageUsers", label: "Manage Accounts" },
  { key: "canManageCourses", label: "Manage Courses" },
  { key: "canReviewCourses", label: "Review Courses" },
  { key: "canPublishCourses", label: "Publish Courses" },
  { key: "canManageLearners", label: "Manage Students" },
  { key: "canManageInstructors", label: "Manage Instructors" },
  { key: "canVerifyInstructors", label: "Verify Instructors" },
  { key: "canManageInvites", label: "Manage Invites" },
  { key: "canManageAnnouncements", label: "Announcements" },
  { key: "canManageBilling", label: "Manage Billing" },
  { key: "canManageMarketing", label: "Marketing" },
  { key: "canManagePermissions", label: "Permissions" },
  { key: "canViewAuditLogs", label: "Audit Logs" },
  { key: "canManageSettings", label: "Settings" },
  { key: "canViewAnalytics", label: "View Analytics" },
];

export function AdminPermissionsEditor({
  userId,
  permissions: initial,
}: AdminPermissionsEditorProps) {
  const [open, setOpen] = useState(false);
  const [perms, setPerms] = useState<AdminPermissions>(initial);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const toggle = (key: keyof AdminPermissions) => {
    const updated = { ...perms, [key]: !perms[key] };
    setPerms(updated);
    startTransition(async () => {
      const result = await updateAdminPermissions(userId, updated);
      if (result.success) {
        setFeedback("Saved");
      } else {
        setPerms(perms); // revert
        setFeedback(result.error ?? "Failed");
      }
      setTimeout(() => setFeedback(null), 2000);
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Manage permissions"
        className="p-1.5 rounded-[8px] border border-[#E3E8F4] bg-[#F4F6FB] text-[#9CA3AF] hover:border-[#1C4ED1] hover:text-[#1C4ED1] transition-all"
      >
        <Settings2 size={14} />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-50 max-h-[70vh] w-[260px] overflow-y-auto bg-white border border-[#E3E8F4] rounded-[12px] shadow-lg p-3 space-y-2">
          <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider px-1 pb-1 border-b border-[#F4F6FB]">
            Permissions
          </p>
          {PERMISSION_LABELS.map(({ key, label }) => (
            <label
              key={key}
              className="flex items-center justify-between gap-3 px-1 py-1 cursor-pointer group"
            >
              <span className="text-[13px] font-medium text-[#4B5563] group-hover:text-[#040B37] transition-colors">
                {label}
              </span>
              <button
                type="button"
                disabled={isPending}
                onClick={() => toggle(key)}
                className={`relative w-9 h-5 rounded-full transition-all disabled:opacity-50 shrink-0 ${
                  perms[key] ? "bg-[#1C4ED1]" : "bg-[#E3E8F4]"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                    perms[key] ? "left-[18px]" : "left-0.5"
                  }`}
                />
              </button>
            </label>
          ))}
          {feedback && (
            <p
              className={`text-[11px] font-semibold text-center pt-1 ${
                feedback === "Saved" ? "text-emerald-600" : "text-red-500"
              }`}
            >
              {feedback}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
