import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  baseUrl: string;
}

export function Pagination({ page, totalPages, baseUrl }: PaginationProps) {
  if (totalPages <= 1) return null;

  const makeHref = (p: number) => `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}page=${p}`;

  // Build page number window: always show first, last, current ±1, with ellipsis
  const pages: (number | "…")[] = [];
  const range = new Set([1, totalPages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= totalPages));
  const sorted = [...range].sort((a, b) => a - b);
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) pages.push("…");
    pages.push(p);
  });

  const btnBase =
    "flex items-center justify-center h-9 min-w-[36px] px-3 rounded-[8px] text-[13px] font-semibold border transition-all";
  const activeBtn = `${btnBase} bg-[#1C4ED1] border-[#1C4ED1] text-white`;
  const inactiveBtn = `${btnBase} border-[#E3E8F4] bg-white text-[#4B5563] hover:border-[#1C4ED1] hover:text-[#1C4ED1]`;
  const disabledBtn = `${btnBase} border-[#E3E8F4] bg-[#F4F6FB] text-[#9CA3AF] cursor-not-allowed pointer-events-none`;

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-[#F4F6FB]">
      <p className="text-[13px] text-[#9CA3AF] font-medium">
        Page {page} of {totalPages}
      </p>

      <div className="flex items-center gap-1.5">
        {page <= 1 ? (
          <span className={disabledBtn}>
            <ChevronLeft size={15} />
          </span>
        ) : (
          <Link href={makeHref(page - 1)} className={inactiveBtn}>
            <ChevronLeft size={15} />
          </Link>
        )}

        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="px-1 text-[#9CA3AF] text-[13px]">
              …
            </span>
          ) : (
            <Link
              key={p}
              href={makeHref(p as number)}
              className={p === page ? activeBtn : inactiveBtn}
            >
              {p}
            </Link>
          )
        )}

        {page >= totalPages ? (
          <span className={disabledBtn}>
            <ChevronRight size={15} />
          </span>
        ) : (
          <Link href={makeHref(page + 1)} className={inactiveBtn}>
            <ChevronRight size={15} />
          </Link>
        )}
      </div>
    </div>
  );
}
