"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Loader2, Save } from "lucide-react";

import { saveCohortApplicationDraft, submitCohortApplication } from "@/actions/cohort-applications";
import type { CohortApplicationInput } from "@/lib/cohort-application";

type Props = {
  cohortSlug: string;
  cohortTitle: string;
  programTitle: string;
  applicant: { name: string; email: string };
  initialData: CohortApplicationInput;
};

const steps = ["Profile", "Background", "Readiness", "Review"];
const inputClass = "mt-2 w-full rounded-xl border border-[#D8E0EE] bg-white px-4 py-3.5 text-[15px] text-navy outline-none transition placeholder:text-[#99A3B5] focus:border-primary focus:ring-4 focus:ring-primary/10";
const labelClass = "block text-sm font-semibold text-navy";

export function CohortApplicationForm({ cohortSlug, cohortTitle, programTitle, applicant, initialData }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState(initialData);
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof CohortApplicationInput>(key: K, value: CohortApplicationInput[K]) {
    setData((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: [] }));
  }

  function runSave(nextStep?: number) {
    setMessage(null);
    startTransition(async () => {
      const result = await saveCohortApplicationDraft(cohortSlug, data);
      if (!result.success) {
        setMessage(result.error);
        setFieldErrors("fieldErrors" in result && result.fieldErrors ? result.fieldErrors : {});
        return;
      }
      setMessage("Draft saved");
      if (typeof nextStep === "number") setStep(nextStep);
    });
  }

  function runSubmit() {
    setMessage(null);
    startTransition(async () => {
      const result = await submitCohortApplication(cohortSlug, data);
      if (!result.success) {
        setMessage(result.error);
        setFieldErrors("fieldErrors" in result && result.fieldErrors ? result.fieldErrors : {});
        return;
      }
      router.refresh();
    });
  }

  const errorFor = (field: keyof CohortApplicationInput) => fieldErrors[field]?.[0];

  return (
    <div className="overflow-hidden rounded-[1.75rem] bg-white ring-1 ring-[#DCE3F0] shadow-[0_24px_70px_rgba(7,19,61,0.08)]">
      <div className="border-b border-[#E5EAF3] px-6 py-6 md:px-9">
        <p className="text-sm font-semibold text-primary">{cohortTitle}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-navy">Apply for {programTitle}</h1>
        <p className="mt-3 text-sm leading-6 text-text-body">Your draft is saved when you continue between steps. You can leave and resume before submitting.</p>
      </div>

      <div className="grid gap-0 lg:grid-cols-[15rem_1fr]">
        <nav className="border-b border-[#E5EAF3] bg-[#F6F8FC] p-5 lg:border-b-0 lg:border-r lg:p-7" aria-label="Application progress">
          <ol className="grid grid-cols-4 gap-2 lg:grid-cols-1 lg:gap-3">
            {steps.map((label, index) => (
              <li key={label} className={`flex items-center gap-3 rounded-xl p-2.5 text-xs font-semibold transition lg:text-sm ${index === step ? "bg-white text-primary shadow-sm" : index < step ? "text-[#295D4A]" : "text-[#7A879B]"}`}>
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-xs ${index < step ? "bg-[#DFF4E9]" : index === step ? "bg-primary text-white" : "bg-[#E8EDF5]"}`}>{index < step ? <Check className="h-3.5 w-3.5" /> : index + 1}</span>
                <span className="hidden lg:inline">{label}</span>
              </li>
            ))}
          </ol>
        </nav>

        <div className="p-6 md:p-9 lg:p-11">
          {step === 0 && (
            <section aria-labelledby="profile-step-heading">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Step 1 of 4</p>
              <h2 id="profile-step-heading" className="mt-3 text-2xl font-semibold tracking-[-0.025em] text-navy">Confirm your profile</h2>
              <p className="mt-3 text-sm leading-6 text-text-body">We use this information to identify your application and understand your learning context.</p>
              <dl className="mt-7 grid gap-4 rounded-2xl bg-[#F5F7FB] p-5 sm:grid-cols-2">
                <div><dt className="text-xs text-[#77839A]">Name</dt><dd className="mt-1 font-semibold text-navy">{applicant.name}</dd></div>
                <div><dt className="text-xs text-[#77839A]">Email</dt><dd className="mt-1 break-all font-semibold text-navy">{applicant.email}</dd></div>
              </dl>
              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                <label className={labelClass}>Country of residence<input className={inputClass} value={data.country} onChange={(event) => update("country", event.target.value)} placeholder="e.g. Nigeria" />{errorFor("country") && <span className="mt-2 block text-xs text-red-600">{errorFor("country")}</span>}</label>
                <label className={labelClass}>Current experience<select className={inputClass} value={data.experienceLevel} onChange={(event) => update("experienceLevel", event.target.value as CohortApplicationInput["experienceLevel"])}><option value="NEW">New to this field</option><option value="SOME_EXPERIENCE">Some projects or study</option><option value="WORKING_PROFESSIONAL">Working professionally</option></select></label>
              </div>
            </section>
          )}

          {step === 1 && (
            <section aria-labelledby="background-step-heading">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Step 2 of 4</p>
              <h2 id="background-step-heading" className="mt-3 text-2xl font-semibold tracking-[-0.025em] text-navy">Background and goals</h2>
              <p className="mt-3 text-sm leading-6 text-text-body">Specific answers help admissions understand what support and pace will work for you.</p>
              <div className="mt-7 grid gap-6">
                <label className={labelClass}>What have you learned, built, or worked on so far?<textarea className={`${inputClass} min-h-36 resize-y`} maxLength={1500} value={data.background} onChange={(event) => update("background", event.target.value)} placeholder="Share relevant study, work, personal projects, or a career change you are making." /><span className="mt-2 flex justify-between text-xs text-[#8490A3]"><span>{errorFor("background")}</span><span>{data.background.length}/1500</span></span></label>
                <label className={labelClass}>What do you want to be able to do after this program?<textarea className={`${inputClass} min-h-36 resize-y`} maxLength={1500} value={data.goals} onChange={(event) => update("goals", event.target.value)} placeholder="Describe a role, capability, project, or next step you are working toward." /><span className="mt-2 flex justify-between text-xs text-[#8490A3]"><span>{errorFor("goals")}</span><span>{data.goals.length}/1500</span></span></label>
              </div>
            </section>
          )}

          {step === 2 && (
            <section aria-labelledby="readiness-step-heading">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Step 3 of 4</p>
              <h2 id="readiness-step-heading" className="mt-3 text-2xl font-semibold tracking-[-0.025em] text-navy">Readiness and availability</h2>
              <div className="mt-7 grid gap-6">
                <label className={labelClass}>How do you meet the listed prerequisites?<textarea className={`${inputClass} min-h-28 resize-y`} maxLength={1000} value={data.prerequisites} onChange={(event) => update("prerequisites", event.target.value)} placeholder="Mention the tools you can use, foundational knowledge, and anything you are preparing before the start date." /><span className="mt-2 block text-xs text-red-600">{errorFor("prerequisites")}</span></label>
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className={labelClass}>Hours available each week<input type="number" min={0} max={60} className={inputClass} value={data.weeklyHours || ""} onChange={(event) => update("weeklyHours", Number(event.target.value))} placeholder="8" />{errorFor("weeklyHours") && <span className="mt-2 block text-xs text-red-600">{errorFor("weeklyHours")}</span>}</label>
                  <label className={labelClass}>Portfolio or project URL <span className="font-normal text-[#8490A3]">(optional)</span><input type="url" className={inputClass} value={data.portfolioUrl} onChange={(event) => update("portfolioUrl", event.target.value)} placeholder="https://" />{errorFor("portfolioUrl") && <span className="mt-2 block text-xs text-red-600">{errorFor("portfolioUrl")}</span>}</label>
                </div>
                <fieldset className="grid gap-3"><legend className="text-sm font-semibold text-navy">Learning access</legend>{[["hasLaptop", "I have regular access to a suitable laptop or computer."], ["hasReliableInternet", "I have reliable internet for live sessions and project uploads."]].map(([key, label]) => <label key={key} className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#DDE4F0] p-4 text-sm leading-6 text-[#4C596F] transition hover:border-primary/50"><input type="checkbox" className="mt-1 h-4 w-4 accent-primary" checked={Boolean(data[key as "hasLaptop" | "hasReliableInternet"])} onChange={(event) => update(key as "hasLaptop" | "hasReliableInternet", event.target.checked)} />{label}</label>)}</fieldset>
              </div>
            </section>
          )}

          {step === 3 && (
            <section aria-labelledby="review-step-heading">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Step 4 of 4</p>
              <h2 id="review-step-heading" className="mt-3 text-2xl font-semibold tracking-[-0.025em] text-navy">Review and submit</h2>
              <p className="mt-3 text-sm leading-6 text-text-body">Submitted applications cannot be edited. Applying does not guarantee admission or create a payment.</p>
              <div className="mt-7 grid gap-4">
                {[['Profile', `${applicant.name} · ${data.country || 'Country not added'} · ${data.experienceLevel.replaceAll('_', ' ').toLowerCase()}`], ['Background', data.background || 'Not completed'], ['Goal', data.goals || 'Not completed'], ['Readiness', `${data.weeklyHours || 0} hours/week · ${data.prerequisites || 'Prerequisites not completed'}`]].map(([title, value]) => <div key={title} className="rounded-xl bg-[#F5F7FB] p-5"><h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#748198]">{title}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-navy">{value}</p></div>)}
              </div>
              <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-[#C8D6F0] bg-[#F7F9FD] p-4 text-sm leading-6 text-[#42516A]"><input type="checkbox" className="mt-1 h-4 w-4 accent-primary" checked={data.commitmentConfirmed} onChange={(event) => update("commitmentConfirmed", event.target.checked)} /><span>I confirm that these answers are accurate and I can meet the cohort’s stated weekly commitment.</span></label>
              {errorFor("commitmentConfirmed") && <p className="mt-2 text-xs text-red-600">{errorFor("commitmentConfirmed")}</p>}
            </section>
          )}

          <div className="mt-9 flex flex-wrap items-center justify-between gap-3 border-t border-[#E5EAF3] pt-6">
            <div className="flex items-center gap-3">
              {step > 0 && <button type="button" disabled={isPending} onClick={() => setStep((current) => current - 1)} className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-[#536179] transition hover:bg-[#F2F5FA] disabled:opacity-50"><ArrowLeft className="h-4 w-4" />Back</button>}
              <button type="button" disabled={isPending} onClick={() => runSave()} className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-[#EEF3FF] disabled:opacity-50"><Save className="h-4 w-4" />Save draft</button>
            </div>
            {step < steps.length - 1 ? (
              <button type="button" disabled={isPending} onClick={() => runSave(step + 1)} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#153FAE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50">{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Save and continue<ArrowRight className="h-4 w-4" /></button>
            ) : (
              <button type="button" disabled={isPending} onClick={runSubmit} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#153FAE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50">{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Submit application<ArrowRight className="h-4 w-4" /></button>
            )}
          </div>
          {message && <p role="status" className={`mt-4 text-sm ${message === "Draft saved" ? "text-[#237451]" : "text-red-600"}`}>{message}</p>}
        </div>
      </div>
    </div>
  );
}
