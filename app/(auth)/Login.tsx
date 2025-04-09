import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Image,
} from "react-native";
import React, { useState } from "react";
import { FontAwesome } from "@expo/vector-icons";
import { Link } from "expo-router";
import {
  GestureHandlerRootView,
  ScrollView,
} from "react-native-gesture-handler";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
              paddingVertical: 20,
            }}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.loginContainer}>
              <View style={styles.logoContainer}>
                <Image
                  source={require("@/assets/images/swapll-logo.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />

                <Text style={styles.appName}>Swapll</Text>
                <Text style={styles.tagline}>
                  Exchange without expectations
                </Text>
              </View>

              <View style={styles.formContainer}>
                <Text style={styles.welcomeText}>Welcome Back!</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Email/Username"
                  placeholderTextColor={"#555"}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                />

                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Password"
                    placeholderTextColor={"#555"}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <FontAwesome
                      name={showPassword ? "eye-slash" : "eye"}
                      size={20}
                      color="#008B8B"
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.forgotPasswordContainer}>
                  <Text style={styles.forgotPasswordText}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.loginBtn}>
                  <Text style={styles.loginText}>Login</Text>
                </TouchableOpacity>

                <View style={styles.signupContainer}>
                  <Text style={styles.accountText}>
                    Don't have an account?{" "}
                  </Text>
                  <Link href="/Signup">
                    <Text style={styles.signupText}>Sign Up</Text>
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
    backgroundColor: "#F0F7F7",
    paddingTop: Platform.OS === "android" ? 25 : 0,
  },
  loginContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  appName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#008B8B",
    marginBottom: 5,
  },
  tagline: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  input: {
    height: 50,
    marginVertical: 12,
    borderWidth: 2,
    borderColor: "#008B8B",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  passwordContainer: {
    position: "relative",
    width: "100%",
    marginVertical: 12,
  },
  passwordInput: {
    height: 50,
    borderWidth: 2,
    borderColor: "#008B8B",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  eyeIcon: {
    position: "absolute",
    right: 12,
    top: 10,
    padding: 5,
  },
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginVertical: 10,
  },
  forgotPasswordText: {
    color: "#008B8B",
    fontWeight: "600",
  },
  loginBtn: {
    width: "100%",
    backgroundColor: "#008B8B",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    padding: 15,
  },
  loginText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  signupContainer: {
    flexDirection: "row",
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  accountText: {
    color: "#333",
    fontSize: 14,
  },
  signupText: {
    color: "#008B8B",
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default Login;
