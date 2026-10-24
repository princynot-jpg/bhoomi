import type { UserRole } from "../modules/users/user.model.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
        agency?: string;
        state?: string;
        district?: string;
      };
    }
  }
}

export {};
