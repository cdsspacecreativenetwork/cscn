import Link from "next/link";
import { ArrowRight, Building2, Plus } from "lucide-react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { formatOrganizationRole } from "@/lib/organizations";
import { getUserOrganizations } from "@/lib/services/organization.service";

export const metadata = { title: "My organizations | CSCN" };

export default async function OrganizationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const memberships = await getUserOrganizations(session.user.id);
  return <main className="mx-auto max-w-[1480px] p-[clamp(16px,2.78vw,48px)] pb-28"><header className="rounded-[24px] bg-[#071535] p-7 text-white md:p-10"><Building2 className="text-[#E8B44E]"/><p className="mt-8 text-xs font-black uppercase tracking-[.15em] text-[#AFC4F4]">Team learning</p><h1 className="mt-3 text-4xl font-black tracking-[-.055em]">My organizations</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#C0CBE0]">Manage approved team workspaces, learning seats, assignments, and privacy-safe reporting.</p></header>{memberships.length ? <section className="mt-7 grid gap-5 lg:grid-cols-2">{memberships.map(({ role, organization }) => <Link key={organization.id} href={`/dashboard/organizations/${organization.slug}`} className="group rounded-[22px] border border-[#DFE4EE] bg-white p-6 transition hover:-translate-y-0.5 hover:border-[#1C4ED1]/50 hover:shadow-lg"><div className="flex items-center justify-between"><span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[.1em] ${organization.status === "ACTIVE" ? "bg-[#E7F8EE] text-[#137A3E]" : "bg-[#FFF5D8] text-[#8B6508]"}`}>{organization.status.replaceAll("_", " ")}</span><ArrowRight className="text-[#9AA5B7] transition group-hover:translate-x-1 group-hover:text-[#1C4ED1]" size={18}/></div><h2 className="mt-6 text-2xl font-black tracking-[-.04em]">{organization.name}</h2><p className="mt-2 line-clamp-2 text-sm leading-6 text-[#667085]">{organization.description || "Organization learning workspace"}</p><div className="mt-6 flex gap-5 border-t border-[#EDF0F5] pt-4 text-xs font-bold text-[#667085]"><span>{organization._count.members} members</span><span>{organization._count.teams} teams</span><span>{formatOrganizationRole(role)}</span></div></Link>)}</section> : <section className="mt-7 rounded-[22px] border border-dashed border-[#CBD3E0] bg-white p-12 text-center"><h2 className="text-2xl font-black">No organization workspace yet</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#667085]">Request a team-learning workspace or accept an invitation from an organization administrator.</p><Link href="/teams#request-team-plan" className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#1C4ED1] px-5 py-3 text-sm font-black text-white"><Plus size={16}/> Request workspace</Link></section>}</main>;
}
