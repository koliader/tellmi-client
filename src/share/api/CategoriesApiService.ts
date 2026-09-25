import { api } from ".";
import {
  ICategory,
  ICreateCategoryReq,
  IEditCategoryReq,
} from "./model/categories";

export class CategoriesApiService {
  async list(): Promise<ICategory[]> {
    return api.get<ICategory[]>("/categories").then((res) => res.data);
  }

  async create(req: ICreateCategoryReq): Promise<ICategory> {
    return api.post<ICategory>("/categories", req).then((res) => res.data);
  }

  async edit(req: IEditCategoryReq): Promise<void> {
    return api.put("/categories", req).then((res) => res.data);
  }

  async delete(id: number): Promise<void> {
    return api.delete(`/categories/${id}`).then((res) => res.data);
  }
}
