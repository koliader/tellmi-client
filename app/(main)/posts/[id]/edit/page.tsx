import { EditPostPage } from "@/src/screens/Post/Edit";

export default async function EditPost({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <EditPostPage postId={id} />;
}
