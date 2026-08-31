export type PeerReviewSubmission = { id: string; userId: string };
export type PeerReviewPair = { submissionId: string; reviewerId: string; revieweeId: string };

export function buildPeerReviewAssignments(
  submissions: PeerReviewSubmission[],
  requestedReviews: number,
  existingPairs: Array<Pick<PeerReviewPair, "submissionId" | "reviewerId">> = [],
) {
  const uniqueByLearner = new Map(submissions.map((submission) => [submission.userId, submission]));
  const learners = [...uniqueByLearner.values()].sort((a, b) => a.userId.localeCompare(b.userId));
  if (learners.length < 2) return [];

  const reviewsPerSubmission = Math.min(Math.max(1, Math.floor(requestedReviews)), learners.length - 1);
  const existing = new Set(existingPairs.map((pair) => `${pair.submissionId}:${pair.reviewerId}`));
  const assignments: PeerReviewPair[] = [];

  for (let revieweeIndex = 0; revieweeIndex < learners.length; revieweeIndex += 1) {
    const reviewee = learners[revieweeIndex];
    for (let offset = 1; offset <= reviewsPerSubmission; offset += 1) {
      const reviewer = learners[(revieweeIndex + offset) % learners.length];
      const key = `${reviewee.id}:${reviewer.userId}`;
      if (reviewer.userId !== reviewee.userId && !existing.has(key)) {
        assignments.push({ submissionId: reviewee.id, reviewerId: reviewer.userId, revieweeId: reviewee.userId });
      }
    }
  }

  return assignments;
}
