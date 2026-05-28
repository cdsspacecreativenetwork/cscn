"use client";

import { FormEvent, startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { CustomSelect } from "@/components/ui/CustomSelect";

type Option = {
  value: string;
  label: string;
};

interface Props {
  query?: string;
  action: string;
  entityType: string;
  actionOptions: Option[];
  entityOptions: Option[];
}

export function AdminAuditLogFilters({
  query,
  action,
  entityType,
  actionOptions,
  entityOptions,
}: Props) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(query ?? "");
  const [actionValue, setActionValue] = useState(action);
  const [entityValue, setEntityValue] = useState(entityType);

  const navigate = (next: { q?: string; action?: string; entityType?: string }) => {
    const params = new URLSearchParams();
    const nextQuery = next.q ?? searchValue;
    const nextAction = next.action ?? actionValue;
    const nextEntity = next.entityType ?? entityValue;

    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    if (nextAction && nextAction !== "all") params.set("action", nextAction);
    if (nextEntity && nextEntity !== "all") params.set("entityType", nextEntity);

    const qs = params.toString();
    startTransition(() => router.push(qs ? `/dashboard/admin/audit-logs?${qs}` : "/dashboard/admin/audit-logs"));
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigate({ q: searchValue });
  };

  return (
    <form onSubmit={submitSearch} className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_240px_240px_auto]">
      <input
        value={searchValue}
        onChange={(event) => setSearchValue(event.target.value)}
        placeholder="Search actor, action, entity..."
        className="h-11 rounded-[10px] border border-[#E3E8F4] bg-white px-4 text-[14px] font-semibold text-[#040B37] outline-none transition focus:border-[#1C4ED1] focus:ring-2 focus:ring-[#1C4ED1]/10"
      />
      <CustomSelect
        value={actionValue}
        options={[{ value: "all", label: "All actions" }, ...actionOptions]}
        onChange={(next) => {
          setActionValue(next);
          navigate({ action: next });
        }}
        className="min-w-[220px]"
      />
      <CustomSelect
        value={entityValue}
        options={[{ value: "all", label: "All entities" }, ...entityOptions]}
        onChange={(next) => {
          setEntityValue(next);
          navigate({ entityType: next });
        }}
        className="min-w-[220px]"
      />
      <button className="h-11 rounded-[10px] bg-[#1C4ED1] px-5 text-[13px] font-black text-white transition hover:bg-[#163fa3]">
        Apply
      </button>
    </form>
  );
}
