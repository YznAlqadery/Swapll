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

const SignUp = () => {
  const [image, setImage] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassowrd] = useState<string>("");

  const handleSelectImage = async () => {
    const selectedImage = await selectImage();
    if (selectedImage) {
      setImage(selectedImage);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.imageContainer}>
              {image ? (
                <View>
                  <View style={styles.imageWrapper}>
                    <TouchableOpacity onPress={handleSelectImage}>
                      <Image source={{ uri: image }} style={styles.image} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.imageLabel}>Upload your photo</Text>
                </View>
              ) : (
                <View>
                  <View style={styles.imageWrapper}>
                    <TouchableOpacity
                      style={styles.iconContainer}
                      onPress={handleSelectImage}
                    >
                      <FontAwesome name="user" size={40} color="#008B8B" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.imageLabel}>Upload your photo</Text>
                </View>
              )}
              <View
                style={{
                  marginTop: 25,
                  width: "100%",
                  flex: 1,
                  alignItems: "center",
                }}
              >
                <TextInput
                  style={{ ...styles.input, width: "100%" }}
                  placeholder="Email"
                  placeholderTextColor={"#000"}
                  onChangeText={(text) => setEmail(text)}
                />

                <View
                  style={{
                    flexDirection: "row",
                    width: "100%",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <TextInput
                    style={{ ...styles.input, width: "48%" }}
                    placeholder="First Name"
                    placeholderTextColor={"#000"}
                    onChangeText={(text) => setFirstName(text)}
                  />
                  <TextInput
                    style={{ ...styles.input, width: "48%" }}
                    placeholder="Last Name"
                    placeholderTextColor={"#000"}
                    onChangeText={(text) => setLastName(text)}
                  />
                </View>
                <TextInput
                  style={{ ...styles.input, width: "100%" }}
                  placeholder="Username"
                  placeholderTextColor={"#000"}
                  onChangeText={(text) => setUsername(text)}
                />

                <TextInput
                  style={{ ...styles.input, width: "100%" }}
                  placeholder="Password"
                  placeholderTextColor={"#000"}
                  secureTextEntry={true}
                  onChangeText={(text) => setPassword(text)}
                />
                <TextInput
                  style={{ ...styles.input, width: "100%" }}
                  placeholder="Confirm Password"
                  placeholderTextColor={"#000"}
                  secureTextEntry={true}
                  onChangeText={(text) => setConfirmPassowrd(text)}
                />

                <Link
                  href={{
                    pathname: "/(pages)/continueSignUp",
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
                  <Text style={styles.signUpText}>Continue Signing Up</Text>
                </Link>
                <View
                  style={{
                    flexDirection: "row",
                    marginTop: 20,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#000",
                      fontSize: 14,
                      fontFamily: "OpenSans_500Medium",
                    }}
                  >
                    Already have an account?{" "}
                  </Text>
                  <Link href="/Login">
                    <Text
                      style={{
                        color: "#008B8B",
                        fontSize: 14,
                        fontFamily: "OpenSans_600SemiBold",
                      }}
                    >
                      Login
                    </Text>
                  </Link>
                </View>
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
  imageContainer: {
    width: "100%",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    padding: 20,
  },
  imageWrapper: {
    width: 75,
    height: 75,
    borderRadius: 100,
    overflow: "hidden",
    borderWidth: 4,
    borderColor: "#008B8B",
    marginLeft: 20,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  iconContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  imageLabel: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    color: "#000",
    marginTop: 10,
    fontFamily: "OpenSans_500Medium",
  },
  input: {
    height: 45,
    marginVertical: 15,
    borderWidth: 2,
    borderColor: "#008B8B",
    padding: 12,
    borderRadius: 10,
    fontFamily: "OpenSans_400Regular",
  },
  signUpBtn: {
    width: "100%",
    backgroundColor: "#008B8B",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    padding: 13,
    textAlign: "center",
  },
  signUpText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "OpenSans_600SemiBold",
  },

  referralContainer: {
    width: "100%",
    position: "relative",
  },
  optionalText: {
    position: "absolute",
    right: 10,
    top: 30,
    fontSize: 12,
    color: "#666",
    fontFamily: "OpenSans_400Regular",
  },
});

export default SignUp;
