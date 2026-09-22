import { PostForm } from "@/src/widgets/PostForm/ui";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { FC } from "react";

export const CreatePostPage: FC = () => {
  return (
    <div>
      <Link
        className="flex items-center gap-1 cursor-pointer hover:-translate-x-1 transition-transform duration-200"
        href={"/posts"}
      >
        <ArrowLeft strokeWidth={1.75} size="16px" />
        <span className="text-sm">Back to posts</span>
      </Link>
      <PostForm />
    </div>
  );
};
