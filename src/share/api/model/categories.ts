export interface ICategory {
  id: number;
  name: string;
  color: string;
}
export interface ICreateCategoryReq {
  name: string;
  color: string;
}
export interface IEditCategoryReq {
  id: number;
  name: string;
  color: string;
}
