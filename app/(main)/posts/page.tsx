import { AllPostsPage, type IPostsFiltersSeed } from "@/src/screens/Posts/All";

/**
 * The feed is driven by the query string.
 *
 * The filters are read here and handed to the client as plain props rather
 * than with `useSearchParams` inside a Suspense boundary. That hook makes Next
 * defer the whole subtree to the client on a prerendered route, and in dev the
 * deferred chunk was unreliable, leaving the feed stuck on its skeleton.
 * Passing the values down keeps the first render complete on the server.
 */
export default async function AllPosts({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  const rawSort = first(params.sort);
  const rawCategory = Number(first(params.categoryId));

  const seed: IPostsFiltersSeed = {
    search: first(params.search) ?? "",
    categoryId:
      Number.isFinite(rawCategory) && rawCategory > 0 ? rawCategory : 0,
    sort: rawSort === "oldest" ? "oldest" : "newest",
  };

  return <AllPostsPage initialFilters={seed} />;
}
