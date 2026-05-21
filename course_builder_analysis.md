# Sparring Review & Technical Architecture: CSCN Course Builder Improvements

This document provides a critical sparring review of the proposed Course Builder improvements, detailing how we can implement them to meet world-class LMS standards.

---

## 1. Sparring Critique of the Proposed Improvements

### 1.1 Auto-Save in Lesson Editor
* **Our Assessment:** **Absolute priority.** Instructors hate manually pressing "Save". If their browser crashes or tab closes, lost work destroys creator trust. 
* **The Pitch:** We will introduce a **debounced auto-save engine** (2-second inactivity delay) in the lesson editor. We will show a subtle, premium status indicator at the top right of the editor:
  * `● Unsaved changes` (orange)
  * `⟳ Saving...` (animating blue spinner)
  * `✓ Saved to cloud` (green checkmark)
* **Under the Hood:** Triggered by React state changes on inputs, calling our backend Server Actions in the background via a custom hook.

### 1.2 Course Pricing Field
* **Our Assessment:** Essential. Although the platform may launch with a subscription/cohort model, pricing flexibility (free vs. premium standalone vs. subscription-access) must be built into the core.
* **Current State:** The database `Course` model already defines a nullable `price Decimal? @db.Decimal(10,2)` field!
* **The Pitch:** We just need to implement the UI inputs in the Course **Settings** tab. We should support local currency representations (e.g., Nigerian Naira `₦` and US Dollars `$`) using our custom styled dropdowns.

### 1.3 Certificate Toggle ("Award certificate on completion")
* **Our Assessment:** Necessary. Gamification and resumes drive online completion rates. 
* **The Pitch:** We will add a boolean flag `certificateEnabled` to the `Course` model. This flag will dictate whether the student gets a "Download Certificate" button on their learnings tab upon reaching 100% course progress.

### 1.4 Lesson Content Formats (Expanding past Video)
* **Our Assessment:** Crucial for course variety. Video fatigue is real. Rich text, cheat sheets, guides, and download links are standard.
* **The Pitch:** We currently have a `ContentType` enum in our database (`VIDEO`, `ARTICLE`, `QUIZ`). We will implement `ARTICLE` lessons using a beautiful, clean, glassmorphic Rich-Text input. The content will save to a `bodyContent` field on the `Lesson` database model.

### 1.5 SEO Fields (metaTitle and metaDescription)
* **Our Assessment:** Highly recommended. Instructors want their courses to rank on Google. Letting them optimize their title and description tags is a standard requirement for organic growth.
* **The Pitch:** Add `metaTitle` and `metaDescription` fields directly to the `Course` schema and integrate them into Next.js SEO metadata generation.

---

## 2. Dynamic Course Ratings & Star Reviews (Critical Addition)

Currently, the Prisma database has a model named `CourseReview` which tracks administrative approval/moderation states (APPROVED, CHANGES_REQUESTED, REJECTED). It does **not** track student course reviews. We need to create a dedicated table for student ratings.

### Proposed Prisma Schema Expansion
We will add `CourseRating` to store stars and comments:

```prisma
model CourseRating {
  id         String   @id @default(cuid())
  courseId   String
  studentId  String
  rating     Int      // Integer 1 to 5
  comment    String?  @db.Text
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  course     Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  student    User     @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@unique([studentId, courseId])
  @@index([courseId])
}
```

We will then compute and cache the average stars dynamically in the existing `LeaderboardCache` or display it directly using a Prisma aggregation call:
```typescript
const aggregations = await db.courseRating.aggregate({
  where: { courseId },
  _avg: { rating: true },
  _count: { rating: true }
});
```

---

## 3. Recommended Phased Implementation Plan

To deploy these changes cleanly without breaking the build, we will structure the development in three phases:

```mermaid
graph TD
    A[Phase 1: DB Schema Migration] --> B[Phase 2: Settings Tab Settings Pricing, Cert, SEO]
    B --> C[Phase 3: Auto-Save & Article Lessons]
    C --> D[Phase 4: Course Rating & Review System]
```

### Phase 1: Database Migration
Add the necessary columns to `schema.prisma`:
1. `certificateEnabled` (Boolean, default: false) on `Course`
2. `metaTitle` / `metaDescription` (String, nullable) on `Course`
3. `bodyContent` (String, text, nullable) on `Lesson`
4. The `CourseRating` table for student reviews.

### Phase 2: Course Settings UI Update
Update the Settings tab within the Instructor Dashboard Course Builder to include:
* Pricing options (Free vs. Paid input field).
* Certificate on Completion checkbox.
* Search Engine Optimization (SEO) cards.

### Phase 3: Auto-Save & Rich-Text Articles
* Integrate the debounced save hook in `LessonEditor.tsx`.
* Add custom rich-text block inputs when `contentType === "ARTICLE"`.

### Phase 4: Student Reviews & Learner Progress
* Add rating stars inputs on the Course Watch page upon completion.
* Render stars and average count on "My Learnings" and course cards.

---

## 4. What Claude Missed: The Missing Pillars of a World-Class LMS

To elevate CSCN Academy to a world-class standard on par with platforms like Coursera and Udemy, the following key elements should be added to the builder and player:

### 4.1 Granular Progress Telemetry (Resume Playback)
* **The Gap:** Right now, we only track `completedAt` on `LessonProgress` (a binary yes/no). 
* **The Upgrade:** A premium LMS needs to track the exact playback position (`lastSeekTime` in seconds) and `percentComplete` (e.g. 78%). 
  * **UX Value:** The student can click "Resume" on any course and start exactly where they paused.
  * **Instructor Value:** Generates watch-time drop-off charts (e.g., "90% of students stop watching after minute 4 of Lesson 2").

### 4.2 Lesson-Level Draft vs. Published States
* **The Gap:** Currently, if a course is published, any changes or additions to modules/lessons immediately go live.
* **The Upgrade:** Introduce an `isPublished` (Boolean, default: false) on `Lesson` and `Module`.
  * **Value:** Allows instructors to draft new sections or update lessons for an existing course without confusing current students, then release them in a single click.

### 4.3 Resource Upload & Management UI
* **The Gap:** While the Prisma schema defines a `LessonResource` model (for PDFs, links, ZIP files), the curriculum editor lacks a dedicated drag-and-drop resource upload and management tray.
* **The Upgrade:** Build a "Resources" manager inside `LessonEditor` where files can be uploaded directly to cloud storage and linked to the lesson.

### 4.4 Private Timestamped Bookmarks / Notes
* **The Gap:** Students have no way to take notes during long videos.
* **The Upgrade:** Allow students to write private notes that get auto-linked to the current video timestamp (e.g., "Note at 14:02 - pay attention to database indexing"). Clicking the note jumps the player directly to that time.

