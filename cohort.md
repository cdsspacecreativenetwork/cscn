# Admin Cohort Creation Plan

## Dashboard Placement

The Cohorts module belongs under the admin dashboard's Learning Operations area.

| User | Dashboard module | Route | Purpose |
| --- | --- | --- | --- |
| Authorized admin | Cohorts | `/dashboard/admin/cohorts` | Create cohorts and view the cohort directory |
| Authorized admin | Cohort Control Centre | `/dashboard/admin/cohorts/[slug]` | Admissions, staffing, lifecycle, schedules, assessments, and analytics |
| Instructor or teaching assistant | Assigned Cohorts | `/dashboard/instructor/cohorts/[slug]` | Run classes and assessments |
| Student | My Cohorts | `/dashboard/cohorts/[slug]` | Learn, attend classes, submit work, and view progress |

The admin sidebar entry is protected by `canManageCohorts`. Super admins receive access automatically; regular admins must be granted the permission.

## 1. Recommended Creation Journey

The initial creation experience should be a guided wizard because the configuration has several dependent sections.

### Step 1: Choose the Program

The admin selects one published Program.

Display:

- School
- Program title and description
- Number of courses and lessons
- Required and optional courses
- Estimated duration
- Existing cohorts using the Program

Rules:

- Only `PUBLISHED` programs can be selected.
- The cohort stores `programId`; courses are not copied.
- Curriculum continues to come from:

```text
Cohort -> Program -> ProgramCourse -> Course -> Module -> Lesson
```

- Changing the Program after applications open is prohibited.
- Changing it while the cohort is a draft should trigger a warning because assignments and schedules may depend on it.

### Step 2: Cohort Identity

Fields:

- Cohort title
- Unique slug
- Optional internal reference or code
- Description
- Cover image
- Organization for organization-private cohorts
- Capacity
- Delivery mode
- Timezone
- Schedule summary

Example:

```text
Title: Product Design - October 2026
Slug: product-design-october-2026
Capacity: 50
Timezone: Africa/Lagos
Schedule: Tuesdays and Thursdays, 6:00 PM WAT
```

Validation:

- Title must be descriptive.
- Slug must be unique and URL-safe.
- Capacity must be within configured platform limits.
- Capacity cannot later be set below the active learner count.
- Currency must use a supported three-letter code.

### Step 3: Admissions and Payment

Fields:

- Application required
- Application opening date
- Application closing date
- Admissions mode:
  - Open enrolment
  - Application and review
  - Invite only
  - Organization assigned
- Application questions and prerequisites
- Capacity and waitlist policy
- Offer expiry period
- Price
- Currency
- Payment requirement
- Scholarship or sponsorship support

The lifecycle must enforce:

```text
Applications open < Applications close <= Cohort starts < Cohort ends
```

The existing `CohortApplication`, purchase order, and membership systems should be managed from the Cohort Control Centre.

Application acceptance must not create an active learner membership when payment or another acceptance condition remains incomplete.

### Step 4: Teaching Team

Assign:

- Lead instructor
- Additional instructors
- Teaching assistants
- Mentors

Each assignment creates or updates a `CohortMembership`.

| Person | Membership role | Capabilities |
| --- | --- | --- |
| Lead or additional instructor | `INSTRUCTOR` | Sessions, attendance, assignments, grading, and announcements |
| Teaching assistant | `TEACHING_ASSISTANT` | Teaching operations and learner support |
| Mentor | `MENTOR` | Assigned learners and mentorship work |
| Student | `LEARNER` | Student cohort workspace |

Only admins can modify the lead instructor or staffing roster. Assigned instructors and teaching assistants can operate the cohort but cannot create cohorts, change pricing, manage admissions, or replace the Program.

Every assigned staff member should receive a notification linking to their instructor workspace.

### Step 5: Weekly Schedule

Configure reusable weekly schedule rows:

- Day of week
- Start and end time
- Session type
- Recurrence
- Instructor
- Meeting provider or link
- Recurrence start and end dates
- Reminder policy

Examples:

- Tuesday - Live class - 6:00 PM
- Thursday - Studio lab - 6:00 PM
- Friday - Peer learning - asynchronous
- Saturday - Mentor office hours - 10:00 AM

Saving the schedule can optionally generate `ScheduleEvent` records for the cohort period. Admins should preview generated dates and exclude holidays before saving.

Dates entered through `datetime-local` fields must be interpreted in the selected cohort timezone, not the server timezone.

### Step 6: Completion Policy

The admin configures the weighted graduation policy.

| Category | Default weight | Default minimum |
| --- | ---: | ---: |
| Required courses | 30% | 80% |
| Assignments | 30% | 70% |
| Quizzes | 15% | 60% |
| Attendance | 15% | 70% |
| Peer reviews | 10% | 80% |

