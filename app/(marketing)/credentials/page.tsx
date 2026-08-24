import Link from "next/link";
import { Fingerprint } from "lucide-react";

export const metadata = { title: "Verify a CSCN credential" };
type Props = { searchParams: Promise<{ code?: string }> };

export default async function CredentialSearchPage({ searchParams }: Props) {
  const { code } = await searchParams;
  const normalized = code?.trim().toUpperCase();
  return <main className="cscn-marketing-page px-5 pb-24 pt-32"><section className="cscn-marketing-card mx-auto max-w-[720px] p-7 sm:p-12"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF0FF] text-primary"><Fingerprint size={25} /></span><p className="cscn-marketing-eyebrow mt-6">Public verification</p><h1 className="cscn-marketing-display mt-3">Verify a CSCN credential.</h1><p className="cscn-marketing-copy mt-5 text-sm">Enter the complete code shown on the credential. A valid record identifies its recipient, cohort, approved evidence, issuance date, and evidence fingerprint.</p><form className="mt-8 flex flex-col gap-3 sm:flex-row"><input name="code" defaultValue={code} placeholder="CSCN-…" aria-label="Credential verification code" className="cscn-form-field h-12 flex-1 px-4 font-mono text-sm uppercase" /><button className="cscn-button-primary h-12">Check code</button></form>{normalized && <div className="mt-5 rounded-xl bg-[#F8FAFF] p-4"><p className="text-sm text-text-body">Ready to verify <span className="font-mono font-bold">{normalized}</span>.</p><Link href={`/credentials/${encodeURIComponent(normalized)}`} className="mt-3 inline-block text-sm font-bold text-primary">Open verification record →</Link></div>}</section></main>;
}
