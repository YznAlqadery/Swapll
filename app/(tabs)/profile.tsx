import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  Image,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
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
import Toast, {
  BaseToast,
  BaseToastProps,
  ErrorToast,
} from "react-native-toast-message";

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

const toastConfig = {
  success: (props: React.JSX.IntrinsicAttributes & BaseToastProps) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: "#008B8B" }}
      text1Style={{ fontWeight: "bold", fontFamily: "Poppins_700Bold" }}
      text2Style={{ color: "#008B8B", fontFamily: "Poppins_500Medium" }}
    />
  ),
  error: (props: React.JSX.IntrinsicAttributes & BaseToastProps) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: "red" }}
      text1Style={{ fontWeight: "bold" }}
      text2Style={{ color: "red" }}
    />
  ),
};

const Profile = () => {
  const authContext = useContext(AuthContext);
  const { user } = useLoggedInUser();
  const token = authContext?.user ?? null;

  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const handleLogout = () => {
    authContext?.setUser(null);
    router.replace("/(auth)/Login");
  };
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

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Toast.show({
      type: "success",
      text1: "Copied!",
      text2: `${text} copied to clipboard.`,
      position: "top", // or 'top'
      visibilityTime: 2000, // duration in ms
    });
  };
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={"light-content"} />
      <View style={styles.profileWrapper}>
        <Image
          source={require("@/assets/images/profile-page-bg.png")}
          style={styles.wavyBackground}
          resizeMode="cover"
        />
      </View>
      {!isLoading && (
        <View style={styles.profilePicWrapper}>
          {localImageUri ? (
            <Image source={{ uri: localImageUri }} style={styles.profilePic} />
          ) : (
            <Image
              source={require("@/assets/images/profile-pic-placeholder.png")}
              style={styles.profilePic}
            />
          )}
        </View>
      )}

      <ScrollView style={{ flex: 1 }}>
        <View style={styles.profileContainer}>
          {isLoading && (
            <ActivityIndicator
              size="large"
              color="#008B8B"
              style={{ marginTop: 200 }}
            />
          )}

          <View>
            <Text style={styles.username}>
              {user?.firstName.substring(0, 1).toLocaleUpperCase()! +
                user?.firstName.substring(1)}{" "}
              {user?.lastName.substring(0, 1).toLocaleUpperCase()! +
                user?.lastName.substring(1)}
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
              @{user?.userName}
            </Text>

            {user?.myReferralCode && (
              <TouchableOpacity
                onPress={() => copyToClipboard(user?.myReferralCode!)}
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
            <Text style={styles.infoText}>{user?.email}</Text>
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
            <Text style={styles.infoText}>{user?.phone}</Text>
          </View>
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
            <Text style={styles.infoText}>{user?.address}</Text>
          </View>
          {user?.referralCode && (
            <View style={styles.infoBox}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <FontAwesome5
                  name="link"
                  size={20}
                  color="#fff"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.infoLabel}>Referral Code</Text>
              </View>
              <Text style={styles.infoText}>{user?.referralCode ?? "N/A"}</Text>
            </View>
          )}
          {user?.bio && (
            <View style={styles.bioBox}>
              <Text style={styles.bioTitle}>Needs</Text>
              <Text style={styles.bioText}>{user.bio}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={() => router.push("/(pages)/YourOffers")}
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
            }}
          >
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
              Your offers
            </Text>
            <FontAwesome5 name="chevron-right" size={16} color="#008B8B" />
          </View>
        </TouchableOpacity>

        {/* <View style={styles.logoutContainer}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <FontAwesome name="sign-out" size={20} color="#008B8B" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View> */}
      </ScrollView>
      <Toast config={toastConfig} />
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
    marginBottom: 12,
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
    borderBottomRightRadius: 5,
    borderBottomLeftRadius: 5,
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
    fontFamily: "Poppins_700Bold",
    marginTop: 30,
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
});

export default Profile;
