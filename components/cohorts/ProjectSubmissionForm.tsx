"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { saveProjectDraftAction, submitProjectAction } from "@/actions/project-submissions";
import type { ProjectSubmissionInput } from "@/lib/project-submission";

export function ProjectSubmissionForm({ projectId, initialData }: { projectId: string; initialData: ProjectSubmissionInput }) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function update<K extends keyof ProjectSubmissionInput>(key: K, value: ProjectSubmissionInput[K]) {
    setData((current) => ({ ...current, [key]: value }));
  }

  function run(mode: "save" | "submit") {
    setMessage(null);
    startTransition(async () => {
      const result = mode === "save" ? await saveProjectDraftAction(projectId, data) : await submitProjectAction(projectId, data);
      if (!result.success) {
        setMessage(result.error);
        return;
      }
      setMessage(mode === "save" ? "Draft saved." : `Version ${"version" in result ? result.version : ""} submitted for review.`);
      router.refresh();
    });
  }

  const fieldClass = "mt-2 w-full rounded-xl border border-[#D8E0EF] bg-white px-4 py-3 text-sm text-[#040B37] outline-none transition focus:border-[#1C4ED1] focus:ring-2 focus:ring-[#1C4ED1]/10";
  return (
    <div className="space-y-5">
      <div><label className="text-xs font-black uppercase tracking-[0.11em] text-[#77839A]" htmlFor="project-title">Project title</label><input id="project-title" value={data.title} onChange={(event) => update("title", event.target.value)} maxLength={140} className={fieldClass} /></div>
      <div><label className="text-xs font-black uppercase tracking-[0.11em] text-[#77839A]" htmlFor="project-summary">Case-study summary</label><textarea id="project-summary" value={data.summary} onChange={(event) => update("summary", event.target.value)} rows={9} maxLength={5000} placeholder="Explain the problem, your process, key decisions, feedback incorporated, and outcome." className={fieldClass} /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="text-xs font-black uppercase tracking-[0.11em] text-[#77839A]" htmlFor="artifact-url">Primary artifact URL</label><input id="artifact-url" type="url" value={data.artifactUrl} onChange={(event) => update("artifactUrl", event.target.value)} placeholder="https://…" className={fieldClass} /></div>
        <div><label className="text-xs font-black uppercase tracking-[0.11em] text-[#77839A]" htmlFor="demo-url">Demo URL</label><input id="demo-url" type="url" value={data.demoUrl} onChange={(event) => update("demoUrl", event.target.value)} placeholder="https://…" className={fieldClass} /></div>
        <div><label className="text-xs font-black uppercase tracking-[0.11em] text-[#77839A]" htmlFor="repository-url">Repository URL</label><input id="repository-url" type="url" value={data.repositoryUrl} onChange={(event) => update("repositoryUrl", event.target.value)} placeholder="https://…" className={fieldClass} /></div>
        <div><label className="text-xs font-black uppercase tracking-[0.11em] text-[#77839A]" htmlFor="cover-url">Cover image URL</label><input id="cover-url" type="url" value={data.coverImageUrl} onChange={(event) => update("coverImageUrl", event.target.value)} placeholder="https://…" className={fieldClass} /></div>
      </div>
      <label className="flex items-start gap-3 rounded-xl border border-[#D8E0EF] p-4"><input type="checkbox" checked={data.showcaseConsent} onChange={(event) => update("showcaseConsent", event.target.checked)} className="mt-1 h-4 w-4 accent-[#1C4ED1]" /><span><span className="block text-sm font-bold text-[#040B37]">Allow showcase publication after approval</span><span className="mt-1 block text-xs leading-5 text-[#667085]">Approval does not automatically make work public without this consent.</span></span></label>
      <div className="flex flex-col gap-3 sm:flex-row"><button type="button" onClick={() => run("save")} disabled={pending} className="rounded-[10px] border border-[#D8E0EF] px-5 py-3 text-sm font-bold text-[#040B37] disabled:opacity-50">Save draft</button><button type="button" onClick={() => run("submit")} disabled={pending} className="rounded-[10px] bg-[#1C4ED1] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{pending ? "Working…" : "Submit new version"}</button></div>
      {message && <p className="text-sm font-semibold text-[#526078]" role="status">{message}</p>}
    </div>
  );
}
