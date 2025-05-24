import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  Image,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import * as FileSystem from "expo-file-system";
import { AuthContext } from "@/context/AuthContext";
import { MaterialIcons, FontAwesome5, Entypo } from "@expo/vector-icons";
import { useRouter } from "expo-router";
interface User {
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  phone: string;
  address: string;
  referralCode: string | null;
  profilePic: string;
}

const Profile = () => {
  const authContext = useContext(AuthContext);
  const token = authContext?.user ?? null;
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();

  const handleLogout = () => {
    authContext?.setUser(null);
    router.replace("/(auth)/Login");
  };

  useEffect(() => {
    async function fetchUser() {
      if (!token) return;

      try {
        const res = await fetch(`http://192.168.68.107:8080/api/user/myinfo`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setLoggedInUser(data);
      } catch (error) {
        console.error("Failed fetching user info:", error);
      }
    }

    fetchUser();
  }, [token]);

  useEffect(() => {
    async function fetchProfileImage() {
      if (!loggedInUser?.profilePic || !token) return;

      setIsLoading(true);
      try {
        // Compose full image URL
        const imageUrl = "http://192.168.68.107:8080" + loggedInUser.profilePic;

        // Create a local file path to save the image
        const localUri = `${FileSystem.cacheDirectory}profile-pic.jpg`;

        // Download the image with authorization headers
        const downloadRes = await FileSystem.downloadAsync(imageUrl, localUri, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setLocalImageUri(downloadRes.uri);
      } catch (error) {
        console.error("Failed downloading profile pic:", error);
        setLocalImageUri(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfileImage();
  }, [loggedInUser, token]);

  if (!loggedInUser) {
    return (
      <SafeAreaView>
        <ActivityIndicator size="large" color="#008B8B" />
        <Text>Loading user data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <MaterialIcons name="arrow-back" size={28} color="#008B8B" />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.logout}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <MaterialIcons name="logout" size={28} color="#008B8B" />
      </TouchableOpacity>

      <View style={styles.profileContainer}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#008B8B" />
        ) : localImageUri ? (
          <View style={styles.profilePicWrapper}>
            <Image source={{ uri: localImageUri }} style={styles.profilePic} />
          </View>
        ) : (
          <Text>No profile picture available</Text>
        )}

        <View>
          <Text style={styles.username}>
            {loggedInUser.firstName.substring(0, 1).toLocaleUpperCase() +
              loggedInUser.firstName.substring(1)}{" "}
            {loggedInUser.lastName.substring(0, 1).toLocaleUpperCase() +
              loggedInUser.lastName.substring(1)}
          </Text>
        </View>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "bold",
            fontFamily: "OpenSans_700Bold",
            marginBottom: 16,
          }}
        >
          @{loggedInUser.userName}
        </Text>
      </View>
      <Text
        style={{
          fontSize: 16,
          fontWeight: "bold",
          textAlign: "left",
          marginTop: 16,
          marginLeft: 16,
          fontFamily: "OpenSans_700Bold",
        }}
      >
        Personal Information
      </Text>

      <View style={styles.personalInfo}>
        <View style={styles.infoBox}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <MaterialIcons
              name="email"
              size={20}
              color="#fff"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.infoLabel}>Email</Text>
          </View>
          <Text style={styles.infoText}>{loggedInUser.email}</Text>
        </View>
        <View style={styles.infoBox}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <FontAwesome5
              name="phone"
              size={20}
              color="#fff"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.infoLabel}>Phone</Text>
          </View>
          <Text style={styles.infoText}>{loggedInUser.phone}</Text>
        </View>
        <View style={styles.infoBox}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Entypo
              name="address"
              size={20}
              color="#fff"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.infoLabel}>Address</Text>
          </View>
          <Text style={styles.infoText}>{loggedInUser.address}</Text>
        </View>
        <View style={styles.infoBox}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <FontAwesome5
              name="gift"
              size={20}
              color="#fff"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.infoLabel}>Referral Code</Text>
          </View>
          <Text style={styles.infoText}>
            {loggedInUser.referralCode ?? "N/A"}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#F0F7F7" },
  profileContainer: { alignItems: "center" },

  profilePicWrapper: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 60,
    padding: 2, // More padding for a stronger glow
    backgroundColor: "#008B8B",
    borderWidth: 3,
    borderColor: "#00CED1", // Lighter cyan border for extra pop
    marginBottom: 24, // More space below the image
    // Shadow for iOS
    shadowColor: "#00CED1",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 24,
    // Elevation for Android
    elevation: 24,
  },
  profilePic: { width: 100, height: 100, borderRadius: 50 },
  username: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
    fontFamily: "OpenSans_700Bold",
  },
  personalInfo: {
    flexDirection: "column",
    alignItems: "flex-start",
    alignSelf: "flex-start",
    padding: 16,
    width: "100%",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
    backgroundColor: "#008B8B",
    padding: 8,
    borderRadius: 8,
    alignSelf: "stretch",
    height: 50,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
    color: "#fff",
    fontFamily: "OpenSans_700Bold",
  },
  infoText: {
    fontSize: 14,
    color: "#fff",
    fontFamily: "OpenSans_400Regular",
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 16,
    zIndex: 10,
    backgroundColor: "#F0F7F7",
    borderRadius: 20,
    padding: 4,
  },
  logout: {
    position: "absolute",
    top: 40,
    right: 16,
    zIndex: 10,
    backgroundColor: "#F0F7F7",
    borderRadius: 20,
    padding: 4,
  },
});

export default Profile;
