"use client";

import { FC } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategorySelect } from "@/src/share/ui/CategorySelect";
import { ICategory } from "@/src/share/api/model/categories";
import { TPostsSort } from "@/src/share/api/model/posts";

interface PostsFiltersProps {
  search: string;
  categoryId: number;
  sort: TPostsSort;
  categories: ICategory[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: number) => void;
  onSortChange: (value: TPostsSort) => void;
}

export const PostsFilters: FC<PostsFiltersProps> = ({
  search,
  categoryId,
  sort,
  categories,
  onSearchChange,
  onCategoryChange,
  onSortChange,
}) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
    <div className="relative flex-1">
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        type="search"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search posts or people"
        aria-label="Search posts by title or author"
        /*
         * Both the placeholder and the accessible name say the author is searched,
         * because it is. A box labelled "Search posts" that also matches a name
         * does something its label does not mention, and a visitor who types a
         * person's name and gets results cannot tell whether they matched the name
         * or a lucky word in a title.
         */
        className="pl-8"
      />
    </div>

    {/*
      Searchable rather than a fixed list. Fine at eight categories, unusable at
      forty -- and the reserved fallback is excluded, so this shows one fewer than
      the category page does, which is correct: it is not a topic to filter by.
    */}
    <CategorySelect
      id="posts-category-filter"
      categories={categories}
      value={categoryId}
      onChange={onCategoryChange}
      className="w-full sm:w-48"
    />

    <Select
      value={sort}
      onValueChange={(value) => onSortChange(value as TPostsSort)}
    >
      <SelectTrigger
        className="w-full cursor-pointer sm:w-40"
        aria-label="Sort posts"
      >
        <SelectValue>
          {() => (sort === "oldest" ? "Oldest" : "Newest")}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="newest">Newest</SelectItem>
          <SelectItem value="oldest">Oldest</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  </div>
);
