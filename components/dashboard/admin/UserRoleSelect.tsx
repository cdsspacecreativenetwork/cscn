"use client";

import { useState, useTransition } from "react";
import { changeUserRole } from "@/actions/admin";
import { Crown, ShieldCheck, UserCheck, GraduationCap } from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";

const ROLE_OPTIONS = [
  { value: "USER", label: "Student", icon: <GraduationCap size={16} /> },
  { value: "INSTRUCTOR", label: "Instructor", icon: <UserCheck size={16} /> },
  { value: "ADMIN", label: "Admin", icon: <ShieldCheck size={16} /> },
  { value: "SUPER_ADMIN", label: "Super Admin", icon: <Crown size={16} /> },
];

import { RoleBadge } from "./RoleBadge";

interface UserRoleSelectProps {
  userId: string;
  currentRole: string;
  currentUserRole: string;
}

export function UserRoleSelect({
  userId,
  currentRole,
  currentUserRole,
}: UserRoleSelectProps) {
  const [role, setRole] = useState(currentRole);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const isSuperAdmin = currentUserRole === "SUPER_ADMIN";

  // Regular ADMINs cannot touch other admins — show read-only badge
  if (
    currentUserRole === "ADMIN" &&
    (currentRole === "ADMIN" || currentRole === "SUPER_ADMIN")
  ) {
    return <RoleBadge role={currentRole} />;
  }

  const options = isSuperAdmin 
    ? ROLE_OPTIONS 
    : ROLE_OPTIONS.filter(opt => opt.value === "USER" || opt.value === "INSTRUCTOR");

  const handleChange = (newRole: string) => {
    if (newRole === role) return;
    startTransition(async () => {
      const result = await changeUserRole(userId, newRole);
      if (result.success) {
        setRole(newRole);
        setFeedback({ type: "success", text: "Saved" });
      } else {
        setFeedback({ type: "error", text: result.error ?? "Failed" });
      }
      setTimeout(() => setFeedback(null), 2500);
    });
  };

  return (
    <div className="flex items-center gap-4 min-w-[180px]">
      <CustomSelect
        options={options}
        value={role}
        onChange={handleChange}
        disabled={isPending}
        className="w-full"
      />
      
      {feedback && (
        <span
          className={`text-[11px] font-semibold transition-all ${feedback.type === "success" ? "text-emerald-600" : "text-red-500"}`}
        >
          {feedback.text}
        </span>
      )}
    </div>
  );
}
