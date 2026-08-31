export const COHORT_COMPLETION_CATEGORIES = [
  "courses",
  "assignments",
  "quizzes",
  "attendance",
  "peerReviews",
] as const;

export type CohortCompletionCategory = (typeof COHORT_COMPLETION_CATEGORIES)[number];

export type CohortCompletionPolicy = {
  weights: Record<CohortCompletionCategory, number>;
  minimums: Record<CohortCompletionCategory, number>;
  overallMinimum: number;
};

export type CohortCompletionMetrics = Record<CohortCompletionCategory, number>;

export const DEFAULT_COHORT_COMPLETION_POLICY: CohortCompletionPolicy = {
  weights: { courses: 30, assignments: 30, quizzes: 15, attendance: 15, peerReviews: 10 },
  minimums: { courses: 80, assignments: 70, quizzes: 60, attendance: 70, peerReviews: 80 },
  overallMinimum: 70,
};

function percentage(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, Math.round(parsed))) : fallback;
}

export function normalizeCompletionPolicy(value: unknown): CohortCompletionPolicy {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value as Partial<CohortCompletionPolicy>
    : {};
  const sourceWeights = source.weights ?? {} as CohortCompletionPolicy["weights"];
  const sourceMinimums = source.minimums ?? {} as CohortCompletionPolicy["minimums"];

  return {
    weights: Object.fromEntries(COHORT_COMPLETION_CATEGORIES.map((key) => [
      key,
      percentage(sourceWeights[key], DEFAULT_COHORT_COMPLETION_POLICY.weights[key]),
    ])) as CohortCompletionPolicy["weights"],
    minimums: Object.fromEntries(COHORT_COMPLETION_CATEGORIES.map((key) => [
      key,
      percentage(sourceMinimums[key], DEFAULT_COHORT_COMPLETION_POLICY.minimums[key]),
    ])) as CohortCompletionPolicy["minimums"],
    overallMinimum: percentage(source.overallMinimum, DEFAULT_COHORT_COMPLETION_POLICY.overallMinimum),
  };
}

export function validateCompletionPolicy(value: unknown) {
  const policy = normalizeCompletionPolicy(value);
  const totalWeight = COHORT_COMPLETION_CATEGORIES.reduce((total, key) => total + policy.weights[key], 0);
  return {
    policy,
    totalWeight,
    valid: totalWeight === 100,
    error: totalWeight === 100 ? null : `Completion weights must total 100%. Current total: ${totalWeight}%.`,
  };
}

export function calculateCohortCompletion(value: unknown, rawMetrics: Partial<CohortCompletionMetrics>) {
  const { policy } = validateCompletionPolicy(value);
  const metrics = Object.fromEntries(COHORT_COMPLETION_CATEGORIES.map((key) => [
    key,
    percentage(rawMetrics[key], 0),
  ])) as CohortCompletionMetrics;
  const requirements = COHORT_COMPLETION_CATEGORIES.map((key) => ({
    key,
    weight: policy.weights[key],
    minimum: policy.minimums[key],
    value: metrics[key],
    enabled: policy.weights[key] > 0,
    met: policy.weights[key] === 0 || metrics[key] >= policy.minimums[key],
  }));
  const overall = Math.round(requirements.reduce((total, item) => total + (item.value * item.weight) / 100, 0));
  const eligible = overall >= policy.overallMinimum && requirements.every((item) => item.met);

  return { policy, metrics, requirements, overall, eligible };
}
