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
  /**
   * Whether the author has an avatar, and when it last changed (Unix ms).
   *
   * Metadata only -- the image is fetched from /avatars/:id, and the timestamp is
   * the cache-busting version. Both are supplied by every listing that projects an
   * author, so a card, a post page and a comment all resolve the same URL.
   */
  hasAvatar?: boolean;
  avatarUpdatedAt?: number;
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
  /**
   * Case-insensitive substring match against the post title OR the author's
   * username.
   *
   * One term over both fields rather than a separate mode, so a visitor who types
   * a name into the search box gets that person's posts without having to say so.
   */
  search?: string;
  /** Restrict to one category. Omit or 0 for all categories. */
  categoryId?: number;
  sort?: TPostsSort;
  /**
   * Restrict to one author, for a profile page. Omit for every author.
   *
   * A uuid, because that is what a user is keyed by and the profile already
   * holds it.
   */
  userId?: string;
}

export interface IPostsListRes {
  posts: IPostRow[];
  /**
   * Total matching posts, ignoring limit/offset.
   *
   * Required, not optional, and the API always sends it: 0 is the answer for a
   * member who has not posted, and a profile page has to be able to say so
   * rather than treat the absence as "still loading".
   */
  totalCount: number;
}
