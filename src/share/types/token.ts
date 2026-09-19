export interface IPayload {
  id: string; // uuid
  role: ERole;
  issued_at: string;
  expired_at: string;
}

export enum ERole {
  Admin = "ADMIN",
  User = "User",
}
