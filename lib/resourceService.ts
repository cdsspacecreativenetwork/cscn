export type ResourceType = 'PDF' | 'Video' | 'Link' | 'Audio' | 'File';

export interface Resource {
  id: string;
  title: string;
  category: string;
  type: ResourceType;
  size?: string;
  thumbnail?: string;
}

export const getResources = async (query?: string, type?: string, course?: string): Promise<Resource[]> => {
  // Simulating API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const allResources: Resource[] = [
    {
      id: '1',
      title: 'Figma Component Guide',
      category: 'UI/UX Design',
      type: 'PDF',
      size: '2.5 MB'
    },
    {
      id: '2',
      title: 'Intro to Python',
      category: 'Software Development',
      type: 'Video',
      size: '150 MB'
    },
    {
      id: '3',
      title: 'Advanced JavaScript',
      category: 'Web Development',
      type: 'Link'
    },
    {
      id: '4',
      title: 'Data Science Roadmap',
      category: 'Data Science',
      type: 'File',
      size: '4.2 MB'
    },
    {
      id: '5',
      title: 'React Hooks Audio',
      category: 'Frontend Development',
      type: 'Audio',
      size: '12 MB'
    },
    {
      id: '6',
      title: 'Brand Identity Guidelines',
      category: 'Design Strategy',
      type: 'PDF',
      size: '1.8 MB'
    },
    {
      id: '7',
      title: 'Kubernetes Handbook',
      category: 'Cloud Computing',
      type: 'Link'
    }
  ];

  return allResources.filter(res => {
    const matchesQuery = !query || res.title.toLowerCase().includes(query.toLowerCase());
    const matchesType = !type || type === 'All Types' || res.type === type;
    return matchesQuery && matchesType;
  });
};
