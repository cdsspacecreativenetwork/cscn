"use client";

import { useState, useTransition, useEffect } from "react";
import { X, Settings2, ShieldCheck } from "lucide-react";
import { updateAdminPermissions, AdminPermissions } from "@/actions/admin";
import { RoleBadge } from "./RoleBadge";

interface AdminPermissionsDrawerProps {
  userId: string;
  userName: string;
  permissions: AdminPermissions;
}

const PERMISSION_CONFIG: {
  key: keyof AdminPermissions;
  label: string;
  description: string;
}[] = [
  {
    key: "canManageUsers",
    label: "Manage Users",
    description: "View all accounts, change roles, deactivate users",
  },
  {
    key: "canManageCourses",
    label: "Manage Courses",
    description: "Edit, publish, unpublish, or delete any course",
  },
  {
    key: "canManageBilling",
    label: "Manage Billing",
    description: "View and manage subscription plans and payments",
  },
  {
    key: "canViewAnalytics",
    label: "View Analytics",
    description: "Access platform-wide revenue and enrollment data",
  },
];

export function AdminPermissionsDrawer({
  userId,
  userName,
  permissions: initial,
}: AdminPermissionsDrawerProps) {
  const [open, setOpen] = useState(false);
  const [perms, setPerms] = useState<AdminPermissions>(initial);
  const [isPending, startTransition] = useTransition();
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const toggle = (key: keyof AdminPermissions) => {
    const prev = perms[key];
    const updated = { ...perms, [key]: !prev };
    setPerms(updated);
    setError(null);
    startTransition(async () => {
      const result = await updateAdminPermissions(userId, updated);
      if (result.success) {
        setSavedKey(key);
        setTimeout(() => setSavedKey(null), 1800);
      } else {
        setPerms({ ...updated, [key]: prev }); // revert
        setError(result.error ?? "Failed to save");
      }
    });
  };

  const enabledCount = Object.values(perms).filter(Boolean).length;

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        title="Manage permissions"
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] border border-[#E3E8F4] bg-[#F4F6FB] text-[#9CA3AF] hover:border-[#1C4ED1] hover:text-[#1C4ED1] hover:bg-white transition-all text-[12px] font-medium"
      >
        <Settings2 size={13} />
        <span>{enabledCount}/4</span>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[100] transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-[380px] max-w-[90vw] bg-white shadow-2xl z-[101] flex flex-col transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="px-6 py-5 border-b border-[#E3E8F4] flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#1C4ED1]" />
              <h2 className="text-[16px] font-bold text-[#040B37]">
                Admin Permissions
              </h2>
            </div>
            <div className="flex items-center gap-2.5">
              <p className="text-[14px] font-semibold text-[#4B5563]">{userName}</p>
              <RoleBadge role="ADMIN" />
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-2 rounded-[8px] text-[#9CA3AF] hover:bg-[#F4F6FB] hover:text-[#040B37] transition-all shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Permission list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          <p className="text-[12px] text-[#9CA3AF] font-medium pb-1">
            Toggle the permissions this admin has access to.
          </p>

          {PERMISSION_CONFIG.map(({ key, label, description }) => (
            <div
              key={key}
              className={`flex items-center justify-between gap-4 p-4 rounded-[12px] border transition-all ${
                perms[key]
                  ? "border-[#1C4ED1]/20 bg-[#1C4ED1]/3"
                  : "border-[#E3E8F4] bg-[#F4F6FB]/50"
              }`}
            >
              <div className="space-y-0.5 flex-1 min-w-0">
                <p className={`text-[14px] font-semibold ${perms[key] ? "text-[#040B37]" : "text-[#4B5563]"}`}>
                  {label}
                </p>
                <p className="text-[12px] text-[#9CA3AF] leading-snug">{description}</p>
                {savedKey === key && (
                  <p className="text-[11px] font-semibold text-emerald-600">Saved</p>
                )}
              </div>
              <button
                type="button"
                disabled={isPending}
                onClick={() => toggle(key)}
                className={`relative w-[48px] h-[27px] rounded-[13.5px] transition-all shrink-0 flex items-center p-[2.25px] disabled:opacity-50 ${
                  perms[key] ? "bg-[#1C4ED1]" : "bg-[#DFE1E7]"
                }`}
              >
                <span
                  className={`w-[22.5px] h-[22.5px] bg-[#F8FAFB] rounded-full shadow-[0px_1.125px_2.25px_0px_rgba(16,24,40,0.06),0px_1.125px_3.375px_0px_rgba(16,24,40,0.1)] transition-all ${
                    perms[key] ? "translate-x-[21px]" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          ))}

          {error && (
            <p className="text-[12px] text-red-500 font-medium text-center pt-1">
              {error}
            </p>
          )}
        </div>

        {/* Drawer footer */}
        <div className="px-6 py-4 border-t border-[#E3E8F4] shrink-0">
          <p className="text-[12px] text-[#9CA3AF] text-center">
            Changes are saved instantly. Super Admins always have full access.
          </p>
        </div>
      </div>
    </>
  );
}
