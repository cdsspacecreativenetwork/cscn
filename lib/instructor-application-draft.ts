import {
  instructorApplicationSchema,
  type InstructorApplicationInput,
} from '@/lib/instructor-applications';

export const INSTRUCTOR_APPLICATION_DRAFT_KEY = 'cscn.instructor-application-draft';

export function saveInstructorApplicationDraft(input: InstructorApplicationInput) {
  window.sessionStorage.setItem(INSTRUCTOR_APPLICATION_DRAFT_KEY, JSON.stringify(input));
}

export function readInstructorApplicationDraft() {
  const raw = window.sessionStorage.getItem(INSTRUCTOR_APPLICATION_DRAFT_KEY);
  if (!raw) return null;
  try {
    const parsed = instructorApplicationSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function clearInstructorApplicationDraft() {
  window.sessionStorage.removeItem(INSTRUCTOR_APPLICATION_DRAFT_KEY);
}
