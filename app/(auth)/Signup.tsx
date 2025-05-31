import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import React, { useState } from "react";
import { FontAwesome } from "@expo/vector-icons";
import { Link } from "expo-router";

import {
  GestureHandlerRootView,
  ScrollView,
} from "react-native-gesture-handler";
import { selectImage } from "@/services/selectImage";

const LabeledInput = ({
  label,
  name,
  focusedInput,
  setFocusedInput,
  ...props
}: any) => (
  <View style={{ width: "100%", marginBottom: 15 }}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      {...props}
      placeholderTextColor="#888"
      style={[styles.input, focusedInput === name && styles.inputFocused]}
      onFocus={() => setFocusedInput(name)}
      onBlur={() => setFocusedInput(null)}
    />
  </View>
);

const SignUp = () => {
  const [image, setImage] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassowrd] = useState<string>("");
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleSelectImage = async () => {
    const selectedImage = await selectImage();
    if (selectedImage) setImage(selectedImage);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollView}>
            <View style={styles.imageContainer}>
              <View style={styles.imageWrapper}>
                <TouchableOpacity onPress={handleSelectImage}>
                  {image ? (
                    <Image source={{ uri: image }} style={styles.image} />
                  ) : (
                    <View style={styles.iconContainer}>
                      <FontAwesome name="user" size={40} color="#008B8B" />
                    </View>
                  )}
                </TouchableOpacity>
              </View>
              <Text style={styles.imageLabel}>Upload your photo</Text>
            </View>

            <View style={styles.formContainer}>
              <LabeledInput
                label="Email"
                name="email"
                placeholder="example@mail.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                focusedInput={focusedInput}
                setFocusedInput={setFocusedInput}
              />

              <View style={styles.row}>
                <View style={{ width: "48%" }}>
                  <LabeledInput
                    label="First Name"
                    name="firstName"
                    placeholder="John"
                    value={firstName}
                    onChangeText={setFirstName}
                    focusedInput={focusedInput}
                    setFocusedInput={setFocusedInput}
                  />
                </View>
                <View style={{ width: "48%" }}>
                  <LabeledInput
                    label="Last Name"
                    name="lastName"
                    placeholder="Doe"
                    value={lastName}
                    onChangeText={setLastName}
                    focusedInput={focusedInput}
                    setFocusedInput={setFocusedInput}
                  />
                </View>
              </View>

              <LabeledInput
                label="Username"
                name="username"
                placeholder="johndoe123"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                focusedInput={focusedInput}
                setFocusedInput={setFocusedInput}
              />
              <LabeledInput
                label="Password"
                name="password"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                focusedInput={focusedInput}
                setFocusedInput={setFocusedInput}
              />

              <LabeledInput
                label="Confirm Password"
                name="confirmPassword"
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={setConfirmPassowrd}
                secureTextEntry
                focusedInput={focusedInput}
                setFocusedInput={setFocusedInput}
              />

              <Link
                href={{
                  pathname: "/(auth)/continueSignUp",
                  params: {
                    firstName,
                    lastName,
                    username,
                    email,
                    password,
                    image,
                  },
                }}
                style={styles.signUpBtn}
              >
                <Text style={styles.signUpText}>Continue</Text>
              </Link>

              <View style={styles.loginPrompt}>
                <Text style={styles.promptText}>Already have an account?</Text>
                <Link href="/Login">
                  <Text style={styles.loginLink}>Login</Text>
                </Link>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? 25 : 0,
    backgroundColor: "#F0F7F7",
  },
  scrollView: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 20,
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 25,
  },
  imageWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: "#B0C4C4",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  imageLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#008B8B",
    marginTop: 10,
    fontFamily: "Poppins_700Bold",
  },
  formContainer: {
    width: "100%",
  },
  label: {
    marginBottom: 5,
    color: "#008B8B",
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },
  input: {
    height: 45,
    marginBottom: 5,
    borderWidth: 2,
    borderColor: "#B0C4C4", // softer default border
    padding: 16,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    fontFamily: "Poppins_400Regular",
    color: "#000",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2, // for Android shadow
    transitionDuration: "200ms", // smooth transition (iOS & web)
  },
  inputFocused: {
    borderColor: "#008B8B",
    shadowColor: "#008B8B",
    shadowOpacity: 0.4,
    elevation: 5,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signUpBtn: {
    backgroundColor: "#008B8B",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 25,
    paddingVertical: 14,
  },
  signUpText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
  },
  loginPrompt: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
    marginTop: 20,
  },
  promptText: {
    fontSize: 14,
    color: "#333",
    fontFamily: "Poppins_500Medium",
  },
  loginLink: {
    fontSize: 14,
    color: "#008B8B",
    fontFamily: "Poppins_600SemiBold",
  },
});

export default SignUp;
