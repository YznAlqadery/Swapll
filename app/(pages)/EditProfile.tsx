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
import { selectImage } from "@/services/selectImage"; // Assumed to return a 'file://' URI
import { useLoggedInUser } from "@/context/LoggedInUserContext";
import { useAuth } from "@/context/AuthContext";
import * as FileSystem from "expo-file-system";
import Toast from "react-native-toast-message"; // Simplified Toast import

const EditProfile = () => {
  const { user, setUser } = useLoggedInUser();
  const { user: token } = useAuth();

  // This state will ONLY hold the URI of a *newly selected local image* for upload.
  const [newlySelectedImageUri, setNewlySelectedImageUri] = useState<
    string | null
  >(null);
  // This flag tracks if the user has explicitly selected a new image.
  const [hasNewImageBeenSelected, setHasNewImageBeenSelected] = useState(false);

  const [userName, setUserName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [bio, setBio] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      // Initialize text fields from existing user data
      setUserName(user.userName ?? "");
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
      setEmail(user.email ?? "");
      setPhone(user.phone ?? "");
      setAddress(user.address ?? "");
      setBio(user.bio ?? "");
      // DO NOT set newlySelectedImageUri here, as user.profilePic will likely be an HTTPS URL.
      // newlySelectedImageUri is only for the *local file* that is chosen for upload.
    }
  }, [user]);

  const router = useRouter();

  const handleSelectImage = async () => {
    const selectedImageUri = await selectImage(); // This function should return a local file:// URI or null
    if (selectedImageUri) {
      setNewlySelectedImageUri(selectedImageUri); // Store the local URI for potential upload
      setHasNewImageBeenSelected(true); // Mark that a new image has been selected
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

      // --- Handle Profile Picture Upload ONLY if a new local image was selected ---
      if (hasNewImageBeenSelected && newlySelectedImageUri) {
        // Ensure it's a file URI before trying to get file system info
        if (newlySelectedImageUri.startsWith("file://")) {
          console.log(
            "Attempting to get file info for newly selected local URI:",
            newlySelectedImageUri
          );

          let fileInfo;
          try {
            fileInfo = await FileSystem.getInfoAsync(newlySelectedImageUri);
            console.log("File info exists for new image:", fileInfo.exists);
          } catch (fileInfoError: any) {
            console.error(
              "FileSystem.getInfoAsync failed for new image:",
              fileInfoError
            );
            Toast.show({
              type: "error",
              text1: "Image Access Error",
              text2: `Could not access the selected image: ${
                fileInfoError.message || "Unknown error"
              }`,
              position: "top",
              visibilityTime: 4000,
            });
            setIsLoading(false);
            return; // Exit if file info cannot be retrieved
          }

          if (fileInfo.exists) {
            const filename =
              newlySelectedImageUri.split("/").pop() ?? "profile.jpg";
            const ext = filename.split(".").pop()?.toLowerCase();
            const mimeType =
              ext === "png"
                ? "image/png"
                : ext === "jpg" || ext === "jpeg"
                ? "image/jpeg"
                : "application/octet-stream";
            formData.append("profilePic", {
              uri: newlySelectedImageUri,
              name: filename,
              type: mimeType,
            } as any);
          } else {
            console.warn(
              "Newly selected profile picture file does not exist at URI:",
              newlySelectedImageUri
            );
            Toast.show({
              type: "error",
              text1: "Image Missing",
              text2: "The selected profile picture was not found.",
              position: "top",
              visibilityTime: 4000,
            });
            // Decide if you want to proceed without the image or abort here.
            // Currently, it will proceed but without appending 'profilePic' to formData.
          }
        } else {
          // This case implies selectImage returned something other than a file:// URI when expected.
          console.warn(
            "Selected image URI is not a local file URI:",
            newlySelectedImageUri
          );
          Toast.show({
            type: "error",
            text1: "Invalid Image URI",
            text2: "The selected image path is not supported for upload.",
            position: "top",
            visibilityTime: 4000,
          });
          // Proceed without appending the image, as it's not a local file
        }
      }
      // If hasNewImageBeenSelected is false, or newlySelectedImageUri is null,
      // the 'profilePic' field will simply not be added to formData.
      // Your backend should interpret this as 'no change to profile picture'.

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/user`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            // Do NOT set Content-Type header manually for FormData; React Native handles it
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const ct = response.headers.get("Content-Type");
        const errorData = ct?.includes("application/json")
          ? await response.json()
          : await response.text();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Profile updated successfully",
        position: "top",
        visibilityTime: 3000,
      });

      if (setUser) setUser(data); // Update the user context with the new data

      router.back();
    } catch (err: any) {
      console.error("Error updating profile:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.message || "Failed to update profile",
        position: "top",
        visibilityTime: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Determine which URI to display in the Image component
  const imageSource = newlySelectedImageUri
    ? { uri: newlySelectedImageUri } // If a new local image is selected, show it
    : user?.profilePic
    ? { uri: user.profilePic } // Otherwise, show the existing (potentially remote) profile pic from user context
    : require("@/assets/images/profile-pic-placeholder.png"); // Fallback placeholder

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
            <Image source={imageSource} style={styles.profilePic} />
            <TouchableOpacity
              style={styles.changePicBtn}
              onPress={handleSelectImage}
              disabled={isLoading} // Disable button while loading
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
            <TouchableOpacity
              style={styles.button}
              onPress={handleEditProfile}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Save Changes</Text>
              )}
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
