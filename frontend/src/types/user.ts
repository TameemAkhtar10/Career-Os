import { Role } from "../constants/enums";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

