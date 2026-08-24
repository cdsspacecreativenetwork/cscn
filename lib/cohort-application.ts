import { z } from "zod";

export const experienceLevels = ["NEW", "SOME_EXPERIENCE", "WORKING_PROFESSIONAL"] as const;

const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .refine((value) => value === "" || z.url().safeParse(value).success, "Enter a complete URL, including https://.");

export const cohortApplicationDraftSchema = z.object({
  background: z.string().trim().max(1500),
  goals: z.string().trim().max(1500),
  prerequisites: z.string().trim().max(1000),
  portfolioUrl: optionalUrl,
  country: z.string().trim().max(80),
  experienceLevel: z.enum(experienceLevels),
  weeklyHours: z.number().int().min(0).max(60),
  hasLaptop: z.boolean(),
  hasReliableInternet: z.boolean(),
  commitmentConfirmed: z.boolean(),
});

export const cohortApplicationSubmissionSchema = cohortApplicationDraftSchema.extend({
  background: z.string().trim().min(40, "Tell us a little more about your background.").max(1500),
  goals: z.string().trim().min(40, "Tell us what you want to achieve.").max(1500),
  prerequisites: z.string().trim().min(20, "Describe how you meet the prerequisites.").max(1000),
  country: z.string().trim().min(2, "Country is required.").max(80),
  weeklyHours: z.number().int().min(1, "Enter the hours you can commit each week.").max(60),
  hasLaptop: z.literal(true, { message: "A suitable learning device is required for this preview cohort." }),
  hasReliableInternet: z.literal(true, { message: "Reliable internet access is required for live sessions." }),
  commitmentConfirmed: z.literal(true, { message: "Confirm that you can meet the weekly commitment." }),
});

export type CohortApplicationInput = z.infer<typeof cohortApplicationDraftSchema>;

export const emptyCohortApplication: CohortApplicationInput = {
  background: "",
  goals: "",
  prerequisites: "",
  portfolioUrl: "",
  country: "",
  experienceLevel: "NEW",
  weeklyHours: 0,
  hasLaptop: false,
  hasReliableInternet: false,
  commitmentConfirmed: false,
};

export function isCohortApplicationOpen(
  cohort: { status: string; applicationOpenAt: Date; applicationCloseAt: Date },
  now = new Date(),
) {
  return (
    cohort.status === "APPLICATIONS_OPEN" &&
    cohort.applicationOpenAt.getTime() <= now.getTime() &&
    cohort.applicationCloseAt.getTime() >= now.getTime()
  );
}

export function readApplicationAnswers(value: unknown): Pick<
  CohortApplicationInput,
  "country" | "experienceLevel" | "weeklyHours" | "hasLaptop" | "hasReliableInternet" | "commitmentConfirmed"
> {
  const answers = typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
  const experienceLevel = experienceLevels.includes(answers.experienceLevel as typeof experienceLevels[number])
    ? answers.experienceLevel as typeof experienceLevels[number]
    : "NEW";

  return {
    country: typeof answers.country === "string" ? answers.country : "",
    experienceLevel,
    weeklyHours: typeof answers.weeklyHours === "number" ? answers.weeklyHours : 0,
    hasLaptop: answers.hasLaptop === true,
    hasReliableInternet: answers.hasReliableInternet === true,
    commitmentConfirmed: answers.commitmentConfirmed === true,
  };
}
