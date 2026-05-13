const styles: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-50 text-purple-700 border border-purple-200",
  ADMIN: "bg-[#1C4ED1]/10 text-[#1C4ED1] border border-[#1C4ED1]/20",
  INSTRUCTOR: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  USER: "bg-[#F4F6FB] text-[#9CA3AF] border border-[#E3E8F4]",
};

const labels: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  INSTRUCTOR: "Instructor",
  USER: "Student",
};

export function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold ${styles[role] ?? styles.USER}`}
    >
      {labels[role] ?? role}
    </span>
  );
}
