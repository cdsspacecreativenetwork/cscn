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
    const { intent } = body;

    if (intent !== 'LEARNER' && intent !== 'INSTRUCTOR') {
      return NextResponse.json({ message: 'Invalid role selection' }, { status: 400 });
    }

    const userId = session.user.id;

    if (intent === 'INSTRUCTOR') {
      await db.user.update({
        where: { id: userId },
        data: {
          learnerProfile: {
            upsert: {
              create: { learningFocus: 'INSTRUCTOR' },
              update: { learningFocus: 'INSTRUCTOR' },
            },
          },
          instructorProfile: {
            upsert: {
              create: { isEnabled: true, verificationStatus: 'PENDING' },
              update: { isEnabled: true, verificationStatus: 'PENDING' },
            },
          },
        },
      });
    } else {
      await db.user.update({
        where: { id: userId },
        data: {
          learnerProfile: {
            upsert: {
              create: { learningFocus: 'LEARNER' },
              update: { learningFocus: 'LEARNER' },
            },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding role saved successfully',
      intent,
    });
  } catch (error: unknown) {
    console.error('Error saving onboarding role:', error);
    return NextResponse.json(
      { message: 'An unexpected error occurred while saving your role selection.' },
      { status: 500 }
    );
  }
}