Rules:

- Enabled weights must total exactly 100%.
- A zero weight disables the category.
- Each enabled category has its own minimum.
- The overall weighted result has a separate minimum.
- Human-readable graduation guidance is stored alongside the machine-readable policy.

### Step 7: Learning Operations Defaults

Configure:

- Default assignment late policy
- Accepted submission formats
- Default number of peer reviewers
- Peer-review release policy
- Attendance requirement
- Quiz attempt rules
- Content release strategy:
  - Everything available at cohort start
  - Weekly drip
  - Instructor-controlled
- Announcement defaults
- Community space
- Mentorship availability
- Portfolio or showcase defaults

These should become typed settings rather than relying entirely on miscellaneous JSON fields.

### Step 8: Review and Create Draft

The final screen presents:

- Program summary
- Dates and timezone
- Admissions configuration
- Price and capacity
- Teaching team
- Weekly schedule
- Completion policy
- Warnings and blocking errors

Selecting **Create cohort draft** runs one database transaction:

```text
Validate permission
    -> Validate Program, slug, dates, capacity, pricing, and policy
    -> Create Cohort with DRAFT status
    -> Create staff CohortMembership records
    -> Optionally create community and schedule templates
    -> Write audit-log entries
    -> Notify assigned staff
    -> Redirect to the Cohort Control Centre
```

Nothing is publicly visible or open for applications while the cohort remains a draft.

## 2. Cohort Control Centre

After creation, redirect to `/dashboard/admin/cohorts/[slug]`.

### Overview

- Cohort status
- Program and school
- Application and cohort dates
- Capacity and enrolment
- Revenue or payment state
- Teaching team
- Attendance rate
- Assignment submission rate
- Quiz average
- Peer-review completion
- At-risk learners
- Completion readiness

### Setup Checklist

Before applications can open:

- Published Program selected
- Valid date order
- Valid completion policy
- Capacity configured
- Admissions requirements configured
- Lead instructor assigned
- Schedule summary added
- Pricing and payment configuration valid
- Community privacy configured
- No blocking validation warnings

### Applications

Manage:

- Submitted applications
- Review notes
- Accept, decline, or waitlist
- Offers and offer expiry
- Payment state
- Conversion from accepted applicant to active learner
- Capacity and waitlist promotion
- Withdrawals

### People

Manage:

- Learners
- Instructors
- Teaching assistants
- Mentors
- Invited, active, paused, completed, and withdrawn memberships
- Bulk CSV enrolment
- Organization learner assignments
- Capacity warnings

### Calendar and Live Classes

- Create recurring or one-off sessions
- Reschedule or cancel sessions
- Add meeting links
- Mark sessions live or completed
- Upload recording URLs
- Mark attendance
- Notify affected learners
- Synchronize with the existing calendar system

### Assignments and Grading

- Create assignment drafts
- Configure formats and late policies
- Add rubric criteria
- Publish or schedule release
- Review versioned submissions
- Grade and request resubmission
- Run peer-review rounds
- Moderate inappropriate feedback
- Approve showcase publication

### Announcements

Support:

- Drafts
- Immediate publishing
- Scheduled publishing
- Expiry
- Priority
- Links and attachments
- Audience selection
- Notification delivery reporting

### Completion

- Evaluate every learner against the completion policy.
- Display failed and pending requirements.
- Allow an admin override only with a mandatory audit note.
- Mark eligible memberships completed.
- Issue credentials idempotently.
- Notify learners.
- Lock or archive operational activities when appropriate.

## 3. Cohort Lifecycle

```text
DRAFT
  -> APPLICATIONS_OPEN
  -> APPLICATIONS_CLOSED
  -> IN_PROGRESS
  -> COMPLETED
  -> ARCHIVED
```

A cohort may move to `CANCELLED` from an unfinished state and later to `ARCHIVED`.

| Transition | Required checks |
| --- | --- |
| Draft to Applications open | Setup checklist passes |
| Applications open to Applications closed | Manual action or closing-date job |
| Applications closed to In progress | Teaching team and initial schedule exist |
| In progress to Completed | Completion evaluation has run |
| Completed to Archived | Credentials and records are finalized |
| Any unfinished state to Cancelled | Confirmation, reason, notifications, and refund review |

Lifecycle controls should present only valid next states. Cancellation, completion, and administrative overrides require confirmation and an audit note.

## 4. Backend Architecture

### Page Layer

Server-rendered dashboard pages should:

- Authenticate users.
- Apply route guards.
- Request role-filtered DTOs.
- Render forms and dashboards.
- Never send unrestricted Prisma records to clients.

### Server Action Layer

`actions/cohorts.ts` handles commands such as:

- Create cohort
- Duplicate cohort
- Change lifecycle status
- Add or update members
- Create events
- Update recordings
- Mark attendance
- Create assignments
- Generate peer reviews
- Publish announcements

