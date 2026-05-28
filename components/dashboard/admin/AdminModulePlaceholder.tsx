import Link from "next/link";
import { ArrowLeft, LockKeyhole, Sparkles } from "lucide-react";

type AdminModulePlaceholderProps = {
  title: string;
  description: string;
  phase: string;
  bullets: string[];
};

export function AdminModulePlaceholder({
  title,
  description,
  phase,
  bullets,
}: AdminModulePlaceholderProps) {
  return (
    <div className="mx-auto max-w-[1180px] p-[clamp(16px,2.78vw,48px)] pb-28 font-jakarta">
      <Link
        href="/dashboard/admin"
        className="mb-6 inline-flex items-center gap-2 text-[13px] font-bold text-[#1C4ED1] hover:underline"
      >
        <ArrowLeft size={16} />
        Back to Command Center
      </Link>

      <section className="rounded-[22px] border border-[#E3E8F4] bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#1C4ED1]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#1C4ED1]">
              <Sparkles size={14} />
              {phase}
            </div>
            <div>
              <h1 className="text-[28px] font-black leading-tight tracking-[-0.04em] text-[#040B37] md:text-[36px]">
                {title}
              </h1>
              <p className="mt-3 text-[15px] font-medium leading-relaxed text-[#4B5563]">
                {description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-[16px] border border-[#E3E8F4] bg-[#F8FAFF] px-4 py-3 text-[#4B5563]">
            <LockKeyhole size={18} className="text-[#1C4ED1]" />
            <span className="text-[13px] font-bold">Permission-aware module</span>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {bullets.map((bullet) => (
            <div key={bullet} className="rounded-[14px] border border-[#E3E8F4] bg-[#F8FAFF] p-4">
              <p className="text-[14px] font-bold leading-relaxed text-[#040B37]">{bullet}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
