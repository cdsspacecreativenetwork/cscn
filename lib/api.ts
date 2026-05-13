// Mock API data and fetching logic for the CSCN platform
import type { CourseCardProps } from '@/components/ui/CourseCard';

export interface Stat {
  id: number;
  label: string;
  value: string;
  type: 'normal' | 'rating';
}

export interface Tool {
  id: number;
  name: string;
  icon: string;
}

export interface Course {
  id: string;
  title: string;
  category: 'Design' | 'Development' | 'AI' | 'Brand';
  description: string;
  lessons: string;
  duration: string;
  author: string;
  authorRole: string;
  authorAvatar: string;
  image: string;
  rating: number;
  reviews: number;
  level: string;
  syllabus: { title: string; lessons: number }[];
}

export const getStats = async () => {
  return {
    mainStats: [
      { id: 1, label: 'Members', value: '100+', type: 'normal' },
      { id: 2, label: 'Classes', value: '25', type: 'normal' },
      { id: 3, label: 'Ratings', value: '4.95', type: 'rating' }
    ] as Stat[],
    tools: [
      { id: 1, name: 'UIUX Design', icon: '/assets/tools/figma.svg' },
      { id: 2, name: 'UI Engineering', icon: '/assets/tools/claude.svg' },
      { id: 3, name: 'Master AI Automation', icon: '/assets/tools/ai-magic.svg' },
      { id: 4, name: 'Brand Identity', icon: '/assets/tools/pen-tool.svg' },
      { id: 5, name: 'Motion Design', icon: '/assets/tools/after-effects.svg' },
      { id: 6, name: 'Create Illustrations', icon: '/assets/tools/illustrator.svg' },
      { id: 7, name: 'Web Development', icon: '/assets/tools/vscode.svg' },
      { id: 8, name: 'Master Photoshop', icon: '/assets/tools/photoshop.svg' },
      { id: 9, name: 'Get Inspired...', icon: '/assets/tools/brain.svg' },
      { id: 10, name: 'Master Prototyping', icon: '/assets/tools/figma.svg' }
    ] as Tool[]
  };
};

