import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export const options = {
  title: "Create New Password",
  headerShown: false,
};

interface PasswordValidity {
  minLength: boolean;
  hasNumber: boolean;
  hasUpper: boolean;
  hasLower: boolean;
}

interface CustomAlertModalProps {
  isVisible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
}

const CustomAlertModal: React.FC<CustomAlertModalProps> = ({
  isVisible,
  title,
  message,
  onClose,
  onConfirm,
}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <Pressable style={modalStyles.centeredView} onPress={onClose}>
        <View style={modalStyles.modalView}>
          <Text style={modalStyles.modalTitle}>{title}</Text>
          <Text style={modalStyles.modalMessage}>{message}</Text>
          <TouchableOpacity
            style={modalStyles.okButton}
            onPress={() => {
              onClose();
              if (onConfirm) onConfirm();
            }}
          >
            <Text style={modalStyles.okButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
};

const ResetPassword: React.FC = () => {
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);

  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertOnConfirm, setAlertOnConfirm] = useState<
    (() => void) | undefined
  >(undefined);

  const router = useRouter();
  const { email, verificationCode } = useLocalSearchParams<{
    email: string;
    verificationCode: string;
  }>();

  const showAlert = (
    title: string,
    message: string,
    onConfirm?: () => void
  ) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertOnConfirm(() => onConfirm);
    setIsAlertVisible(true);
  };

  const hideAlert = () => {
    setIsAlertVisible(false);
    setAlertTitle("");
    setAlertMessage("");
    setAlertOnConfirm(undefined);
  };

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
      showAlert(
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
      showAlert(
        "Weak Password",
        "Please ensure your new password meets all the criteria."
      );
      return;
    }

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            code: verificationCode,
            newPassword: newPassword,
          }),
        }
      );

      if (response.ok) {
        const message = await response.text();
        showAlert(
          "Password Reset",
          message ||
            "Your password has been successfully reset. Please log in with your new password.",
          () => router.replace("/(auth)/Login")
        );
      } else {
        const errorText = await response.text();
        showAlert(
          "Error",
          errorText ||
            "Failed to reset password. Please check the code and try again."
        );
      }
    } catch (error) {
      showAlert(
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
            name={showNewPassword ? "eye" : "eye-off"}
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
            name={showConfirmPassword ? "eye" : "eye-off"}
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
            }
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
            }
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
                : "ellipse-outline"
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

      <CustomAlertModal
        isVisible={isAlertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={hideAlert}
        onConfirm={alertOnConfirm}
      />
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

const modalStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 15,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    width: "85%",
    borderWidth: 1,
    borderColor: "#E0FFFF",
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "bold",
    color: "#008B8B",
    fontFamily: "Poppins_700Bold",
  },
  modalMessage: {
    marginBottom: 25,
    textAlign: "center",
    fontSize: 16,
    color: "#555",
    fontFamily: "Poppins_400Regular",
    lineHeight: 22,
  },
  okButton: {
    backgroundColor: "#20B2AA",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 25,
    elevation: 3,
    minWidth: 120,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  okButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 17,
    fontFamily: "Poppins_600SemiBold",
  },
});

export default ResetPassword;
