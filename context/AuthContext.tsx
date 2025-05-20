import React, { createContext, useState } from "react";

interface User {
  id?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  email?: string;
  phone?: string;
  address?: string;
  profilePic?: string;
  referralCode?: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
