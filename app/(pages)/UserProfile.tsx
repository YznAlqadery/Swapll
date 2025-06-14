import React, { useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  Image,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Linking,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import {
  GestureHandlerRootView,
  ScrollView,
} from "react-native-gesture-handler";
import { useLoggedInUser } from "@/context/LoggedInUserContext";

import { useQuery } from "@tanstack/react-query";

interface User {
  id: number;
  myReferralCode: string;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  phone: string;
  address: string;
  referralCode: string | null;
  profilePic: string;
  bio: string;
}

const formatPhoneNumber = (phoneNumberString: string | undefined): string => {
  if (!phoneNumberString) return "";

  const cleaned = ("" + phoneNumberString).replace(/\D/g, "");

  if (cleaned.length === 12 && cleaned.startsWith("962")) {
    return `+${cleaned.substring(0, 3)} ${cleaned.substring(
      3,
      5
    )} ${cleaned.substring(5, 8)} ${cleaned.substring(8, 12)}`;
  } else if (cleaned.length === 10 && cleaned.startsWith("07")) {
    return `${cleaned.substring(0, 3)} ${cleaned.substring(
      3,
      6
    )} ${cleaned.substring(6, 10)}`;
  }
  return phoneNumberString;
};

async function fetchUser(
  userId: number,
  token: string
): Promise<User | undefined> {
  try {
    const url = `${process.env.EXPO_PUBLIC_API_URL}/api/user/${userId}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch user");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return undefined;
  }
}

const UserProfile = () => {
  const { user: token } = useAuth();
  const { user } = useLoggedInUser();
  const { userId } = useLocalSearchParams();

  const router = useRouter();

  const normalizedUserId = Array.isArray(userId) ? userId[0] : userId;

  const userIdNumber = normalizedUserId ? Number(normalizedUserId) : undefined;

  if (user?.id !== undefined && user?.id === userIdNumber) {
    router.replace("/(tabs)/profile");
    return null;
  }

  const {
    data: otherUser,
    isLoading: isOtherUserLoading,
    error: otherUserError,
  } = useQuery<User | undefined>({
    queryKey: ["otherUser", userIdNumber],
    queryFn: () => fetchUser(userIdNumber as number, token as string),
    enabled: !!userIdNumber && !!token,
  });

  if (isOtherUserLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={"dark-content"} />
        <View style={styles.profileContainer}>
          <ActivityIndicator
            size="large"
            color="#008B8B"
            style={{ marginTop: 200 }}
          />
          <Text style={{ marginTop: 10, color: "#008B8B" }}>
            Loading user profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (otherUserError || !otherUser) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={"dark-content"} />
        <View style={styles.profileContainer}>
          <Text style={styles.errorText}>
            {otherUserError
              ? `Error: ${otherUserError.message}`
              : "User profile not found or could not be loaded."}
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={"dark-content"} />
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#008B8B" />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 6, paddingTop: 0 }}
        >
          <View style={styles.profileContainer}>
            <View style={styles.profileWrapper}>
              <Image
                source={require("@/assets/images/profile-page-bg.png")}
                style={styles.wavyBackground}
                resizeMode="cover"
              />
            </View>
            <View style={styles.profilePicWrapper}>
              <Image
                source={
                  otherUser?.profilePic
                    ? { uri: otherUser?.profilePic }
                    : require("@/assets/images/profile-pic-placeholder.png")
                }
                style={styles.profilePic}
                onError={(e) =>
                  console.log("Profile Image Load Error:", e.nativeEvent.error)
                }
              />
            </View>

            <View
              style={{
                marginTop: 24,
              }}
            >
              <Text style={styles.username}>
                {otherUser?.firstName.substring(0, 1).toLocaleUpperCase()! +
                  otherUser?.firstName.substring(1)}{" "}
                {otherUser?.lastName.substring(0, 1).toLocaleUpperCase()! +
                  otherUser?.lastName.substring(1)}
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
                @{otherUser?.userName}
              </Text>
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
            <TouchableOpacity
              onPress={() =>
                router.replace({
                  pathname: "/(pages)/ChatPage",
                  params: {
                    userId: otherUser?.id,
                    userName: otherUser?.userName,
                    profilePic: otherUser?.profilePic,
                  },
                })
              }
              style={styles.messageButton}
            >
              <Image
                source={require("@/assets/images/swapll_message.png")}
                style={styles.messageButtonIcon}
              />
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.personalInfo}>
            <TouchableOpacity
              style={styles.infoBox}
              onPress={() => {
                if (otherUser?.phone) {
                  Linking.openURL(`tel:${otherUser.phone}`);
                }
              }}
            >
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
              <Text style={styles.infoText}>
                {formatPhoneNumber(otherUser?.phone)}
              </Text>
            </TouchableOpacity>
            <View style={styles.infoBox}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Feather
                  name="map-pin"
                  size={20}
                  color="#fff"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.infoLabel}>Address</Text>
              </View>
              <Text style={styles.infoText}>{otherUser?.address}</Text>
            </View>

            {otherUser?.bio && (
              <View style={styles.bioBox}>
                <Text style={styles.bioTitle}>Needs</Text>
                <Text style={styles.bioText}>{otherUser.bio}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/(pages)/YourOffers",
                params: {
                  userId: otherUser?.id,
                  userName: otherUser?.userName,
                },
              })
            }
            style={[
              styles.personalInfo,
              {
                marginBottom: 50,
              },
            ]}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#FFF",
                width: "100%",
                padding: 16,
                borderRadius: 10,
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <FontAwesome5
                  name="box"
                  size={20}
                  color="#008B8B"
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.infoLabel,
                    {
                      fontSize: 16,
                      fontWeight: "bold",
                      fontFamily: "Poppins_700Bold",
                      color: "#008B8B",
                    },
                  ]}
                >
                  {otherUser?.userName}'s Offers
                </Text>
              </View>
              <FontAwesome5 name="chevron-right" size={16} color="#008B8B" />
            </View>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F7F7" },
  profileContainer: { alignItems: "center", justifyContent: "center" },
  profileWrapper: {
    width: "100%",
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 24,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  profilePicWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    marginTop: 24,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  wavyBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: 180,
    zIndex: -1,
    borderRadius: 10,
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    zIndex: 1,
    alignSelf: "center",
  },
  username: {
    fontSize: 22,
    fontWeight: "bold",
    fontFamily: "Poppins_700Bold",
    marginTop: 30,
  },
  personalInfo: {
    flexDirection: "column",
    alignItems: "flex-start",
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    width: "100%",
    marginTop: 10,
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
    top: 50,
    left: 16,
    zIndex: 10,
    backgroundColor: "#fff",
    borderRadius: 25,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
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
  bioBox: {
    backgroundColor: "#f9f9f9",
    padding: 16,
    marginTop: 16,
    borderRadius: 12,
    borderColor: "#ddd",
    borderWidth: 1,
    width: "100%",
  },

  bioTitle: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#333",
    marginBottom: 6,
  },

  bioText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#555",
    lineHeight: 20,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: "#008B8B",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
  messageButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0F2F2",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#008B8B",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
    gap: 8,
  },
  messageButtonIcon: {
    width: 20,
    height: 20,
    tintColor: "#008B8B",
  },
  messageButtonText: {
    color: "#008B8B",
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },
});

export default UserProfile;
