import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";

import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { selectImage } from "@/services/selectImage";
import { useLoggedInUser } from "@/context/LoggedInUserContext";
import { useAuth } from "@/context/AuthContext";
import * as FileSystem from "expo-file-system";
import Toast, {
  BaseToast,
  BaseToastProps,
  ErrorToast,
} from "react-native-toast-message";

const EditProfile = () => {
  const { user, setUser } = useLoggedInUser();
  const { user: token } = useAuth();

  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [bio, setBio] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setUserName(user.userName ?? "");
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
      setEmail(user.email ?? "");
      setPhone(user.phone ?? "");
      setAddress(user.address ?? "");
      setBio(user.bio ?? "");
      setProfilePic(user.profilePic ?? null);
    }
  }, [user]);

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

  const router = useRouter();

  const handleSelectImage = async () => {
    const selectedImage = await selectImage();
    if (selectedImage) {
      setProfilePic(selectedImage);
      setLocalImageUri(null);
    }
  };

  const handleEditProfile = async () => {
    Keyboard.dismiss();
    setIsLoading(true);

    try {
      const userPayload = {
        userName,
        firstName,
        lastName,
        email,
        phone,
        address,
        bio,
      };
      const formData = new FormData();
      formData.append("user", JSON.stringify(userPayload));

      if (profilePic) {
        const fileInfo = await FileSystem.getInfoAsync(profilePic);
        if (fileInfo.exists) {
          const filename = profilePic.split("/").pop() ?? "profile.jpg";
          const ext = filename.split(".").pop()?.toLowerCase();
          const mimeType =
            ext === "png"
              ? "image/png"
              : ext === "jpg" || ext === "jpeg"
              ? "image/jpeg"
              : "application/octet-stream";
          formData.append("profilePic", {
            uri: profilePic,
            name: filename,
            type: mimeType,
          } as any);
        }
      }

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/user`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            // Note: do NOT specify Content-Type for FormData; RN handles it
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const ct = response.headers.get("Content-Type");
        const errorData = ct?.includes("application/json")
          ? await response.json()
          : await response.text();
        throw new Error(errorData.error || "Update failed");
      }

      const data = await response.json();
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Profile updated successfully",
        position: "top",
        visibilityTime: 3000,
      });

      if (setUser) setUser(data);

      router.back();
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.message || "Update failed",
        position: "top",
        visibilityTime: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading)
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#008B8B" />
      </View>
    );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <FontAwesome name="arrow-left" size={24} color="#008B8B" />
          </TouchableOpacity>
          <Text style={styles.header}>Edit Profile</Text>
          <View style={{ alignItems: "center", marginBottom: 24 }}>
            <Image
              source={
                localImageUri
                  ? { uri: localImageUri }
                  : profilePic
                  ? { uri: profilePic }
                  : require("@/assets/images/profile-pic-placeholder.png")
              }
              style={styles.profilePic}
            />
            <TouchableOpacity
              style={styles.changePicBtn}
              onPress={handleSelectImage}
            >
              <Text style={styles.changePicText}>Change Profile Picture</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.form}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={userName}
              onChangeText={setUserName}
              placeholder="Enter your username"
              placeholderTextColor="#888"
            />
            <View
              style={{
                flexDirection: "row",
                marginVertical: 12,
                justifyContent: "space-between",
              }}
            >
              <View>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={[styles.input, { width: 160 }]}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First name"
                  placeholderTextColor="#888"
                />
              </View>
              <View>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={[styles.input, { width: 160 }]}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last name"
                  placeholderTextColor="#888"
                />
              </View>
            </View>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor="#888"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone number"
              placeholderTextColor="#888"
              keyboardType="phone-pad"
            />
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter your address"
              placeholderTextColor="#888"
            />
            <Text style={styles.label}>Your needs</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself"
              placeholderTextColor="#888"
              multiline
              numberOfLines={4}
            />
            <TouchableOpacity style={styles.button} onPress={handleEditProfile}>
              <Text style={styles.buttonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F7F7" },
  scrollContent: { padding: 20 },
  header: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    color: "#008B8B",
    textAlign: "center",
    marginBottom: 24,
  },
  form: { width: "100%" },
  label: {
    fontSize: 16,
    color: "#008B8B",
    fontFamily: "Poppins_700Bold",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    height: 48,
    borderColor: "#B0C4C4",
    borderWidth: 2,
    borderRadius: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    fontFamily: "Poppins_400Regular",
    color: "#000",
    marginBottom: 4,
  },
  button: {
    backgroundColor: "#008B8B",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 28,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#B0C4C4",
    marginBottom: 10,
  },
  changePicBtn: {
    backgroundColor: "#008B8B",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changePicText: {
    color: "#fff",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
  },
  bioInput: {
    height: 90,
    textAlignVertical: "top",
  },
  backButton: {
    position: "absolute",
    top: 20,
    left: 20,
    zIndex: 1,
  },
});

export default EditProfile;
