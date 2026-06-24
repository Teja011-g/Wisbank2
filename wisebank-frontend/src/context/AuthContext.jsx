import { createContext, useContext, useState } from "react";
import { loginUser } from "../api/wisebankApi";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const savedUser = localStorage.getItem("wisebank_user");

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      localStorage.removeItem("wisebank_user");
      return null;
    }
  });

  async function login(loginId, password) {
    try {
      setCurrentUser(null);
      localStorage.removeItem("wisebank_user");

      const response = await loginUser({
        login_id: loginId.trim(),
        password: password.trim()
      });

      const user = response.data;

      console.log("LOGIN USER FROM BACKEND:", user);

      setCurrentUser(user);
      localStorage.setItem("wisebank_user", JSON.stringify(user));

      return {
        success: true,
        user
      };
    } catch (error) {
      setCurrentUser(null);
      localStorage.removeItem("wisebank_user");

      return {
        success: false,
        message: error.response?.data?.detail || "Login failed"
      };
    }
  }

  function updateCurrentUser(user) {
    setCurrentUser(user);
    localStorage.setItem("wisebank_user", JSON.stringify(user));
  }

  function logout() {
    setCurrentUser(null);
    localStorage.removeItem("wisebank_user");
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        logout,
        updateCurrentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
