import { useContext } from "react";
import AuthContext from "./AuthContextObject";

export default function useAuth() {
  return useContext(AuthContext);
}


