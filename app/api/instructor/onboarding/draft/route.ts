import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

// GET: Retrieve server-side onboarding draft for the logged-in user
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        image: true,
        profile: {
          select: {
            location: true,
            headline: true,
            portfolioUrl: true,
            linkedinUrl: true,
            bio: true,
          },
        },
        instructorProfile: {
          select: {
            expertise: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const expertiseData = (user.instructorProfile?.expertise as Record<string, any>) || {};
    const draft = expertiseData.draft || {};

    return NextResponse.json({
      success: true,
      user: {
        name: user.name,
        image: user.image,
      },
      draft,
    });
  } catch (error) {
    console.error('[INSTRUCTOR_ONBOARDING_DRAFT_GET_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Server-side auto-save onboarding progress in database
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { instructorProfile: { select: { expertise: true } } },
    });

    const currentExpertise = (currentUser?.instructorProfile?.expertise as Record<string, any>) || {};

    // Save draft under instructorProfile.expertise.draft in PostgreSQL
    await db.user.update({
      where: { id: session.user.id },
      data: {
        instructorProfile: {
          upsert: {
            create: {
              expertise: {
                ...currentExpertise,
                draft: body,
              },
            },
            update: {
              expertise: {
                ...currentExpertise,
                draft: body,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[INSTRUCTOR_ONBOARDING_DRAFT_POST_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
