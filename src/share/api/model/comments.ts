import { IPostAuthor, IPostRow } from "./posts";

export interface ICommentRow {
  id: number;
  comment: string;
  postId: number;
  user: IPostAuthor;
  /** The post this comment belongs to. */
  post?: IPostRow;
  /** Creation time as Unix epoch milliseconds. Omitted when unset. */
  createdAt?: number;
  /**
   * When the text was last changed, as Unix epoch milliseconds.
   *
   * Absent means never edited, which is the common case -- so the "edited" marker
   * is driven by this one value rather than by a separate flag that could disagree
   * with it.
   */
  updatedAt?: number;
}

export interface ICommentsByUserRes {
  comments: ICommentRow[];
  /**
   * Total matching the filter, ignoring limit/offset.
   *
   * Required, not optional, and always sent: 0 is a real answer for a member
   * who has only read, and the tab has to be able to say "no comments yet"
   * rather than look like it is still loading.
   */
  totalCount: number;
}

export interface ICreateCommentReq {
  comment: string;
  postId: number;
}

export interface IEditCommentReq {
  id: number;
  comment: string;
}
