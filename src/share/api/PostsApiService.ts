import { api } from ".";
import {
  IPost,
  IPostRow,
  IPostsListReq,
  IPostsListRes,
} from "./model/posts";

export interface ICreatePostReq {
  title: string;
  description: string;
  categoryId: number;
}

export interface IEditPostReq extends ICreatePostReq {
  id: number;
}

export class PostsApiService {
  async create(req: ICreatePostReq): Promise<IPost> {
    return api.post<IPost>("/posts", req).then((res) => res.data);
  }

  async edit(req: IEditPostReq): Promise<void> {
    return api.put("/posts", req).then((res) => res.data);
  }

  async getById(id: number | string): Promise<IPostRow> {
    return api.get<IPostRow>(`/posts/${id}`).then((res) => res.data);
  }

  async remove(id: number | string): Promise<void> {
    return api.delete(`/posts/${id}`).then((res) => res.data);
  }

  /**
   * Lists a page of posts. `search`, `categoryId` and `sort` are optional
   * filters; empty values are omitted so the API applies no filter.
   */
  async list(req: IPostsListReq): Promise<IPostsListRes> {
    const params: Record<string, string | number> = {
      limit: req.limit,
      offset: req.offset,
    };

    if (req.search) {
      params.search = req.search;
    }
    if (req.categoryId) {
      params.categoryId = req.categoryId;
    }
    if (req.sort) {
      params.sort = req.sort;
    }

    return api.get<IPostsListRes>("/posts", { params }).then((res) => res.data);
  }
}
