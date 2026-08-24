import { describe, expect, it } from 'vitest';

import {
  experienceLevelToYears,
  getInstructorFullName,
  getInstructorReviewDueAt,
  instructorApplicationSchema,
  splitFullName,
} from './instructor-applications';

const validInput = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  industry: 'Software Engineering',
  portfolioUrl: 'https://github.com/ada',
  experienceLevel: 'SIX_TO_TEN_YEARS',
} as const;

describe('instructor application validation', () => {
  it('accepts a complete application', () => {
    expect(instructorApplicationSchema.safeParse(validInput).success).toBe(true);
  });

  it('rejects unsafe and incomplete portfolio URLs', () => {
    expect(instructorApplicationSchema.safeParse({ ...validInput, portfolioUrl: 'javascript:alert(1)' }).success).toBe(false);
    expect(instructorApplicationSchema.safeParse({ ...validInput, portfolioUrl: '' }).success).toBe(false);
  });

  it('rejects industries outside the supported CSCN categories', () => {
    expect(instructorApplicationSchema.safeParse({ ...validInput, industry: 'Unknown' }).success).toBe(false);
  });

  it('requires first and last name separately', () => {
    expect(instructorApplicationSchema.safeParse({ ...validInput, firstName: '' }).success).toBe(false);
    expect(instructorApplicationSchema.safeParse({ ...validInput, lastName: '' }).success).toBe(false);
  });

  it('calculates a 48-hour calendar review window', () => {
    const submittedAt = new Date('2026-08-24T12:00:00.000Z');
    expect(getInstructorReviewDueAt(submittedAt).toISOString()).toBe('2026-08-26T12:00:00.000Z');
  });

  it('maps experience levels and names to existing profile fields', () => {
    expect(experienceLevelToYears('THREE_TO_FIVE_YEARS')).toBe(3);
    expect(getInstructorFullName(validInput)).toBe('Ada Lovelace');
    expect(splitFullName('Grace Brewster Murray Hopper')).toEqual({
      firstName: 'Grace Brewster Murray',
      lastName: 'Hopper',
    });
  });
});
