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
}

export interface ICreateCommentReq {
  comment: string;
  postId: number;
}

export interface IEditCommentReq {
  id: number;
  comment: string;
}
