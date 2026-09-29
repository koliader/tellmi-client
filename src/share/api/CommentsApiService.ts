import { api } from ".";
import {
  ICommentRow,
  ICreateCommentReq,
  IEditCommentReq,
} from "./model/comments";

export class CommentsApiService {
  /** Comments on a post, oldest first. */
  async listByPost(postId: number | string): Promise<ICommentRow[]> {
    return api
      .get<ICommentRow[]>(`/comments/post/${postId}`)
      .then((res) => res.data);
  }

  async create(req: ICreateCommentReq): Promise<void> {
    return api.post("/comments", req).then((res) => res.data);
  }

  async edit(req: IEditCommentReq): Promise<void> {
    return api.put("/comments", req).then((res) => res.data);
  }

  async remove(id: number | string): Promise<void> {
    return api.delete(`/comments/${id}`).then((res) => res.data);
  }
}
