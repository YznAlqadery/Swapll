import React, { createContext, useContext, useState, ReactNode } from "react";

type User = {
  referralCode: string;
  myReferralCode: string;
  id: string;
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  bio?: string;
  profilePic?: string;
  // add other user fields as needed
};

type LoggedInUserContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
};

const LoggedInUserContext = createContext<LoggedInUserContextType | undefined>(
  undefined
);

export const LoggedInUserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  return (
    <LoggedInUserContext.Provider value={{ user, setUser }}>
      {children}
    </LoggedInUserContext.Provider>
  );
};

export const useLoggedInUser = () => {
  const context = useContext(LoggedInUserContext);
  if (!context) {
    throw new Error(
      "useLoggedInUser must be used within a LoggedInUserProvider"
    );
  }
  return context;
};
