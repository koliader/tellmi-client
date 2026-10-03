import { api } from ".";
import {
  ICommentRow,
  ICommentsByUserRes,
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

  /**
   * Creates a comment and returns the id the server assigned it.
   *
   * The gateway answers with the created row, but a caller that needs to know
   * which comment is its own must key off the id rather than off position in
   * the thread: two people posting at once means "the last comment" is not
   * reliably the one just written, and marking the wrong row as yours is worse
   * than not marking anything.
   *
   * `id` is the whole of what is returned, and it is read defensively -- the
   * field carries `omitempty`, so a response that somehow lacks it yields
   * `undefined` rather than a row that would match nothing.
   */
  /**
   * Comments one member has written, newest first, for a profile's comments tab.
   *
   * Public, like the post it sits on, so it is sent without an Authorization
   * header and works for a reader who is not signed in.
   */
  async listByUser(
    userId: string,
    limit: number,
    offset = 0,
  ): Promise<ICommentsByUserRes> {
    return api
      .get<ICommentsByUserRes>(`/comments/user/${userId}`, {
        params: { limit, offset },
      })
      .then((res) => res.data);
  }

  async create(req: ICreateCommentReq): Promise<{ id?: number }> {
    return api.post<{ id?: number }>("/comments", req).then((res) => res.data);
  }

  async edit(req: IEditCommentReq): Promise<void> {
    return api.put("/comments", req).then((res) => res.data);
  }

  async remove(id: number | string): Promise<void> {
    return api.delete(`/comments/${id}`).then((res) => res.data);
  }
}