Each action should consistently:

1. Authenticate the actor.
2. Authorize the exact operation.
3. Parse and validate input through a shared schema.
4. Execute changes in a transaction.
5. Create an audit log.
6. Queue notifications.
7. Revalidate affected pages.
8. Return a structured result or redirect.

A future refinement should use shared Zod schemas instead of custom `FormData` parsing.

### Service Layer

`lib/services/cohort-management.service.ts` should own:

- Admin cohort directory DTOs
- Operations dashboard DTOs
- Instructor cohort DTOs
- Membership and operator checks
- Aggregate analytics
- Completion-readiness queries

Recommended additional services:

- `cohort-creation.service.ts`
- `cohort-lifecycle.service.ts`
- `cohort-admissions.service.ts`
- `cohort-scheduling.service.ts`
- `cohort-completion.service.ts`
- `cohort-notification.service.ts`

This keeps server actions small and allows the same rules to be called by background jobs, APIs, and future clients.

### Database Layer

Primary source-of-truth models:

- `Cohort`
- `CohortApplication`
- `CohortMembership`
- `CohortProject`
- `ProjectSubmission`
- `ProjectSubmissionVersion`
- `ProjectSubmissionReview`
- `PeerReviewAssignment`
- `PeerReviewResponse`
- `ScheduleEvent`
- `ScheduleEventAttendee`
- `Announcement`
- `CommunitySpace`
- `Credential`

Important database protections:

- Unique cohort slug
- Unique user membership per cohort
- Unique application per user and cohort
- Unique assignment slug per cohort
- Unique peer-review reviewer per submission
- Foreign-key restrictions around Program replacement
- Indexes on cohort status, dates, memberships, applications, and review deadlines

## 5. Permissions and Security

- `canManageCohorts` controls admin creation and governance.
- Super admins bypass individual permission flags.
- Instructors and teaching assistants must have an active staff membership in the target cohort.
- Students must have an `ACTIVE` or `COMPLETED` learner membership.
- Paused and withdrawn learners cannot access learning content.
- Mentors receive only mentorship-related learner information.
- Student-facing DTOs must not include private emails, payment data, internal notes, or other students' grades.
- Every object lookup must include the cohort identifier to prevent cross-cohort access.
- File submissions need type, size, malware, and ownership validation.

## 6. Notifications and Background Jobs

Immediate notifications:

- Staff assignment
- Learner enrolment
- Application decision
- New session
- Session change or cancellation
- New announcement
- Assignment publication
- Peer-review assignment
- Grade or feedback release
- Recording availability

Scheduled jobs:

- Open and close applications
- Release scheduled assignments
- Send session reminders
- Send deadline reminders
- Mark overdue peer reviews
- Send at-risk alerts
- Expire offers and announcements
- Recalculate completion readiness

Use idempotency keys so rerunning a job does not duplicate notifications, memberships, or credentials.

## 7. Audit Log Requirements

Record:

- Cohort creation and duplication
- Configuration changes
- Program or instructor changes
- Lifecycle transitions
- Application decisions
- Membership changes
- Schedule and recording updates
- Attendance changes
- Assignment publication
- Grades and resubmissions
- Peer-review generation and moderation
- Completion overrides
- Credential issuance

Each entry should include the actor, cohort, entity, previous value, new value, timestamp, and mandatory note where required.

## 8. Current Implementation and Remaining Work

### Already Present

- Admin Cohorts sidebar module
- `canManageCohorts` permission
- Draft creation
- Program, dates, timezone, capacity, pricing, lead instructor, and completion policy
- Cohort directory
- Admin control centre
- Instructor workspace
- Membership controls
- Lifecycle transitions
- Events, recordings, and attendance
- Assignments and grading
- Peer reviews
- Announcements
- Student workspace and progress aggregation
- Audit logs and several notification types

### Recommended Next Work

1. Replace the single creation form with the guided wizard.
2. Add editing for cohort configuration after draft creation.
3. Add admissions mode, application questions, offers, waitlist, and payment controls.
4. Add a setup-readiness checklist before applications open.
5. Require confirmation and notes for cancellation, completion, and overrides.
6. Generate recurring schedules with timezone-safe date handling.
7. Add completion evaluation and credential issuance to the completion workflow.
8. Automatically create private cohort community spaces.
9. Add background jobs for releases, reminders, overdue work, and lifecycle dates.
10. Add bulk enrolment and organization assignment support.
11. Add stronger duplicate-slug, money, URL, and meeting-link error handling.
12. Add end-to-end tests for the complete admin creation-to-publication journey.

## Recommended Delivery Order

1. Creation wizard and validation
2. Admissions and membership operations
3. Scheduling and notification automation
4. Completion evaluation and credential automation

