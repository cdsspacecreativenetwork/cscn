import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { fullName, email, industry, yearsExperience, portfolioUrl, linkedinUrl, courseTopic, teachingPitch } = body;

    if (!portfolioUrl && !linkedinUrl) {
      return NextResponse.json({ message: 'Portfolio or LinkedIn URL is required' }, { status: 400 });
    }

    const userId = session.user.id;

    // Convert experience string to schema Enum
    let experienceLevel: 'LESS_THAN_ONE_YEAR' | 'ONE_TO_TWO_YEARS' | 'THREE_TO_FIVE_YEARS' | 'SIX_TO_TEN_YEARS' | 'TEN_PLUS_YEARS' = 'THREE_TO_FIVE_YEARS';

    if (yearsExperience?.includes('1-2')) experienceLevel = 'ONE_TO_TWO_YEARS';
    else if (yearsExperience?.includes('3-5')) experienceLevel = 'THREE_TO_FIVE_YEARS';
    else if (yearsExperience?.includes('6-10')) experienceLevel = 'SIX_TO_TEN_YEARS';
    else if (yearsExperience?.includes('10+')) experienceLevel = 'TEN_PLUS_YEARS';

    // 1. Create or update InstructorApplication record
    const reviewDueAt = new Date();
    reviewDueAt.setDate(reviewDueAt.getDate() + 2); // 48 hours SLA review

    const application = await db.instructorApplication.upsert({
      where: { userId },
      create: {
        userId,
        fullName: fullName || session.user.name || 'Instructor Applicant',
        email: email || session.user.email || '',
        industry: industry || 'UI/UX Design',
        portfolioUrl: portfolioUrl || linkedinUrl || '',
        experienceLevel,
        status: 'PENDING',
        reviewDueAt,
      },
      update: {
        fullName: fullName || session.user.name || 'Instructor Applicant',
        email: email || session.user.email || '',
        industry: industry || 'UI/UX Design',
        portfolioUrl: portfolioUrl || linkedinUrl || '',
        experienceLevel,
        status: 'PENDING',
        reviewDueAt,
      },
    });

    // 2. Grant Sandbox / Draft access on User record while verification is under review
    await db.user.update({
      where: { id: userId },
      data: {
        instructorProfile: {
          upsert: {
            create: { isEnabled: true, verificationStatus: 'PENDING' },
            update: { isEnabled: true, verificationStatus: 'PENDING' },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Instructor application submitted successfully',
      applicationId: application.id,
    });
  } catch (error: unknown) {
    console.error('Error submitting instructor application:', error);
    return NextResponse.json(
      { message: 'An unexpected error occurred while processing your application.' },
      { status: 500 }
    );
  }
}
