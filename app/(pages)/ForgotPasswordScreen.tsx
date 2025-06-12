// app/forgot-password.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Link, useRouter } from "expo-router"; // Import Link and useRouter from expo-router

const ForgotPasswordScreen: React.FC = () => {
  const [email, setEmail] = useState<string>(""); // Pre-filled as in screenshot
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter(); // Use useRouter hook for navigation

  const handleSendCode = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }

    try {
      console.log("Sending reset code request to backend for:", email);
      setIsLoading(true);

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/auth/request-reset`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: email }), // Match the EmailRequest body
        }
      );

      if (response.ok) {
        const message = await response.text(); // Assuming response is plain text "Reset code sent to email"
        Alert.alert("Success", message || "Reset code sent to your email.");
        // On success, navigate to the verification screen with email as a query parameter
        router.push({
          pathname: "/(pages)/VerificationScreen",
          params: { email: email },
        });
      } else {
        const errorText = await response.text(); // Get error message from backend
        console.error("API Error - Request Reset:", response.status, errorText);
        Alert.alert(
          "Error",
          errorText || "Failed to send verification code. Please try again."
        );
      }
    } catch (error) {
      console.error("Network Error - Request Reset:", error);
      Alert.alert(
        "Error",
        "Network error. Could not connect to the server. Please check your connection."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Back Arrow - Using Link for back navigation to a specific route */}
      <Link href="/" asChild>
        {/* Assuming '/' is your home/login screen */}
        <TouchableOpacity style={styles.backButton}>
          <Text style={styles.backArrow}>&larr;</Text>
        </TouchableOpacity>
      </Link>

      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>
        Enter the email address with your account and we'll send an email with
        confirmation to reset your password.
      </Text>

      <Text style={styles.inputLabel}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="Enter your email"
      />

      <TouchableOpacity
        style={styles.sendCodeButton}
        onPress={handleSendCode}
        disabled={isLoading}
      >
        <Text style={styles.sendCodeButtonText}>
          {isLoading ? "Sending..." : "Send Code"}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 30,
  },
  backArrow: {
    fontSize: 24,
    color: "#000",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#008b8b",
    fontFamily: "Poppins_700Bold",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 40,
    fontFamily: "Poppins_400Regular",
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    fontFamily: "Poppins_700Bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 30,
  },
  sendCodeButton: {
    backgroundColor: "#008b8b",
    padding: 18,
    borderRadius: 10,
    alignItems: "center",
  },
  sendCodeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "Poppins_700Bold",
  },
});

export default ForgotPasswordScreen;
