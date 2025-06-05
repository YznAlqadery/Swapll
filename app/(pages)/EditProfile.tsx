import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { selectImage } from "@/services/selectImage";

const EditProfile = () => {
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [bio, setBio] = useState("");

  const router = useRouter();

  const handleSelectImage = async () => {
    const selectedImage = await selectImage();
    if (selectedImage) setProfilePic(selectedImage);
  };
  return (
    <SafeAreaView style={styles.container}>
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
              profilePic
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
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself"
            placeholderTextColor="#888"
            multiline
            numberOfLines={4}
          />
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
