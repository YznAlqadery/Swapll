// app/reset-password.tsx
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
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons"; // Ensure Ionicons is imported

// Correct way to define screen options for Expo Router file-system routing
export const options = {
  title: "Create New Password",
  headerShown: false, // Hide the header if your design doesn't have one
};

// --- API Configuration ---
// IMPORTANT: Replace with your actual backend API URL
const API_BASE_URL = "http://localhost:8080"; // For local development. Change for physical device/production!
// If testing on a physical device, replace 'localhost' with your machine's local IP address
// Example: const API_BASE_URL = "http://192.168.1.100:8080";

interface PasswordValidity {
  minLength: boolean;
  hasNumber: boolean;
  hasUpper: boolean;
  hasLower: boolean;
}

const ResetPassword: React.FC = () => {
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);

  const router = useRouter();
  const { email, verificationCode } = useLocalSearchParams<{
    email: string;
    verificationCode: string;
  }>();

  const isPasswordValid = (password: string): PasswordValidity => {
    const minLength = password.length >= 8;
    const hasNumber = /[0-9]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    return { minLength, hasNumber, hasUpper, hasLower };
  };

  const passwordValidity: PasswordValidity = isPasswordValid(newPassword);

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert(
        "Password Mismatch",
        "New password and confirm password do not match."
      );
      return;
    }
    if (
      !passwordValidity.minLength ||
      !passwordValidity.hasNumber ||
      !passwordValidity.hasUpper ||
      !passwordValidity.hasLower
    ) {
      Alert.alert(
        "Weak Password",
        "Please ensure your new password meets all the criteria."
      );
      return;
    }

    try {
      console.log("Attempting to reset password via API...");
      console.log("Email:", email);
      console.log("Verification Code:", verificationCode);
      // IMPORTANT: In a real app, do NOT console.log the actual password!

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email, // Matches EmailRequest field
            code: verificationCode, // Matches code field in ResetRequest
            newPassword: newPassword, // Matches newPassword field in ResetRequest
          }),
        }
      );

      if (response.ok) {
        const message = await response.text(); // Assuming backend returns "Password reset successful" as plain text
        Alert.alert(
          "Password Reset",
          message ||
            "Your password has been successfully reset. Please log in with your new password.",
          [
            { text: "OK", onPress: () => router.replace("/(auth)/Login") }, // Go to home/login screen, replacing the current stack
          ]
        );
      } else {
        const errorText = await response.text(); // Get error message from backend
        console.error(
          "API Error - Reset Password:",
          response.status,
          errorText
        );
        Alert.alert(
          "Error",
          errorText ||
            "Failed to reset password. Please check the code and try again."
        );
      }
    } catch (error) {
      console.error("Network Error - Reset Password:", error);
      Alert.alert(
        "Error",
        "Network error. Could not connect to the server. Please try again."
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backArrow}>&larr;</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Create New Password</Text>
      <Text style={styles.subtitle}>
        This password should be different from the previous password.
      </Text>

      <Text style={styles.inputLabel}>New Password</Text>
      <View style={styles.passwordInputContainer}>
        <TextInput
          style={styles.passwordInput}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry={!showNewPassword}
          autoCapitalize="none"
          placeholder="New Password"
        />
        <TouchableOpacity
          onPress={() => setShowNewPassword(!showNewPassword)}
          style={styles.eyeIcon}
        >
          <Ionicons
            name={showNewPassword ? "eye" : "eye-off"} // Changed 'eye-slash' to 'eye-off' for Ionicons
            size={20}
            color="#666"
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.inputLabel}>Confirm Password</Text>
      <View style={styles.passwordInputContainer}>
        <TextInput
          style={styles.passwordInput}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
          autoCapitalize="none"
          placeholder="Confirm Password"
        />
        <TouchableOpacity
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          style={styles.eyeIcon}
        >
          <Ionicons
            name={showConfirmPassword ? "eye" : "eye-off"} // Changed 'eye-slash' to 'eye-off' for Ionicons
            size={20}
            color="#666"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.passwordRequirements}>
        <View style={styles.requirementItem}>
          <Ionicons
            name={
              passwordValidity.minLength
                ? "checkmark-circle"
                : "ellipse-outline"
            } // Changed 'circle-o' to 'ellipse-outline' for Ionicons
            size={16}
            color={passwordValidity.minLength ? "green" : "#ccc"}
          />
          <Text
            style={[
              styles.requirementText,
              passwordValidity.minLength && styles.validRequirement,
            ]}
          >
            At least 8 characters
          </Text>
        </View>
        <View style={styles.requirementItem}>
          <Ionicons
            name={
              passwordValidity.hasNumber
                ? "checkmark-circle"
                : "ellipse-outline"
            } // Changed 'check-circle' to 'checkmark-circle' and 'circle-o' to 'ellipse-outline' for Ionicons
            size={16}
            color={passwordValidity.hasNumber ? "green" : "#ccc"}
          />
          <Text
            style={[
              styles.requirementText,
              passwordValidity.hasNumber && styles.validRequirement,
            ]}
          >
            At least 1 number
          </Text>
        </View>
        <View style={styles.requirementItem}>
          <Ionicons
            name={
              passwordValidity.hasUpper && passwordValidity.hasLower
                ? "checkmark-circle"
                : "ellipse-outline" // Changed 'check-circle' to 'checkmark-circle' and 'circle-o' to 'ellipse-outline' for Ionicons
            }
            size={16}
            color={
              passwordValidity.hasUpper && passwordValidity.hasLower
                ? "green"
                : "#ccc"
            }
          />
          <Text
            style={[
              styles.requirementText,
              passwordValidity.hasUpper &&
                passwordValidity.hasLower &&
                styles.validRequirement,
            ]}
          >
            Both upper and lower characters
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.resetButton}
        onPress={handleResetPassword}
      >
        <Text style={styles.resetButtonText}>Reset Password</Text>
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
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    marginBottom: 20,
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
  passwordRequirements: {
    marginBottom: 30,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  requirementText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#666",
  },
  validRequirement: {
    color: "green",
  },
  resetButton: {
    backgroundColor: "#008b8b",
    padding: 18,
    borderRadius: 10,
    alignItems: "center",
  },
  resetButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default ResetPassword;
