import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    const {
      profilePhotoUrl,
      fullName,
      gender,
      country,
      company,
      jobTitle,
      expYears,
      expMonths,
      linkedinHandle,
      portfolioUrl,
      primaryExpertise,
      secondaryExpertise,
      industrySector,
      selectedDisciplines,
      selectedTools,
      bio,
      teachingExperience,
      videoReadiness,
      audienceSize,
    } = body;

    // Combine job title and company for headline
    const headline = jobTitle && company
      ? `${jobTitle} at ${company}`
      : jobTitle || company || undefined;

    // Calculate total years of experience
    const yearsExperience = expYears ? parseInt(expYears, 10) : undefined;

    // Update user in database
    await db.user.update({
      where: { id: session.user.id },
      data: {
        name: fullName || session.user.name || undefined,
        image: profilePhotoUrl || session.user.image || undefined,
        bio: bio || undefined,
        headline: headline || undefined,
        location: country || undefined,
        portfolioUrl: portfolioUrl || undefined,
        linkedinUrl: linkedinHandle || undefined,
        yearsExperience: !isNaN(yearsExperience!) ? yearsExperience : undefined,
        role: 'INSTRUCTOR',
        instructorProfileEnabled: true,
        instructorVerificationStatus: 'PENDING',
        expertise: {
          primaryExpertise: primaryExpertise || null,
          secondaryExpertise: secondaryExpertise || null,
          industrySector: industrySector || null,
          selectedDisciplines: selectedDisciplines || [],
          selectedTools: selectedTools || [],
          teachingExperience: teachingExperience || null,
          videoReadiness: videoReadiness || null,
          audienceSize: audienceSize || null,
          gender: gender || null,
          expMonths: expMonths || null,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[INSTRUCTOR_ONBOARDING_POST_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
