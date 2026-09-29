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
import { CategoryBadge } from "@/src/share/ui/CategoryBadge";
import { ICategory } from "@/src/share/api/model/categories";
import { TPostsSort } from "@/src/share/api/model/posts";

const ALL_CATEGORIES = "all";

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
        placeholder="Search posts"
        aria-label="Search posts by title"
        className="pl-8"
      />
    </div>

    <Select
      value={categoryId ? String(categoryId) : ALL_CATEGORIES}
      onValueChange={(value) =>
        onCategoryChange(value === ALL_CATEGORIES ? 0 : Number(value))
      }
    >
      <SelectTrigger className="w-full cursor-pointer sm:w-44" aria-label="Filter by category">
        <SelectValue>
          {() => {
            const selected = categories.find((c) => c.id === categoryId);
            return selected ? selected.name : "All categories";
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={String(category.id)}>
              <CategoryBadge
                name={category.name}
                color={category.color}
              />
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>

    <Select
      value={sort}
      onValueChange={(value) => onSortChange(value as TPostsSort)}
    >
      <SelectTrigger className="w-full cursor-pointer sm:w-40" aria-label="Sort posts">
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
