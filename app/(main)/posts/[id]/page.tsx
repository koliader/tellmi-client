import { PostViewPage } from "@/src/screens/Post/View";

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <PostViewPage postId={id} />;
}
