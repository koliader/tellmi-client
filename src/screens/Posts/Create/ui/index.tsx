import { PostForm } from "@/src/widgets/PostForm/ui";
import { BackLink } from "@/src/share/ui/BackLink";
import { FC } from "react";

export const CreatePostPage: FC = () => {
  return (
    <div>
      <BackLink href="/posts" label="Back to posts" />
      <PostForm />
    </div>
  );
};
