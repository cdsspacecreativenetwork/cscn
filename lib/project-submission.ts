import { z } from "zod";

const optionalHttpUrl = z.string().trim().max(500).refine((value) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}, "Use a valid http or https URL.");

export const projectDraftSchema = z.object({
  title: z.string().trim().max(140),
  summary: z.string().trim().max(5000),
  submissionText: z.string().trim().max(12000).default(""),
  artifactUrl: optionalHttpUrl,
  repositoryUrl: optionalHttpUrl,
  demoUrl: optionalHttpUrl,
  coverImageUrl: optionalHttpUrl,
  showcaseConsent: z.boolean(),
});

export const projectSubmissionSchema = projectDraftSchema.extend({
  title: z.string().trim().min(5, "Add a project title.").max(140),
  summary: z.string().trim().min(80, "Explain the problem, process, decisions, and outcome in at least 80 characters.").max(5000),
}).refine((value) => Boolean(value.submissionText || value.artifactUrl || value.repositoryUrl || value.demoUrl), {
  message: "Add a written response or at least one artifact, repository, or demo URL.",
  path: ["artifactUrl"],
});

export type ProjectSubmissionInput = z.input<typeof projectSubmissionSchema>;

export function canEditProjectSubmission(status?: string | null) {
  return !status || status === "DRAFT" || status === "CHANGES_REQUESTED";
}

export function validateRubricScores(
  criteria: Array<{ id: string; maxScore: number }>,
  scores: Array<{ criterionId: string; score: number; note?: string }>,
) {
  if (criteria.length !== scores.length) return "Score every rubric criterion exactly once.";
  const scoreMap = new Map(scores.map((score) => [score.criterionId, score]));
  if (scoreMap.size !== criteria.length) return "Score every rubric criterion exactly once.";
  for (const criterion of criteria) {
    const score = scoreMap.get(criterion.id);
    if (!score || !Number.isInteger(score.score) || score.score < 0 || score.score > criterion.maxScore) {
      return `Scores must be whole numbers between 0 and each criterion maximum.`;
    }
    if ((score.note?.length ?? 0) > 1000) return "Criterion notes cannot exceed 1,000 characters.";
  }
  return null;
}
