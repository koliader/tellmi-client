import { api } from ".";
import { ICategory, ICreateCategoryReq } from "./model/categories";

export class CategoriesApiService {
  async list(): Promise<ICategory[]> {
    return api.get<ICategory[]>("/categories").then((res) => res.data);
  }

  async create(req: ICreateCategoryReq): Promise<ICategory> {
    return api.post<ICategory>("/categories", req).then((res) => res.data);
  }
}
