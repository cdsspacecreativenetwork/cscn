export interface Resource {
  id: string;
  title: string;
  price: number | 'Free';
  label: 'Free' | 'Paid';
  image: string;
}

export interface CourseMaterial {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export const RESOURCES: Resource[] = [
  {
    id: 'bag-mockup',
    title: 'Bag mockup',
    price: 'Free',
    label: 'Free',
    image: '/assets/resources/Frame 2147239560-5.svg',
  },
  {
    id: 'banking-app',
    title: 'Banking app mobile template',
    price: 100,
    label: 'Paid',
    image: '/assets/resources/Frame 2147239560-7.svg',
  },
  {
    id: 'food-landing',
    title: 'Food landing page template',
    price: 35,
    label: 'Paid',
    image: '/assets/resources/Frame 2147239560-4.svg',
  },
  {
    id: 'fragrance-mockup',
    title: 'Fragrance mockup',
    price: 'Free',
    label: 'Free',
    image: '/assets/resources/Frame 2147239560-3.svg',
  }
];

export const COURSE_MATERIALS: CourseMaterial[] = [
  {
    id: 'after-effects',
    title: 'Adobe After Effects',
    description: 'Motion Graphic cheat sheet for after effect',
    icon: '/assets/resources/Frame 2147239560-6.svg',
  },
  {
    id: 'illustrator',
    title: 'Adobe Illustrator',
    description: 'Learn how to become a better digital artist',
    icon: '/assets/resources/Frame 2147239560-2.svg',
  },
  {
    id: 'claude',
    title: 'Claude',
    description: 'Become a better UI Engineer using Claude engine',
    icon: '/assets/resources/Frame 2147239560-1.svg',
  },
  {
    id: 'figma',
    title: 'Figma',
    description: 'Figma essentials for UIUX Designers.',
    icon: '/assets/resources/Frame 2147239560.svg',
  }
];
