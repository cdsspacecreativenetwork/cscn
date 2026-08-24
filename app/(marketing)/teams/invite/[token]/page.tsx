import { CheckCircle2, ShieldCheck } from "lucide-react";

import { acceptOrganizationInvitationAction } from "@/actions/organizations";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatOrganizationRole, hashInvitationToken } from "@/lib/organizations";

export const metadata = { title: "Organization invitation | CSCN" };

export default async function OrganizationInvitationPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ teamError?: string }> }) {
  const [{ token }, query, user] = await Promise.all([params, searchParams, currentUser()]);
  const invitation = await db.organizationInvitation.findUnique({ where: { tokenHash: hashInvitationToken(token) }, select: { email: true, role: true, status: true, expiresAt: true, team: { select: { name: true } }, organization: { select: { name: true, status: true } } } });
  const valid = invitation?.status === "PENDING" && invitation.expiresAt > new Date() && invitation.organization.status === "ACTIVE";
  return <main className="min-h-screen bg-[#F3F0E8] px-4 pb-24 pt-36 text-[#071535]"><section className="mx-auto max-w-xl rounded-[30px] border border-[#D5CFC2] bg-[#FFFDF8] p-7 shadow-[12px_12px_0_#E1DACB] md:p-10"><ShieldCheck size={34} className="text-[#B54A2A]"/><p className="mt-8 text-xs font-black uppercase tracking-[.16em] text-[#B54A2A]">Team learning invitation</p>{valid && invitation ? <><h1 className="mt-4 text-4xl font-black tracking-[-.055em]">Join {invitation.organization.name}</h1><p className="mt-5 text-sm leading-7 text-[#667085]">You were invited as {formatOrganizationRole(invitation.role)}{invitation.team ? ` in ${invitation.team.name}` : ""}. Accepting creates organization membership only; learning access starts after an active seat is allocated.</p><div className="mt-6 rounded-2xl bg-[#F3F6FC] p-4 text-sm"><p className="font-black">Invitation email</p><p className="mt-1 text-[#667085]">{invitation.email}</p>{user?.email && <p className="mt-3 text-xs font-bold text-[#1C4ED1]">Signed in as {user.email}</p>}</div>{query.teamError && <p className="mt-4 rounded-xl bg-[#FFF0ED] p-3 text-sm font-bold text-[#A33]">{query.teamError}</p>}<form action={acceptOrganizationInvitationAction} className="mt-6"><input type="hidden" name="token" value={token}/><button className="flex w-full items-center justify-center gap-2 rounded-full bg-[#071535] px-6 py-3.5 text-sm font-black text-white"><CheckCircle2 size={17}/> Accept invitation</button></form></> : <><h1 className="mt-4 text-4xl font-black tracking-[-.055em]">Invitation unavailable</h1><p className="mt-5 text-sm leading-7 text-[#667085]">This link is invalid, expired, already accepted, or the organization is not active. Ask the organization administrator for a new invitation.</p></>}</section></main>;
}
