"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";

const tabs = [
  { label: "All users", value: "all" },
  { label: "Students", value: "students" },
  { label: "Instructors", value: "instructors" },
  { label: "Admins", value: "admins" },
  { label: "Pending verification", value: "pending" },
  { label: "Featured instructors", value: "featured" },
];

const sortOptions = [
  { label: "Newest first", value: "newest" },
  { label: "Oldest first", value: "oldest" },
  { label: "Name A-Z", value: "name" },
  { label: "Instructor courses", value: "courses" },
  { label: "Instructor students", value: "students" },
  { label: "Instructor rating", value: "rating" },
  { label: "Student enrollments", value: "enrolled" },
  { label: "Featured order", value: "featured" },
];

function buildQuery(pathname: string, params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && value !== "all") query.set(key, value);
  });
  const qs = query.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function AdminUsersToolbar({
  total,
  tab,
  query,
  sort,
}: {
  total: number;
  tab: string;
  query?: string;
  sort: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(query ?? "");
  const [isPending, startTransition] = useTransition();

  const activeTab = tab || "all";
  const activeSort = sort || "newest";

  const nextHref = useMemo(
    () => buildQuery(pathname, { tab: activeTab, q: search.trim() || undefined, sort: activeSort === "newest" ? undefined : activeSort }),
    [activeSort, activeTab, pathname, search]
  );

  useEffect(() => {
    const id = window.setTimeout(() => {
      startTransition(() => router.replace(nextHref, { scroll: false }));
    }, 350);
    return () => window.clearTimeout(id);
  }, [nextHref, router]);

  const handleSortChange = (value: string) => {
    startTransition(() => {
      router.replace(
        buildQuery(pathname, {
          tab: activeTab,
          q: search.trim() || undefined,
          sort: value === "newest" ? undefined : value,
        }),
        { scroll: false }
      );
    });
  };

  return (
    <>
      <div className="rounded-[16px] border border-[#E3E8F4] bg-white p-3 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {tabs.map((item) => (
            <Link
              key={item.value}
              href={buildQuery(pathname, {
                tab: item.value,
                q: search.trim() || undefined,
                sort: activeSort === "newest" ? undefined : activeSort,
              })}
              className={`rounded-[10px] px-4 py-2 text-[13px] font-bold transition ${
                activeTab === item.value
                  ? "bg-[#1C4ED1] text-white"
                  : "text-[#4B5563] hover:bg-[#F4F6FB] hover:text-[#040B37]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 border-b border-[#E3E8F4] px-6 py-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-[18px] font-bold text-[#040B37]">Accounts</h2>
          <p className="text-[13px] font-medium text-[#9CA3AF]">
            {total} users match this view{isPending ? " - updating..." : ""}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, headline"
              className="h-10 w-full rounded-[10px] border border-[#E3E8F4] bg-[#F8FAFF] pl-9 pr-3 text-[13px] font-medium text-[#040B37] outline-none transition focus:border-[#1C4ED1] sm:w-[320px]"
            />
          </div>
          <div className="relative flex items-center gap-2">
            <SlidersHorizontal className="text-[#9CA3AF]" size={16} />
            <CustomSelect
              options={sortOptions}
              value={activeSort}
              onChange={handleSortChange}
              className="w-[240px]"
            />
          </div>
        </div>
      </div>
    </>
  );
}
