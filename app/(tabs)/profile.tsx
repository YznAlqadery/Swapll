import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  Image,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import * as FileSystem from "expo-file-system";
import { AuthContext } from "@/context/AuthContext";
import {
  MaterialIcons,
  FontAwesome5,
  Entypo,
  FontAwesome,
} from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { Feather } from "@expo/vector-icons";
import { ScrollView } from "react-native-gesture-handler";
import { useLoggedInUser } from "@/context/LoggedInUserContext";

interface User {
  myReferralCode: string;
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
  const { user, setUser } = useLoggedInUser();
  const token = authContext?.user ?? null;

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
        const res = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/user/myinfo`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        setUser(data);
      } catch (error) {
        console.error("Failed fetching user info:", error);
      }
    }

    fetchUser();
  }, [token]);

  useEffect(() => {
    async function fetchProfileImage() {
      if (!user?.profilePic || !token) return;

      setIsLoading(true);
      try {
        const imageUrl = process.env.EXPO_PUBLIC_API_URL + user.profilePic;

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
  }, [user, token]);

  if (!user) {
    return (
      <SafeAreaView>
        <ActivityIndicator size="large" color="#008B8B" />
        <Text>Loading user data...</Text>
      </SafeAreaView>
    );
  }
  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert("Copied!", `${text} copied to clipboard.`);
  };
  return (
    <SafeAreaView style={styles.container}>
      {/* <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <MaterialIcons name="arrow-back" size={28} color="#008B8B" />
      </TouchableOpacity> */}
      <ScrollView style={{ flex: 1 }}>
        <View style={styles.profileContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#008B8B" />
          ) : localImageUri ? (
            <View style={styles.profileWrapper}>
              <Image
                source={require("@/assets/images/profile-page-bg.png")}
                style={styles.wavyBackground}
                resizeMode="cover"
              />
              <View style={styles.profilePicWrapper}>
                <Image
                  source={{ uri: localImageUri }}
                  style={styles.profilePic}
                />
              </View>
            </View>
          ) : (
            <Text>No profile picture available</Text>
          )}

          <View>
            <Text style={styles.username}>
              {user.firstName.substring(0, 1).toLocaleUpperCase() +
                user.firstName.substring(1)}{" "}
              {user.lastName.substring(0, 1).toLocaleUpperCase() +
                user.lastName.substring(1)}
            </Text>
          </View>
          <View
            style={{
              flexDirection: "column",
              gap: 8,
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "bold",
                fontFamily: "Poppins_700Bold",
                marginRight: 8,
              }}
            >
              @{user.userName}
            </Text>

            {user.myReferralCode && (
              <TouchableOpacity
                onPress={() => copyToClipboard(user.myReferralCode)}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#008B8B",
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 4,
                }}
              >
                <Feather name="copy" size={16} color="#fff" />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "bold",
                    fontFamily: "Poppins_700Bold",
                    color: "#fff",
                    marginLeft: 6,
                  }}
                >
                  {user.myReferralCode}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginHorizontal: 16,
            marginTop: 16,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "bold",
              fontFamily: "Poppins_700Bold",
            }}
          >
            Personal Information
          </Text>

          <Link href="/(pages)/EditProfile" asChild>
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 4,
              }}
              activeOpacity={0.7}
            >
              <Feather name="edit" size={18} color="#008B8B" />
              <Text
                style={{
                  marginLeft: 4,
                  color: "#008B8B",
                  fontFamily: "Poppins_600SemiBold",
                  fontSize: 14,
                }}
              >
                Edit
              </Text>
            </TouchableOpacity>
          </Link>
        </View>

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
            <Text style={styles.infoText}>{user.email}</Text>
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
            <Text style={styles.infoText}>{user.phone}</Text>
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
            <Text style={styles.infoText}>{user.address}</Text>
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
            <Text style={styles.infoText}>{user.referralCode ?? "N/A"}</Text>
          </View>
        </View>
        <View style={styles.logoutContainer}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <FontAwesome name="sign-out" size={20} color="#008B8B" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#F0F7F7" },
  profileContainer: { alignItems: "center" },
  profileWrapper: {
    width: "100%",
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 24,
    position: "relative",
  },
  profilePicWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    marginBottom: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  wavyBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: 180,
    zIndex: -1,
    borderRadius: 100,
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    zIndex: 1,
  },
  username: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
    fontFamily: "Poppins_700Bold",
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
    fontSize: 14,
    fontWeight: "bold",
    marginRight: 8,
    color: "#fff",
    fontFamily: "Poppins_700Bold",
  },
  infoText: {
    fontSize: 14,
    color: "#fff",
    fontFamily: "Poppins_400Regular",
  },
  backButton: {
    position: "absolute",
    top: 110,
    left: 16,
    zIndex: 10,
    backgroundColor: "#F0F7F7",
    borderRadius: 20,
    padding: 4,
  },
  logoutContainer: {
    width: "100%",
    padding: 16,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#B0C4C4",
  },
  logoutText: {
    color: "#008B8B",
    fontSize: 16,
    marginLeft: 10,
    fontFamily: "Poppins_700Bold",
  },
});

export default Profile;
