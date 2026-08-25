import { z } from 'zod';

export const INSTRUCTOR_INDUSTRIES = [
  'Product Design',
  'UI/UX Design',
  'Brand Design',
  'Graphic Design',
  'Motion Design',
  'Web Development',
  'Software Engineering',
  'AI & Automation',
  'Product Management',
  'Marketing & Growth',
  'Data & Analytics',
  'Career Growth',
] as const;

export const INSTRUCTOR_EXPERIENCE_LEVELS = [
  { value: 'LESS_THAN_ONE_YEAR', label: 'Less than 1 year', years: 0 },
  { value: 'ONE_TO_TWO_YEARS', label: '1–2 years', years: 1 },
  { value: 'THREE_TO_FIVE_YEARS', label: '3–5 years', years: 3 },
  { value: 'SIX_TO_TEN_YEARS', label: '6–10 years', years: 6 },
  { value: 'TEN_PLUS_YEARS', label: '10+ years', years: 10 },
] as const;

const httpUrl = z.string().trim().url('Enter a valid portfolio URL.').refine((value) => {
  try {
    const protocol = new URL(value).protocol;
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}, 'Portfolio URL must start with http:// or https://.');

export const instructorApplicationSchema = z.object({
  firstName: z.string().trim().min(2, 'Enter your first name.').max(50, 'First name is too long.'),
  lastName: z.string().trim().min(2, 'Enter your last name.').max(50, 'Last name is too long.'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  industry: z.enum(INSTRUCTOR_INDUSTRIES, { message: 'Choose your industry.' }),
  portfolioUrl: httpUrl,
  experienceLevel: z.enum(
    INSTRUCTOR_EXPERIENCE_LEVELS.map((option) => option.value) as [
      (typeof INSTRUCTOR_EXPERIENCE_LEVELS)[number]['value'],
      ...(typeof INSTRUCTOR_EXPERIENCE_LEVELS)[number]['value'][],
    ],
    { message: 'Choose your experience level.' }
  ),
});

export type InstructorApplicationInput = z.infer<typeof instructorApplicationSchema>;

export const INSTRUCTOR_REVIEW_WINDOW_MS = 48 * 60 * 60 * 1000;

export function getInstructorReviewDueAt(submittedAt: Date) {
  return new Date(submittedAt.getTime() + INSTRUCTOR_REVIEW_WINDOW_MS);
}

export function experienceLevelToYears(level: InstructorApplicationInput['experienceLevel']) {
  return INSTRUCTOR_EXPERIENCE_LEVELS.find((option) => option.value === level)?.years ?? 0;
}

export function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: null };
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts.at(-1) ?? null };
}

export function getInstructorFullName(input: Pick<InstructorApplicationInput, 'firstName' | 'lastName'>) {
  return `${input.firstName} ${input.lastName}`.trim();
}
