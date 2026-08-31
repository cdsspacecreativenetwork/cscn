'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Clock3, ShieldCheck } from 'lucide-react';

import { submitInstructorApplicationAction } from '@/actions/instructor-applications';
import Button from '@/components/ui/Button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/Field';
import { Input } from "@/components/ui/Input";
import { NativeSelect } from '@/components/ui/NativeSelect';
import {
  INSTRUCTOR_EXPERIENCE_LEVELS,
  INSTRUCTOR_INDUSTRIES,
  instructorApplicationSchema,
  splitFullName,
  type InstructorApplicationInput,
} from '@/lib/instructor-applications';
import {
  clearInstructorApplicationDraft,
  readInstructorApplicationDraft,
  saveInstructorApplicationDraft,
} from '@/lib/instructor-application-draft';

type Viewer = {
  id: string;
  name: string | null;
  email: string;
  role: string;
} | null;

type ExistingApplication = {
  fullName: string;
  email: string;
  industry: string;
  portfolioUrl: string;
  experienceLevel: InstructorApplicationInput['experienceLevel'];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  reviewDueAt: string;
} | null;

type Props = {
  viewer: Viewer;
  existingApplication: ExistingApplication;
};

const resumeCallback = '/instructors?apply=1&resume=1';

export default function InstructorApplicationCTA({ viewer, existingApplication }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldResume = searchParams.get('resume') === '1';
  const shouldOpen = searchParams.get('apply') === '1';
  const resumeStarted = useRef(false);
  const [open, setOpen] = useState(shouldOpen);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const initialName = splitFullName(existingApplication?.fullName ?? viewer?.name ?? '');

  const form = useForm<InstructorApplicationInput>({
    resolver: zodResolver(instructorApplicationSchema),
    defaultValues: {
      firstName: initialName.firstName,
      lastName: initialName.lastName ?? '',
      email: viewer?.email ?? existingApplication?.email ?? '',
      industry: (existingApplication?.industry as InstructorApplicationInput['industry']) ?? undefined,
      portfolioUrl: existingApplication?.portfolioUrl ?? '',
      experienceLevel: existingApplication?.experienceLevel ?? undefined,
    },
  });

  const finishApplication = (values: InstructorApplicationInput) => {
    if (!viewer) return;
    setFormError(null);
    startTransition(async () => {
      const result = await submitInstructorApplicationAction({ ...values, email: viewer.email });
      if ('error' in result) {
        setFormError(result.error ?? 'Your application could not be submitted.');
        setOpen(true);
        return;
      }
      clearInstructorApplicationDraft();
      router.replace('/dashboard?instructorApplication=pending');
      router.refresh();
    });
  };

  useEffect(() => {
    const draft = readInstructorApplicationDraft();
    if (draft) {
      form.reset({ ...draft, email: viewer?.email ?? draft.email });
    }

    if (!shouldResume || !viewer || resumeStarted.current || existingApplication?.status === 'PENDING') return;
    resumeStarted.current = true;
    if (!draft) {
      window.setTimeout(() => {
        setOpen(true);
        setFormError('Your saved application could not be restored. Please complete the form again.');
      }, 0);
      return;
    }
    window.setTimeout(() => finishApplication({ ...draft, email: viewer.email }), 0);
  // The form is intentionally restored once when auth returns to this route.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = (values: InstructorApplicationInput) => {
    const normalized = { ...values, email: viewer?.email ?? values.email };
    if (!viewer) {
      saveInstructorApplicationDraft(normalized);
      router.push(`/signup/instructor?callbackUrl=${encodeURIComponent(resumeCallback)}`);
      return;
    }
    finishApplication(normalized);
  };

  if ((viewer && viewer.role !== 'USER') || existingApplication?.status === 'APPROVED') {
    return (
      <Button variant="gradient" size="lg" rounded="full" onClick={() => router.push('/dashboard')}>
        Open instructor dashboard
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient" size="lg" rounded="full">
          {existingApplication?.status === 'REJECTED' ? 'Apply again' : 'Apply to become an instructor'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader className="border-b border-stroke px-6 pb-5 pt-6 pr-16 sm:px-8 sm:pt-8">
          <p className="cscn-marketing-eyebrow">Instructor application</p>
          <DialogTitle>Teach practical skills on CSCN</DialogTitle>
          <DialogDescription>
            Tell us about your experience. Applications are reviewed manually within 48 hours.
          </DialogDescription>
        </DialogHeader>

        {existingApplication?.status === 'PENDING' ? (
          <div className="flex flex-col gap-6 overflow-y-auto p-6 sm:p-8">
            <Alert className="border-amber-200 bg-amber-50">
              <Clock3 aria-hidden="true" className="mt-0.5 size-5 text-amber-700" />
              <div>
                <AlertTitle>Application pending approval</AlertTitle>
                <AlertDescription>
                  Submitted {new Date(existingApplication.submittedAt).toLocaleDateString('en-NG')}. We aim to review it by{' '}
                  {new Date(existingApplication.reviewDueAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}.
                </AlertDescription>
              </div>
            </Alert>
            <Button variant="primary" rounded="full" onClick={() => router.push('/dashboard')}>
              Go to dashboard
            </Button>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-col">
            <div className="overflow-y-auto px-6 py-6 sm:px-8">
              <FieldGroup>
                {formError && (
                  <Alert className="border-red-200 bg-red-50">
                    <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 text-red-700" />
                    <div>
                      <AlertTitle>Application not submitted</AlertTitle>
                      <AlertDescription>{formError}</AlertDescription>
                    </div>
                  </Alert>
                )}

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field data-invalid={Boolean(form.formState.errors.firstName)}>
                    <FieldLabel htmlFor="instructor-first-name">First name</FieldLabel>
                    <Input
                      id="instructor-first-name"
                      autoComplete="given-name"
                      placeholder="First name"
                      aria-invalid={Boolean(form.formState.errors.firstName)}
                      {...form.register('firstName')}
                    />
                    {form.formState.errors.firstName && <FieldError>{form.formState.errors.firstName.message}</FieldError>}
                  </Field>

                  <Field data-invalid={Boolean(form.formState.errors.lastName)}>
                    <FieldLabel htmlFor="instructor-last-name">Last name</FieldLabel>
                    <Input
                      id="instructor-last-name"
                      autoComplete="family-name"
                      placeholder="Last name"
                      aria-invalid={Boolean(form.formState.errors.lastName)}
                      {...form.register('lastName')}
                    />
                    {form.formState.errors.lastName && <FieldError>{form.formState.errors.lastName.message}</FieldError>}
                  </Field>
                </div>

                <Field data-invalid={Boolean(form.formState.errors.email)} data-disabled={Boolean(viewer)}>
                  <FieldLabel htmlFor="instructor-email">Email address</FieldLabel>
                  <Input
                    id="instructor-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    readOnly={Boolean(viewer)}
                    aria-invalid={Boolean(form.formState.errors.email)}
                    {...form.register('email')}
                  />
                  <FieldDescription>
                    {viewer ? 'Applications are linked to your signed-in CSCN email.' : 'We will use this email when you create or sign into your CSCN account.'}
                  </FieldDescription>
                  {form.formState.errors.email && <FieldError>{form.formState.errors.email.message}</FieldError>}
                </Field>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field data-invalid={Boolean(form.formState.errors.industry)}>
                    <FieldLabel htmlFor="instructor-industry">Industry</FieldLabel>
                    <NativeSelect
                      id="instructor-industry"
                      aria-invalid={Boolean(form.formState.errors.industry)}
                      {...form.register('industry')}
                    >
                      <option value="">Choose an industry</option>
                      {INSTRUCTOR_INDUSTRIES.map((industry) => <option key={industry} value={industry}>{industry}</option>)}
                    </NativeSelect>
                    {form.formState.errors.industry && <FieldError>{form.formState.errors.industry.message}</FieldError>}
                  </Field>

                  <Field data-invalid={Boolean(form.formState.errors.experienceLevel)}>
                    <FieldLabel htmlFor="instructor-experience">Experience level</FieldLabel>
                    <NativeSelect
                      id="instructor-experience"
                      aria-invalid={Boolean(form.formState.errors.experienceLevel)}
                      {...form.register('experienceLevel')}
                    >
                      <option value="">Choose experience</option>
                      {INSTRUCTOR_EXPERIENCE_LEVELS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </NativeSelect>
                    {form.formState.errors.experienceLevel && <FieldError>{form.formState.errors.experienceLevel.message}</FieldError>}
                  </Field>
                </div>

                <Field data-invalid={Boolean(form.formState.errors.portfolioUrl)}>
                  <FieldLabel htmlFor="instructor-portfolio">Portfolio or professional profile URL</FieldLabel>
                  <Input
                    id="instructor-portfolio"
                    type="url"
                    inputMode="url"
                    placeholder="https://linkedin.com/in/your-name"
                    aria-invalid={Boolean(form.formState.errors.portfolioUrl)}
                    {...form.register('portfolioUrl')}
                  />
                  <FieldDescription>LinkedIn, GitHub, or your personal portfolio website.</FieldDescription>
                  {form.formState.errors.portfolioUrl && <FieldError>{form.formState.errors.portfolioUrl.message}</FieldError>}
                </Field>
              </FieldGroup>
            </div>

            <DialogFooter className="border-t border-stroke bg-background px-6 py-4 sm:px-8">
              <DialogClose asChild>
                <Button type="button" variant="ghost" rounded="full" disabled={isPending}>Cancel</Button>
              </DialogClose>
              <Button type="submit" variant="primary" rounded="full" loading={isPending} disabled={isPending}>
                {viewer ? 'Submit application' : 'Continue to create account'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
