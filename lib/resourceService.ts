export type ResourceType = 'PDF' | 'LINK' | 'FILE';
export type ResourceScope = 'student' | 'instructor';

export interface Resource {
  id: string;
  title: string;
  category: string;
  type: ResourceType;
  size?: string;
  thumbnail?: string;
  url: string;
  courseTitle: string;
  lessonTitle: string;
  scope: ResourceScope;
  usageCount?: number;
}

export interface ResourceResponse {
  resources: Resource[];
  courses: string[];
}

export const getResources = async (
  query?: string,
  type?: string,
  course?: string,
  scope: ResourceScope = 'student'
): Promise<ResourceResponse> => {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (type && type !== 'All Types') params.set('type', type);
  if (course && course !== 'All Courses') params.set('course', course);
  params.set('scope', scope);

  const response = await fetch(`/api/dashboard/resources?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch resources');
  return response.json();
};
