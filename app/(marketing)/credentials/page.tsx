import Link from "next/link";
import { Fingerprint } from "lucide-react";

export const metadata = { title: "Verify a CSCN credential" };
type Props = { searchParams: Promise<{ code?: string }> };

export default async function CredentialSearchPage({ searchParams }: Props) {
  const { code } = await searchParams;
  const normalized = code?.trim().toUpperCase();
  return <main className="min-h-screen bg-[#F7F9FD] px-5 pb-24 pt-32 font-jakarta"><section className="mx-auto max-w-[720px] rounded-[26px] border border-[#DDE4EF] bg-white p-7 sm:p-12"><Fingerprint size={30} className="text-[#1C4ED1]" /><p className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-[#1C4ED1]">Public verification</p><h1 className="mt-3 text-4xl font-black tracking-[-0.05em] text-[#040B37] sm:text-6xl">Verify a CSCN credential.</h1><p className="mt-5 text-sm leading-7 text-[#667085]">Enter the complete code shown on the credential. A valid record identifies its recipient, cohort, approved evidence, issuance date, and evidence fingerprint.</p><form className="mt-8 flex flex-col gap-3 sm:flex-row"><input name="code" defaultValue={code} placeholder="CSCN-…" aria-label="Credential verification code" className="h-12 flex-1 rounded-xl border border-[#D6DEEC] px-4 font-mono text-sm uppercase outline-none focus:border-[#1C4ED1]" /><button className="h-12 rounded-xl bg-[#1C4ED1] px-6 text-sm font-black text-white">Check code</button></form>{normalized && <div className="mt-5 rounded-xl bg-[#F7F9FD] p-4"><p className="text-sm text-[#526078]">Ready to verify <span className="font-mono font-bold">{normalized}</span>.</p><Link href={`/credentials/${encodeURIComponent(normalized)}`} className="mt-3 inline-block text-sm font-black text-[#1C4ED1]">Open verification record →</Link></div>}</section></main>;
}
