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
  return <main className="cscn-marketing-page px-4 pb-24 pt-36"><section className="cscn-marketing-card mx-auto max-w-xl p-7 md:p-10"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF0FF] text-primary"><ShieldCheck size={25}/></span><p className="cscn-marketing-eyebrow mt-8">Team learning invitation</p>{valid && invitation ? <><h1 className="mt-4 text-4xl font-semibold tracking-[-.045em]">Join {invitation.organization.name}</h1><p className="cscn-marketing-copy mt-5 text-sm">You were invited as {formatOrganizationRole(invitation.role)}{invitation.team ? ` in ${invitation.team.name}` : ""}. Accepting creates organization membership only; learning access starts after an active seat is allocated.</p><div className="mt-6 rounded-xl bg-[#F8FAFF] p-4 text-sm"><p className="font-semibold">Invitation email</p><p className="mt-1 text-text-body">{invitation.email}</p>{user?.email && <p className="mt-3 text-xs font-semibold text-primary">Signed in as {user.email}</p>}</div>{query.teamError && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{query.teamError}</p>}<form action={acceptOrganizationInvitationAction} className="mt-6"><input type="hidden" name="token" value={token}/><button className="cscn-button-primary w-full"><CheckCircle2 size={17}/> Accept invitation</button></form></> : <><h1 className="mt-4 text-4xl font-semibold tracking-[-.045em]">Invitation unavailable</h1><p className="cscn-marketing-copy mt-5 text-sm">This link is invalid, expired, already accepted, or the organization is not active. Ask the organization administrator for a new invitation.</p></>}</section></main>;
}
