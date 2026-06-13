export interface Mentor {
  id: string;
  name: string;
  role: string;
  image: string;
  slug?: string;
  courses: number;
  students: string;
  priceLabel?: string;
  intro?: string | null;
  instructions?: string | null;
  topics?: string[];
  availability?: import("@/lib/mentor-booking-slots").MentorAvailabilityInput[];
  slots?: import("@/lib/mentor-booking-slots").MentorBookingSlot[];
}

export const MENTORS: Mentor[] = [
  {
    id: 'chris-john',
    name: 'Chris John',
    role: 'Full-Stack Designer',
    image: '/assets/instructors/Frame 2147238910-5.png',
    courses: 25,
    students: '770K'
  },
  {
    id: 'ayomide-ajayi',
    name: 'Ayomide Ajayi',
    role: 'Digital Designer',
    image: '/assets/instructors/img-2.svg',
    courses: 3,
    students: '50K'
  },
  {
    id: 'honest-ernest',
    name: 'Honest Ernest',
    role: 'Product Designer',
    image: '/assets/instructors/img-1.svg',
    courses: 8,
    students: '150K'
  },
  {
    id: 'baribor-duba',
    name: 'Baribor Duba',
    role: 'Product Designer',
    image: '/assets/instructors/img.svg',
    courses: 12,
    students: '100K'
  }
];

export const MENTORSHIP_BENEFITS = [
  'Portfolio reviews',
  'Career guidance',
  'Project feedback',
  'Skill improvement',
  'Industry insights'
];

export const MENTORSHIP_STATS = [
  { label: 'Number of Learners', value: '3,150,000' },
  { label: 'Number of Courses', value: '150' },
  { label: 'Number of Mentees', value: '150' },
  { label: 'Average mentor rating', value: '4.8', isRating: true }
];
