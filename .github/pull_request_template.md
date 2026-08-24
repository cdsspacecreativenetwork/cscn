## What changed

Describe the user-visible and technical changes in this batch.

## Verification

- [ ] Prisma generation and relevant migrations pass
- [ ] Focused tests pass
- [ ] Typecheck passes
- [ ] ESLint reports zero errors; the tracked warning baseline does not increase
- [ ] Production build passes
- [ ] Desktop and mobile states reviewed locally

## Safety review

- [ ] Authentication and authorization boundaries reviewed
- [ ] Payment/enrollment behavior reviewed, if affected
- [ ] Upload type, size, and ownership rules reviewed, if affected
- [ ] Migration is additive/reversible or rollback steps are documented
- [ ] No production credentials, fabricated records, or local QA fixtures are included
- [ ] No remote deployment or database mutation is required to review this PR
