"use client";

import { ChangeEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileUp, ImagePlus, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import { createMarketplaceResourceAction, submitMarketplaceResourceAction } from "@/actions/marketplace-resources";

type Course = { id: string; title: string; modules: { id: string; title: string; lessons: { id: string; title: string }[] }[] };
type Resource = { id: string; title: string; status: string; isFree: boolean; price: unknown; category: string; updatedAt: Date };
const inputClass = "w-full rounded-xl border border-stroke bg-white px-4 py-3 text-sm font-medium text-navy outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-text-mute";

function CreateResourceModal({ courses, onClose }: { courses: Course[]; onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [isFree, setIsFree] = useState(true);
  const [courseId, setCourseId] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [thumbnailName, setThumbnailName] = useState("");
  const [fileName, setFileName] = useState("");
  const course = useMemo(() => courses.find((item) => item.id === courseId), [courses, courseId]);
  const module = useMemo(() => course?.modules.find((item) => item.id === moduleId), [course, moduleId]);

  const submit = (formData: FormData) => startTransition(async () => {
    const result = await createMarketplaceResourceAction(formData);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Resource draft created. Submit it when you are ready for review.");
    router.refresh(); onClose();
  });
  const selectFile = (event: ChangeEvent<HTMLInputElement>, setName: (name: string) => void) => setName(event.target.files?.[0]?.name ?? "");

  return <div className="fixed inset-0 z-[150] flex items-end justify-center bg-[#040B37]/50 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="create-resource-title">
    <button className="absolute inset-0 cursor-default" aria-label="Close create resource dialog" onClick={onClose} />
    <div className="relative flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[24px] border border-white/60 bg-[#F8FAFF] shadow-[0_28px_90px_rgba(4,11,55,0.28)] sm:rounded-[24px]">
      <header className="flex items-start justify-between gap-5 border-b border-stroke bg-white px-5 py-5 sm:px-7">
        <div><p className="text-xs font-black uppercase tracking-[0.14em] text-primary">Resource marketplace</p><h2 id="create-resource-title" className="mt-1 text-2xl font-bold tracking-[-0.03em] text-navy">Create a resource</h2><p className="mt-1 text-sm text-text-mute">Save a draft now, then submit it for the CSCN review queue.</p></div>
        <button onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stroke bg-white text-text-mute transition hover:border-primary hover:text-primary" aria-label="Close"><X size={19} /></button>
      </header>
      <form action={submit} className="overflow-y-auto px-5 py-6 sm:px-7">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="flex flex-col gap-2 md:col-span-2"><span className="text-sm font-bold text-navy">Title <span className="text-red-500">*</span></span><input required name="title" maxLength={120} className={inputClass} placeholder="e.g. Fintech mobile app UI kit" /></label>
          <label className="flex flex-col gap-2 md:col-span-2"><span className="text-sm font-bold text-navy">Description <span className="text-red-500">*</span></span><textarea required name="description" rows={4} maxLength={2000} className={`${inputClass} resize-none`} placeholder="Explain what learners receive and how they can use it." /></label>
          <label className="flex flex-col gap-2"><span className="text-sm font-bold text-navy">Resource category</span><select name="category" className={inputClass} defaultValue="TEMPLATE"><option value="TEMPLATE">Template</option><option value="STARTER_KIT">Starter kit</option><option value="MOCKUP">Mockup</option><option value="ASSET">Asset</option><option value="GUIDE">Guide</option><option value="OTHER">Other</option></select></label>
          <label className="flex flex-col gap-2"><span className="text-sm font-bold text-navy">Currency</span><select name="currency" className={inputClass} defaultValue="NGN" disabled={isFree}><option value="NGN">NGN — Nigerian Naira</option></select></label>
        </div>
        <section className="mt-6 rounded-2xl border border-[#D8E3FF] bg-[#EEF3FF] p-4 sm:p-5"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h3 className="font-bold text-navy">Pricing and visibility</h3><p className="mt-1 text-sm text-text-mute">Free resources can be claimed by signed-in learners. Paid resources use Paystack and share 80% with you.</p></div><div className="inline-flex rounded-xl border border-[#C8D7FF] bg-white p-1"><button type="button" onClick={() => setIsFree(true)} className={`rounded-lg px-4 py-2 text-sm font-bold ${isFree ? "bg-primary text-white shadow-sm" : "text-text-mute"}`}>Free</button><button type="button" onClick={() => setIsFree(false)} className={`rounded-lg px-4 py-2 text-sm font-bold ${!isFree ? "bg-primary text-white shadow-sm" : "text-text-mute"}`}>Paid</button></div></div>{!isFree && <label className="mt-4 flex max-w-xs flex-col gap-2"><span className="text-sm font-bold text-navy">Price (NGN) <span className="text-red-500">*</span></span><input required name="price" type="number" min="1" step="1" className={inputClass} placeholder="5000" /></label>}<input type="hidden" name="visibility" value="PUBLIC" /><input type="hidden" name="price" value={isFree ? "0" : undefined} /></section>
        <section className="mt-6 grid gap-5 md:grid-cols-2"><label className="flex flex-col gap-2"><span className="text-sm font-bold text-navy">Thumbnail <span className="font-medium text-text-mute">(optional)</span></span><span className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#B9C8E7] bg-white px-4 text-center text-sm text-text-mute hover:border-primary"><ImagePlus size={20} className="mb-2 text-primary" />{thumbnailName || "Upload JPG, PNG, or WebP"}<input name="thumbnail" type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => selectFile(event, setThumbnailName)} /></span></label><label className="flex flex-col gap-2"><span className="text-sm font-bold text-navy">Downloadable file <span className="text-red-500">*</span></span><span className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#B9C8E7] bg-white px-4 text-center text-sm text-text-mute hover:border-primary"><FileUp size={20} className="mb-2 text-primary" />{fileName || "Upload ZIP, PDF, Figma file, or other asset"}<input required name="file" type="file" className="hidden" onChange={(event) => selectFile(event, setFileName)} /></span></label></section>
        <section className="mt-6 rounded-2xl border border-stroke bg-white p-4 sm:p-5"><h3 className="font-bold text-navy">Optional learning context</h3><p className="mt-1 text-sm text-text-mute">Link this marketplace resource to your course, module, or lesson to improve discovery.</p><div className="mt-4 grid gap-4 md:grid-cols-3"><select name="courseId" className={inputClass} value={courseId} onChange={(event) => { setCourseId(event.target.value); setModuleId(""); }}><option value="">No course link</option>{courses.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select><select name="moduleId" className={inputClass} value={moduleId} disabled={!course} onChange={(event) => setModuleId(event.target.value)}><option value="">No module link</option>{course?.modules.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select><select name="lessonId" className={inputClass} disabled={!module}><option value="">No lesson link</option>{module?.lessons.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></div></section>
        <footer className="mt-7 flex flex-col-reverse gap-3 border-t border-stroke pt-5 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" leftIcon={pending ? <Loader2 className="animate-spin" size={17} /> : <Plus size={17} />} loading={pending}>Create draft</Button></footer>
      </form>
    </div>
  </div>;
}

export default function ResourceLibraryClient({ resources, courses }: { resources: Resource[]; courses: Course[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const submit = (id: string) => startTransition(async () => { await submitMarketplaceResourceAction(id); toast.success("Resource submitted for review."); router.refresh(); });
  return <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8"><header className="flex flex-col gap-5 rounded-2xl border border-stroke bg-white p-5 shadow-[0_10px_28px_rgba(4,11,55,0.05)] sm:flex-row sm:items-end sm:justify-between sm:p-7"><div><p className="text-xs font-black uppercase tracking-[0.14em] text-primary">Instructor workspace</p><h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-navy">Resource Library</h1><p className="mt-2 max-w-2xl text-sm text-text-mute">Create downloadable assets, set their pricing, and manage their publication review.</p></div><Button onClick={() => setOpen(true)} leftIcon={<Plus size={18} />}>Create resource</Button></header><section className="mt-7 overflow-hidden rounded-2xl border border-stroke bg-white"><div className="border-b border-stroke px-5 py-4 sm:px-6"><h2 className="font-bold text-navy">Your resources</h2></div>{resources.length === 0 ? <div className="px-6 py-16 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><FileUp size={22} /></div><h3 className="mt-4 font-bold text-navy">Create your first resource</h3><p className="mt-1 text-sm text-text-mute">Publish templates, starter kits, guides, and other learner downloads.</p><Button className="mt-5" onClick={() => setOpen(true)} leftIcon={<Plus size={16} />}>Create resource</Button></div> : <div className="divide-y divide-stroke">{resources.map((resource) => <div key={resource.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><p className="font-bold text-navy">{resource.title}</p><p className="mt-1 text-sm text-text-mute">{resource.category.replaceAll("_", " ")} · {resource.isFree ? "Free" : `NGN ${Number(resource.price).toLocaleString()}`} · {resource.status.replaceAll("_", " ")}</p></div>{["DRAFT", "UNPUBLISHED"].includes(resource.status) && <Button size="sm" variant="outline" loading={pending} onClick={() => submit(resource.id)}>Submit for review</Button>}</div>)}</div>}</section>{open && <CreateResourceModal courses={courses} onClose={() => setOpen(false)} />}</main>;
}
