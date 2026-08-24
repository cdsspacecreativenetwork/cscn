"use client";

import { FormEvent, startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { CustomSelect } from "@/components/ui/CustomSelect";
import SearchField from "@/components/ui/SearchField";

type Option = {
  value: string;
  label: string;
};

type AdminDirectoryFiltersProps = {
  basePath: string;
  query?: string;
  sort: string;
  status?: string;
  tab?: string;
  statusOptions?: Option[];
  sortOptions: Option[];
  searchPlaceholder: string;
};

export function AdminDirectoryFilters({
  basePath,
  query,
  sort,
  status,
  tab,
  statusOptions,
  sortOptions,
  searchPlaceholder,
}: AdminDirectoryFiltersProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(query ?? "");
  const [sortValue, setSortValue] = useState(sort);
  const [statusValue, setStatusValue] = useState(status ?? "");

  const navigate = (next: { q?: string; sort?: string; status?: string }) => {
    const params = new URLSearchParams();
    const nextQuery = next.q ?? searchValue;
    const nextSort = next.sort ?? sortValue;
    const nextStatus = next.status ?? statusValue;

    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    if (nextSort && nextSort !== "newest") params.set("sort", nextSort);
    if (nextStatus && nextStatus !== "all") params.set("status", nextStatus);
    if (tab && tab !== "all") params.set("tab", tab);

    const qs = params.toString();
    startTransition(() => router.push(qs ? `${basePath}?${qs}` : basePath));
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigate({ q: searchValue });
  };

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <form onSubmit={submitSearch}>
        <SearchField
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          compact
          containerClassName="sm:w-[320px]"
        />
      </form>

      <div className="flex flex-col gap-3 sm:flex-row">
        {statusOptions && (
          <CustomSelect
            size="compact"
            value={statusValue || "all"}
            options={statusOptions}
            onChange={(next) => {
              setStatusValue(next);
              navigate({ status: next });
            }}
            className="min-w-[210px]"
          />
        )}
        <CustomSelect
          size="compact"
          value={sortValue}
          options={sortOptions}
          onChange={(next) => {
            setSortValue(next);
            navigate({ sort: next });
          }}
          className="min-w-[190px]"
        />
      </div>
    </div>
  );
}
