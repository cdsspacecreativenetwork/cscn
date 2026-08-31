'use server';

import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export type WorkspaceType = 'student' | 'instructor' | 'admin';

export async function setLastWorkspace(workspace: WorkspaceType) {
  try {
    const cookieStore = await cookies();
    cookieStore.set('cscn_last_workspace', workspace, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: 'lax',
    });

    const user = await currentUser();
    if (user?.id) {
      await db.user.update({
        where: { id: user.id },
        data: { lastWorkspace: workspace },
      }).catch(() => null);
    }

    return { success: true };
  } catch (error) {
    console.error('Error setting last workspace:', error);
    return { success: false };
  }
}

export async function getLastWorkspace(): Promise<WorkspaceType | null> {
  try {
    const cookieStore = await cookies();
    const val = cookieStore.get('cscn_last_workspace')?.value as WorkspaceType | undefined;
    if (val === 'student' || val === 'instructor' || val === 'admin') {
      return val;
    }

    const user = await currentUser();
    if (user?.id) {
      const dbUser = await db.user.findUnique({
        where: { id: user.id },
        select: { lastWorkspace: true },
      });
      const dbVal = dbUser?.lastWorkspace as WorkspaceType | undefined;
      if (dbVal === 'student' || dbVal === 'instructor' || dbVal === 'admin') {
        return dbVal;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export async function resolveSmartPostLoginRedirect(email: string): Promise<string> {
  try {
    const dbUser = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        role: true,
        lastWorkspace: true,
        instructorProfile: {
          select: { isEnabled: true },
        },
      },
    });

    if (!dbUser) return '/student';

    const cookieStore = await cookies();
    const cookieVal = cookieStore.get('cscn_last_workspace')?.value as WorkspaceType | undefined;
    const lastWorkspace = cookieVal || dbUser.lastWorkspace;

    const isAdmin = dbUser.role === 'ADMIN' || dbUser.role === 'SUPER_ADMIN';
    const isInstructor =
      dbUser.role === 'INSTRUCTOR' || dbUser.instructorProfile?.isEnabled === true;

    if (lastWorkspace === 'admin' && isAdmin) {
      return '/admin';
    }
    if (lastWorkspace === 'instructor' && isInstructor) {
      return '/instructor';
    }
    if (lastWorkspace === 'student') {
      return '/student';
    }

    // Default fallbacks if no valid lastWorkspace
    if (isAdmin) return '/admin';
    if (isInstructor) return '/instructor';
    return '/student';
  } catch {
    return '/student';
  }
}
