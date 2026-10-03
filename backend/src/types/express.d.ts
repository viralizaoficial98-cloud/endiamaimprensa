export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
  name: string;
  roleId: string;
  roleName: string;
  permissions: string[];
  mustChangePassword: boolean;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
