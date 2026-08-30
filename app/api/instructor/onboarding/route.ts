import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { splitFullName } from '@/lib/instructor-applications';

const optionalText = (max: number) => z.string().trim().max(max).optional().default('');

const onboardingSchema = z.object({
  profilePhotoUrl: optionalText(2_048),
  fullName: z.string().trim().min(2).max(100),
  gender: z.enum(['Male', 'Female']),
  country: z.string().trim().min(2).max(100),
  company: z.string().trim().min(1).max(100),
  jobTitle: z.string().trim().min(1).max(100),
  expYears: z.coerce.number().int().min(0).max(80),
  expMonths: z.coerce.number().int().min(0).max(11),
  linkedinHandle: z.string().trim().min(2).max(200),
  portfolioUrl: optionalText(2_048),
  primaryExpertise: z.string().trim().min(1).max(100),
  secondaryExpertise: optionalText(100),
  industrySector: z.string().trim().min(1).max(100),
  selectedDisciplines: z.array(z.string().trim().min(1).max(100)).max(30).default([]),
  selectedTools: z.array(z.string().trim().min(1).max(100)).max(30).default([]),
  bio: optionalText(2_000),
  teachingExperience: optionalText(500),
  videoReadiness: optionalText(500),
  audienceSize: optionalText(500),
});

function parseHttpUrl(value: string) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function parseLinkedInUrl(value: string) {
  const url = parseHttpUrl(value);
  if (url) return url;

  const handle = value.replace(/^@/, '').replace(/^\/+|\/+$/g, '');
  return /^[A-Za-z0-9_-]{2,100}$/.test(handle)
    ? `https://www.linkedin.com/in/${handle}`
    : null;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const parsed = onboardingSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Please review the onboarding details and try again.' },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const linkedinUrl = parseLinkedInUrl(data.linkedinHandle);
    const portfolioUrl = parseHttpUrl(data.portfolioUrl);
    if (!linkedinUrl || (data.portfolioUrl && !portfolioUrl)) {
      return NextResponse.json(
        { message: 'Enter valid LinkedIn and portfolio details.' },
        { status: 400 }
      );
    }

    const { firstName, lastName } = splitFullName(data.fullName);
    const expertise = Array.from(new Set([
      data.primaryExpertise,
      data.secondaryExpertise,
      ...data.selectedDisciplines,
      ...data.selectedTools,
    ].filter(Boolean)));
    const profilePhotoUrl = parseHttpUrl(data.profilePhotoUrl);

    await db.user.update({
      where: { id: session.user.id },
      data: {
        name: data.fullName,
        firstName,
        lastName,
        ...(profilePhotoUrl ? { image: profilePhotoUrl } : {}),
        bio: data.bio || null,
        headline: `${data.jobTitle} at ${data.company}`,
        location: data.country,
        portfolioUrl,
        linkedinUrl,
        expertise,
        yearsExperience: data.expYears,
        learningFocus: 'INSTRUCTOR',
        onboardingIntent: 'INSTRUCTOR',
        instructorProfileEnabled: true,
        instructorVerificationStatus: 'PENDING',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error completing instructor onboarding:', error);
    return NextResponse.json(
      { message: 'An unexpected error occurred while saving your profile.' },
      { status: 500 }
    );
  }
}
