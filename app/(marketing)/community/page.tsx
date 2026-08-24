import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, MessagesSquare, ShieldCheck, UsersRound } from "lucide-react";

import { joinCommunitySpaceAction } from "@/actions/community";
import { currentUser } from "@/lib/auth";
import { getCommunityLanding } from "@/lib/services/community.service";

export const metadata: Metadata = { title: "CSCN Learning Community | Learn, Build & Grow Together", description: "Join learning spaces built around cohorts, projects, study groups, critique and practical progress." };

const kindLabels: Record<string, string> = { GENERAL: "Open community", PROGRAM: "Program channel", COHORT: "Cohort room", TOPIC: "Skill channel", PROJECT_CRITIQUE: "Project critique", STUDY_GROUP: "Study group", ALUMNI: "Alumni" };

export default async function CommunityPage() {
  const user = await currentUser();
  const spaces = await getCommunityLanding(user?.id);
  const memberCount = spaces.reduce((sum, space) => sum + space._count.memberships, 0);
  const postCount = spaces.reduce((sum, space) => sum + space._count.posts, 0);

  return (
    <main className="cscn-marketing-page pb-28 pt-32">
      <section className="cscn-marketing-shell">
        <div className="relative overflow-hidden rounded-[24px] bg-navy px-6 py-12 text-white md:px-12 md:py-16 lg:grid lg:grid-cols-[1.2fr_.8fr] lg:gap-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(53,106,248,.28),transparent_34%)]" />
          <div className="relative z-10">
            <span className="text-xs font-bold uppercase tracking-[.16em] text-[#AFC3FF]">CSCN learning community</span>
            <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-[1.04] tracking-[-.045em] md:text-6xl">Learning is easier when you are not doing it alone.</h1>
            <p className="mt-6 max-w-2xl text-base font-medium leading-7 text-[#C9D5EF] md:text-lg">Ask questions, share work, join study groups, exchange thoughtful critique, and grow alongside people building similar skills.</p>
            <div className="mt-8 flex flex-wrap gap-3"><a href="#spaces" className="cscn-button-primary bg-white text-navy hover:bg-[#EAF0FF]">Explore spaces <ArrowRight size={17} /></a><Link href="/career" className="cscn-button-secondary border-white/30 bg-transparent text-white hover:border-white hover:text-white">Explore Career Hub</Link></div>
          </div>
          <div className="relative mt-10 grid grid-cols-2 gap-4 lg:mt-0">
            <div className="rounded-[18px] border border-white/15 bg-white/5 p-5"><UsersRound className="text-[#AFC3FF]"/><p className="mt-8 text-3xl font-semibold">{memberCount}</p><p className="mt-1 text-sm text-[#AFC0DF]">active memberships</p></div>
            <div className="rounded-[18px] border border-white/15 bg-white/5 p-5"><MessagesSquare className="text-[#AFC3FF]"/><p className="mt-8 text-3xl font-semibold">{postCount}</p><p className="mt-1 text-sm text-[#AFC0DF]">published discussions</p></div>
            <div className="col-span-2 rounded-[18px] border border-white/15 bg-white/5 p-5"><p className="text-xs font-bold uppercase tracking-[.12em] text-[#AFC0DF]">Built for learning</p><div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-semibold"><span className="rounded-lg bg-white/10 px-2 py-3">Study groups</span><span className="rounded-lg bg-white/10 px-2 py-3">Project critique</span><span className="rounded-lg bg-white/10 px-2 py-3">Cohort rooms</span></div></div>
          </div>
        </div>
      </section>

      <section id="spaces" className="cscn-marketing-shell mt-16">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="cscn-marketing-eyebrow">Spaces with a purpose</p><h2 className="cscn-marketing-heading mt-3">Learn in public. Practice with peers.</h2></div><p className="cscn-marketing-copy max-w-xl text-sm">Every space is tied to a learning goal, program, cohort, topic, or project—not an undirected social feed.</p></div>
        {spaces.length ? (
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {spaces.map((space) => (
              <article key={space.id} className="cscn-marketing-card group p-5 transition hover:-translate-y-0.5 hover:border-[#B8C8EA] md:p-6">
                <div className="flex items-start justify-between gap-4"><div><span className="text-[11px] font-bold uppercase tracking-[.12em] text-primary">{kindLabels[space.kind]}</span><h3 className="mt-2 text-2xl font-semibold tracking-[-.03em]">{space.title}</h3></div><div className="rounded-xl bg-[#EAF0FF] p-3 text-primary">{space.kind === "PROJECT_CRITIQUE" ? <BookOpenCheck/> : <UsersRound/>}</div></div>
                <p className="mt-3 text-sm font-medium leading-6 text-text-body">{space.description}</p>
                <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-text-body"><span className="rounded-lg bg-[#F4F6FB] px-3 py-1.5">{space._count.memberships} members</span><span className="rounded-lg bg-[#F4F6FB] px-3 py-1.5">{space._count.posts} discussions</span>{space.program && <span className="rounded-lg bg-[#EAF0FF] px-3 py-1.5 text-primary">{space.program.title}</span>}</div>
                {space.posts[0] && <div className="mt-5 rounded-xl border border-stroke bg-[#F8FAFF] p-4"><p className="text-sm font-semibold">{space.posts[0].title || "Latest discussion"}</p><p className="mt-1 line-clamp-2 text-sm leading-6 text-text-body">{space.posts[0].body}</p></div>}
                <div className="mt-5 flex items-center justify-between gap-3"><Link href={`/community/${space.slug}`} className="inline-flex items-center gap-2 text-sm font-bold text-primary">Open space <ArrowRight size={16}/></Link>{!space.joined && <form action={joinCommunitySpaceAction}><input type="hidden" name="spaceId" value={space.id}/><input type="hidden" name="slug" value={space.slug}/><button className="cscn-button-secondary min-h-0 px-4 py-2 text-xs">Join</button></form>}</div>
              </article>
            ))}
          </div>
        ) : <div className="cscn-marketing-card mt-8 border-dashed p-12 text-center"><ShieldCheck className="mx-auto text-primary"/><h3 className="mt-4 text-xl font-semibold">Community spaces are being prepared</h3><p className="mt-2 text-sm text-text-body">Published, moderated learning spaces will appear here.</p></div>}
      </section>
    </main>
  );
}
