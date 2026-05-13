import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CoursePage({ params }: Props) {
  const { id } = await params;
  // Redirect to the public course detail page
  redirect(`/courses/${id}`);
}