export const getCourses = async (): Promise<Course[]> => {
  return [
    { 
      id: 'brand-positioning',
      title: 'How to position your brand to attract global audience.', 
      category: 'Brand',
      description: 'Learn the strategic foundations of brand positioning and how to scale your brand to international markets with proven frameworks.',
      lessons: '5', 
      duration: '2 hours',
      author: 'Chris John',
      authorRole: 'Brand Strategist',
      authorAvatar: '/assets/courses/Frame 2147228498.svg',
      image: '/assets/courses/Frame 2147239560.svg',
      rating: 4.8,
      reviews: 3200,
      level: 'Advanced',
      syllabus: [
        { title: 'What is Brand Positioning?', lessons: 1 },
        { title: 'Identifying Your Global Audience', lessons: 1 },
        { title: 'The Messaging Framework', lessons: 1 },
        { title: 'Visual Identity for Global Markets', lessons: 1 },
        { title: 'Case Studies', lessons: 1 },
      ]
    },
    { 
      id: 'figma-uiux',
      title: 'Figma UIUX Design for beginners', 
      category: 'Design',
      description: 'Master Figma from scratch. Learn to design beautiful, functional user interfaces and create high-fidelity prototypes for web and mobile.',
      lessons: '55', 
      duration: '12 hours',
      author: 'Honest Ernest',
      authorRole: 'Senior Product Designer',
      authorAvatar: '/assets/courses/Frame 2147228498-1.svg',
      image: '/assets/courses/Frame 2147239560-1.svg',
      rating: 4.9,
      reviews: 12450,
      level: 'Beginner',
      syllabus: [
        { title: 'Introduction to Figma', lessons: 5 },
        { title: 'Design Principles & Foundations', lessons: 10 },
        { title: 'Working with Components & Variants', lessons: 15 },
        { title: 'Advanced Prototyping', lessons: 15 },
        { title: 'Handover & Collaboration', lessons: 10 },
      ]
    },
    { 
      id: 'brand-identity',
      title: 'Brand Identity Essentials with Ai & Ps', 
      category: 'Brand',
      description: 'Combine the power of Adobe Illustrator and Photoshop to create professional, scalable brand identities from concept to execution.',
      lessons: '25', 
      duration: '10 hours',
      author: 'Ayomide Ajayi',
      authorRole: 'Creative Director',
      authorAvatar: '/assets/courses/Frame 2147228498-2.svg',
      image: '/assets/courses/Frame 2147239560-2.svg',
      rating: 4.9,
      reviews: 0,
      level: 'Intermediate',
      syllabus: [
        { title: 'Identity Fundamentals', lessons: 5 },
        { title: 'Vector Mastery in Illustrator', lessons: 8 },
        { title: 'Advanced Effects in Photoshop', lessons: 7 },
        { title: 'Mockups & Presentation', lessons: 5 },
      ]
    },
    { 
      id: 'build-with-ai',
      title: 'Learn how to Build with AI. Launch Real Products', 
      category: 'AI',
      description: 'Harness AI tools to accelerate your product development. Learn to prompt, automate, and build production-ready apps using modern AI stacks.',
      lessons: '20', 
      duration: '9 hours',
      author: 'Barry Dubor',
      authorRole: 'AI Engineer & Product Lead',
      authorAvatar: '/assets/courses/Frame 2147228498-3.svg',
      image: '/assets/courses/Frame 2147239560-3.svg',
      rating: 4.7,
      reviews: 5600,
      level: 'Intermediate',
      syllabus: [
        { title: 'The AI Landscape', lessons: 3 },
        { title: 'Prompt Engineering for Developers', lessons: 7 },
        { title: 'Building with LLM APIs', lessons: 5 },
        { title: 'Deployment & Scaling AI Apps', lessons: 5 },
      ]
    },
    // Adding duplicates for pagination testing
    { ...course('brand-positioning-2', 'Brand Strategy for Global Markets', 'Brand', 'Chris John', 'Frame 2147239560.svg', 'Frame 2147228498.svg'), id: 'brand-positioning-2' },
    { ...course('figma-advanced', 'Advanced Figma Component Systems', 'Design', 'Honest Ernest', 'Frame 2147239560-1.svg', 'Frame 2147228498-1.svg'), id: 'figma-advanced' },
    { ...course('logo-mastery', 'Logo Design Fundamentals', 'Brand', 'Ayomide Ajayi', 'Frame 2147239560-2.svg', 'Frame 2147228498-2.svg'), id: 'logo-mastery' },
    { ...course('ai-automation', 'Mastering AI Automation Workflows', 'AI', 'Barry Dubor', 'Frame 2147239560-3.svg', 'Frame 2147228498-3.svg'), id: 'ai-automation' },
    { ...course('react-dev', 'Modern React Development with Next.js', 'Development', 'Honest Ernest', 'Frame 2147239560-1.svg', 'Frame 2147228498-1.svg'), id: 'react-dev' },
    { ...course('ui-principles', 'Visual Design Principles for UI', 'Design', 'Ayomide Ajayi', 'Frame 2147239560-2.svg', 'Frame 2147228498-2.svg'), id: 'ui-principles' },
    { ...course('ai-creative', 'AI for Creative Professionals', 'AI', 'Barry Dubor', 'Frame 2147239560-3.svg', 'Frame 2147228498-3.svg'), id: 'ai-creative' },
    { ...course('global-branding', 'Global Branding: A Strategic Guide', 'Brand', 'Chris John', 'Frame 2147239560.svg', 'Frame 2147228498.svg'), id: 'global-branding' },
    { ...course('design-systems', 'Scaling Design Systems in Figma', 'Design', 'Honest Ernest', 'Frame 2147239560-1.svg', 'Frame 2147228498-1.svg'), id: 'design-systems' },
    { ...course('fullstack-ai', 'Fullstack AI Product Development', 'AI', 'Barry Dubor', 'Frame 2147239560-3.svg', 'Frame 2147228498-3.svg'), id: 'fullstack-ai' },
    { ...course('brand-psychology', 'The Psychology of Branding', 'Brand', 'Chris John', 'Frame 2147239560.svg', 'Frame 2147228498.svg'), id: 'brand-psychology' },
    { ...course('ui-prototyping', 'High Fidelity Prototyping', 'Design', 'Honest Ernest', 'Frame 2147239560-1.svg', 'Frame 2147228498-1.svg'), id: 'ui-prototyping' }
  ];
};

