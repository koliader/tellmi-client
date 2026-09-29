export interface IPost {
  id: number;
  title: string;
  description: string;
  userId: string;
  categoryId: number;
}

export interface IPostAuthor {
  id: string;
  username: string;
}

export interface IPostCategory {
  id: number;
  name: string;
  /**
   * Hex colour, e.g. "#7176f7". Required: the API validates it on write, the
   * column is NOT NULL with a default, and a CHECK rejects blanks — so a
   * category always has one.
   */
  color: string;
}

/** A post as returned by the list and get-by-id endpoints. */
export interface IPostRow {
  id: number;
  title: string;
  description: string;
  user: IPostAuthor;
  category: IPostCategory;
  /** Creation time as Unix epoch milliseconds. Omitted when unset. */
  createdAt?: number;
  /** Number of comments on the post. Omitted by the API when zero. */
  commentsCount?: number;
}

export type TPostsSort = "newest" | "oldest";

export interface IPostsListReq {
  limit: number;
  offset: number;
  /** Case-insensitive substring match on the title. */
  search?: string;
  /** Restrict to one category. Omit or 0 for all categories. */
  categoryId?: number;
  sort?: TPostsSort;
}

export interface IPostsListRes {
  posts: IPostRow[];
  /** Total matching posts, ignoring limit/offset. */
  totalCount: number;
}
