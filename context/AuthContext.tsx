import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AuthContext = createContext<{
  user: string | null;
  setUser: (user: string | null) => void;
} | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUserState] = useState<string | null>(null);

  // Save user to AsyncStorage
  const setUser = async (user: string | null) => {
    setUserState(user);
    if (user) {
      await AsyncStorage.setItem("user", user);
    } else {
      await AsyncStorage.removeItem("user");
    }
  };

  // Load user from AsyncStorage
  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        setUserState(storedUser);
      } else {
        setUserState(null);
      }
    };
    loadUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export { AuthProvider, useAuth, AuthContext };
