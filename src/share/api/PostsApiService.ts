import { api } from ".";
import { IPost } from "./model/posts";

export interface ICreatePostReq {
  title: string;
  description: string;
  categoryId: number;
}

export class PostsApiService {
  async create(req: ICreatePostReq): Promise<IPost> {
    return api.post<IPost>("/posts", req).then((res) => res.data);
  }
}