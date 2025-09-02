import { useContext } from "react";
import AuthContext from "./AuthContextObject";

export default function useAuth() {
  const ctx = useContext(AuthContext);
  return ctx ?? {
    accessToken: null,
    currentUser: null,
    setCurrentUser: () => {},
    loading: false,
    login: async () => { throw new Error("AuthProvider is not mounted"); },
    logout: () => {},
  };
}


