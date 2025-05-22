import { View, Text, SafeAreaView, Image } from "react-native";
import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/context/AuthContext";

interface User {
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  phone: string;
  address: string;
  referralCode: string;
  profilePicUrl: string; // Add profilePicUrl property
}

const profile = () => {
  const context = useContext(AuthContext);
  const user = context?.user;
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null); // Initialize as null

  useEffect(() => {
    console.log("Profile page user:", user); // Log the user value
    async function fetchUser() {
      if (!user) return;
      const response = await fetch("http://192.168.68.107:8080/api/user/myinfo", {
        headers: {
          Authorization: `Bearer ${user}`,
        },
      });
      const data = await response.json();
      setLoggedInUser(data);
    }
    fetchUser();
  }, [user]);

  return (
    <SafeAreaView>
      {loggedInUser ? (
        <View>
          <Image
            source={{ uri: loggedInUser.profilePicUrl }} // Render the image
            style={{ width: 100, height: 100, borderRadius: 50 }} // Style the image
          />
          <Text>First Name: {loggedInUser.firstName}</Text>
          <Text>Last Name: {loggedInUser.lastName}</Text>
          <Text>Username: {loggedInUser.userName}</Text>
          <Text>Email: {loggedInUser.email}</Text>
          <Text>Phone: {loggedInUser.phone}</Text>
          <Text>Address: {loggedInUser.address}</Text>
          <Text>Referral Code: {loggedInUser.referralCode}</Text>
        </View>
      ) : (
        <Text>Loading user data...</Text>
      )}
    </SafeAreaView>
  );
};

export default profile;
