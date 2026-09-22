import { api } from ".";
import { ICategory } from "./model/categories";

export class CategoriesApiService {
  async list(): Promise<ICategory[]> {
    return api.get<ICategory[]>("/categories").then((res) => res.data);
  }
}