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

    // Split full name into firstName and lastName if possible
    let firstName: string | undefined;
    let lastName: string | undefined;
    if (fullName && typeof fullName === 'string') {
      const parts = fullName.trim().split(/\s+/);
      if (parts.length > 0) firstName = parts[0];
      if (parts.length > 1) lastName = parts.slice(1).join(' ');
    }

    // Combine job title and company for headline
    const headline = jobTitle && company
      ? `${jobTitle} at ${company}`
      : jobTitle || company || undefined;

    // Calculate total years of experience
    const yearsExperience = expYears ? parseInt(expYears, 10) : undefined;
    const validYearsExp = !isNaN(yearsExperience!) ? yearsExperience : undefined;
    const linkedinUrl = linkedinHandle ? (linkedinHandle.startsWith('http') ? linkedinHandle : `https://linkedin.com/in/${linkedinHandle.replace(/^@/, '')}`) : undefined;

    const profileData = {
      bio: bio || undefined,
      headline: headline || undefined,
      location: country || undefined,
      gender: gender || undefined,
      portfolioUrl: portfolioUrl || undefined,
      linkedinUrl,
      expertise: primaryExpertise
        ? [primaryExpertise, secondaryExpertise].filter(Boolean)
        : (selectedDisciplines || []),
    };

    const instructorProfileData = {
      isEnabled: true,
      verificationStatus: 'PENDING' as const,
      yearsExperience: validYearsExp,
      company: company || undefined,
      jobTitle: jobTitle || undefined,
      primaryExpertise: primaryExpertise || undefined,
      secondaryExpertise: secondaryExpertise || undefined,
      industrySector: industrySector || undefined,
      disciplines: Array.isArray(selectedDisciplines) ? selectedDisciplines : [],
      tools: Array.isArray(selectedTools) ? selectedTools : [],
      teachingExperience: teachingExperience || undefined,
      videoReadiness: videoReadiness || undefined,
      audienceSize: audienceSize || undefined,
      gender: gender || undefined,
      bio: bio || undefined,
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
    };

    // Update user in database along with Profile and InstructorProfile
    await db.user.update({
      where: { id: session.user.id },
      data: {
        name: fullName || session.user.name || undefined,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        image: profilePhotoUrl || session.user.image || undefined,
        role: 'INSTRUCTOR',
        profile: {
          upsert: {
            create: profileData,
            update: profileData,
          },
        },
        instructorProfile: {
          upsert: {
            create: instructorProfileData,
            update: instructorProfileData,
          },
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[INSTRUCTOR_ONBOARDING_POST_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