// Helper for mock data
function course(id: string, title: string, category: any, author: string, image: string, avatar: string) {
  return {
    id,
    title,
    category,
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    lessons: "12",
    duration: "4 hours",
    author,
    authorRole: "Expert Instructor",
    authorAvatar: `/assets/courses/${avatar}`,
    image: `/assets/courses/${image}`,
    rating: 4.8,
    reviews: 120,
    level: "Intermediate",
    syllabus: []
  };
}

export function getMockCourseCards(): CourseCardProps[] {
  const rawCourses: Course[] = [
    {
      id: 'brand-positioning', title: 'How to position your brand to attract global audience.',
      category: 'Brand', description: 'Learn the strategic foundations of brand positioning and how to scale your brand to international markets with proven frameworks.',
      lessons: '5', duration: '2 hours', author: 'Chris John', authorRole: 'Brand Strategist',
      authorAvatar: '/assets/courses/Frame 2147228498.svg', image: '/assets/courses/Frame 2147239560.svg',
      rating: 4.8, reviews: 3200, level: 'Advanced', syllabus: [],
    },
    {
      id: 'figma-uiux', title: 'Figma UIUX Design for beginners',
      category: 'Design', description: 'Master Figma from scratch. Learn to design beautiful, functional user interfaces and create high-fidelity prototypes for web and mobile.',
      lessons: '55', duration: '12 hours', author: 'Honest Ernest', authorRole: 'Senior Product Designer',
      authorAvatar: '/assets/courses/Frame 2147228498-1.svg', image: '/assets/courses/Frame 2147239560-1.svg',
      rating: 4.9, reviews: 12450, level: 'Beginner', syllabus: [],
    },
    {
      id: 'brand-identity', title: 'Brand Identity Essentials with Ai & Ps',
      category: 'Brand', description: 'Combine the power of Adobe Illustrator and Photoshop to create professional, scalable brand identities from concept to execution.',
      lessons: '25', duration: '10 hours', author: 'Ayomide Ajayi', authorRole: 'Creative Director',
      authorAvatar: '/assets/courses/Frame 2147228498-2.svg', image: '/assets/courses/Frame 2147239560-2.svg',
      rating: 4.9, reviews: 0, level: 'Intermediate', syllabus: [],
    },
    {
      id: 'build-with-ai', title: 'Learn how to Build with AI. Launch Real Products',
      category: 'AI', description: 'Harness AI tools to accelerate your product development. Learn to prompt, automate, and build production-ready apps using modern AI stacks.',
      lessons: '20', duration: '9 hours', author: 'Barry Dubor', authorRole: 'AI Engineer & Product Lead',
      authorAvatar: '/assets/courses/Frame 2147228498-3.svg', image: '/assets/courses/Frame 2147239560-3.svg',
      rating: 4.7, reviews: 5600, level: 'Intermediate', syllabus: [],
    },
    {
      id: 'react-dev', title: 'Modern React Development with Next.js',
      category: 'Development', description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      lessons: '12', duration: '4 hours', author: 'Honest Ernest', authorRole: 'Expert Instructor',
      authorAvatar: '/assets/courses/Frame 2147228498-1.svg', image: '/assets/courses/Frame 2147239560-1.svg',
      rating: 4.8, reviews: 120, level: 'Intermediate', syllabus: [],
    },
  ];

  return rawCourses.map((c) => ({
    id: c.id,
    title: c.title,
    category: c.category,
    description: c.description,
    lessons: c.lessons,
    duration: c.duration,
    author: c.author,
    authorAvatar: c.authorAvatar,
    image: c.image,
    rating: c.rating,
    students: c.reviews.toLocaleString(),
    level: c.level,
  }));
}

export const getInstructors = async () => {
  const courses = await getCourses();
  const instructors = Array.from(new Set(courses.map(c => c.author)));
  return instructors;
};

export const getCourseById = async (id: string): Promise<Course | undefined> => {
  const courses = await getCourses();
  return courses.find(c => c.id === id);
};
