import { Role } from "../constants/enums";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  status?: string;
  isEmailVerified: boolean;
  createdAt: string;
  authProviders?: string[];
  googleLinked?: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

