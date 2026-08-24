import Link from 'next/link';
import { Fingerprint } from 'lucide-react';

import Button from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import SearchField from '@/components/ui/SearchField';

export const metadata = { title: 'Verify a CSCN credential' };

type Props = { searchParams: Promise<{ code?: string }> };

export default async function CredentialSearchPage({ searchParams }: Props) {
  const { code } = await searchParams;
  const normalized = code?.trim().toUpperCase();

  return (
    <main className="cscn-marketing-page px-5 pb-24 pt-32">
      <Card className="mx-auto max-w-[720px] p-7 sm:p-12">
        <CardHeader className="p-0">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF0FF] text-primary">
            <Fingerprint size={25} />
          </span>
          <p className="cscn-marketing-eyebrow mt-6">Public verification</p>
          <CardTitle className="cscn-marketing-display mt-3">Verify a CSCN credential.</CardTitle>
          <CardDescription className="cscn-marketing-copy mt-5 text-sm">
            Enter the complete code shown on the credential. A valid record identifies its recipient,
            cohort, approved evidence, issuance date, and evidence fingerprint.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <form className="mt-8 flex flex-col gap-3 sm:flex-row">
            <SearchField
              name="code"
              defaultValue={code}
              placeholder="CSCN-…"
              aria-label="Credential verification code"
              containerClassName="flex-1"
              className="h-12 font-mono uppercase"
            />
            <Button variant="primary" rounded="full" className="h-12">
              Check code
            </Button>
          </form>

          {normalized && (
            <div className="mt-5 rounded-xl bg-[#F8FAFF] p-4">
              <p className="text-sm text-text-body">
                Ready to verify <span className="font-mono font-bold">{normalized}</span>.
              </p>
              <Link
                href={`/credentials/${encodeURIComponent(normalized)}`}
                className="mt-3 inline-block text-sm font-bold text-primary"
              >
                Open verification record →
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
