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
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState } from "react";
import { FontAwesome } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import {
  GestureHandlerRootView,
  ScrollView,
} from "react-native-gesture-handler";
import { useAuth } from "@/context/AuthContext";

const Login = () => {
  const { user, setUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const router = useRouter();

  // Add this useEffect to observe the context user state
  useEffect(() => {
    console.log("Context User state changed:", user);
  }, [user]);

  const handleLogin = async () => {
    const request = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        usernameOrEmail: email,
        password,
      }),
    };
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    try {
      setIsLoading(true);
      const response = await fetch(
        "http://192.168.1.71:8080/api/auth/login",
        request
      );
      const data = await response.json();

      if (response.ok && setUser) {
        console.log("User logged in successfully:", data);
        console.log("Token received:", data.token);
        setUser(data.token);
        console.log("setUser called with token.");
        router.replace("/(tabs)/" as any);
      } else {
        console.log("Login failed:", data);
        setError(data.message || "Login failed");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
      console.log("Fetch error during login:", error);
    } finally {
      setIsLoading(false);
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
              paddingVertical: 20,
            }}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.loginContainer}>
              <View style={styles.logoContainer}>
                <View style={styles.logoRow}>
                  <Image
                    source={require("@/assets/images/swapll-logo.png")}
                    style={styles.logoSmall}
                    resizeMode="contain"
                  />
                  <Text style={styles.appName}>Swapll</Text>
                </View>
                <Text style={styles.tagline}>
                  Exchange without expectations
                </Text>
              </View>

              <View style={styles.formContainer}>
                <Text style={styles.label}>Email or Username</Text>
                <TextInput
                  style={[
                    styles.input,
                    focusedInput === "email" && styles.inputFocused,
                  ]}
                  placeholder="example@email.com"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedInput("email")}
                  onBlur={() => setFocusedInput(null)}
                  autoCapitalize="none"
                />

                {error && (
                  <Text style={{ color: "red", marginBottom: 10 }}>
                    Invalid Email or Username
                  </Text>
                )}
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      focusedInput === "password" && styles.inputFocused,
                    ]}
                    placeholder="***************"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    onFocus={() => setFocusedInput("password")}
                    onBlur={() => setFocusedInput(null)}
                  />
                  {error && (
                    <Text style={{ color: "red" }}>Invalid Password</Text>
                  )}
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

                <TouchableOpacity
                  style={styles.loginBtn}
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  <Text style={styles.loginText}>
                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text>Login</Text>
                    )}
                  </Text>
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
  label: {
    fontSize: 14,
    color: "#008B8B",
    fontFamily: "Poppins_600SemiBold",
    marginLeft: 5,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  logoSmall: {
    width: 70,
    height: 70,
    marginRight: 10,
    borderRadius: 14,
  },
  appName: {
    fontSize: 28,
    color: "#008B8B",
    fontFamily: "Poppins_700Bold",
  },
  tagline: {
    fontSize: 18,
    color: "#555",
    textAlign: "center",
    fontFamily: "Poppins_700Bold",
    marginBottom: 8,
  },
  formContainer: {
    width: "100%",
  },
  welcomeText: {
    fontSize: 24,
    color: "#333",
    marginBottom: 20,
    fontFamily: "Poppins_600SemiBold",
  },
  input: {
    height: 50,
    marginVertical: 12,
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
  passwordContainer: {
    position: "relative",
    width: "100%",
  },
  eyeIcon: {
    position: "absolute",
    right: 12,
    top: 22,
    padding: 5,
  },
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginVertical: 10,
  },
  forgotPasswordText: {
    color: "#008B8B",
    fontWeight: "600",
    fontFamily: "Poppins_600SemiBold",
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
    fontFamily: "Poppins_600SemiBold",
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
    fontFamily: "Poppins_400Regular",
  },
  signupText: {
    color: "#008B8B",
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },
});

export default Login;
