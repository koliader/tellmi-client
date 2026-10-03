export interface ICategory {
  id: number;
  name: string;
  color: string;
  /**
   * Whether this is the reserved category that deleted posts fall into.
   *
   * False for every ordinary category, including ones a member named "Unknown"
   * before the reserved row took that name. Clients keep it out of the pickers: it
   * is a bucket the system files things in, not a topic anybody chose, so offering
   * it for writing into invites posts nobody meant to put there.
   */
  isFallback?: boolean;
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
