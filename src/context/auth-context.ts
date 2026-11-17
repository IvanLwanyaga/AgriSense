import { createContext } from "react";
import type { User } from "firebase/auth";
import type { UserProfile } from "../types/user";

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  profile: UserProfile | null;
  isEmailVerified: boolean;
  refreshAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  profile: null,
  isEmailVerified: false,
  refreshAuth: async () => {},
});
