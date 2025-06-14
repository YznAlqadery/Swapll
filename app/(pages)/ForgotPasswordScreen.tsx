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
  ActivityIndicator,
} from "react-native";
import { Link, useRouter } from "expo-router";

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

const ForgotPasswordScreen: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertOnConfirm, setAlertOnConfirm] = useState<
    (() => void) | undefined
  >(undefined);

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

  const handleSendCode = async () => {
    if (!email) {
      showAlert("Error", "Please enter your email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert("Error", "Please enter a valid email address.");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/auth/request-reset`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: email }),
        }
      );

      if (response.ok) {
        const message = await response.text();
        showAlert("Success", message || "Reset code sent to your email.", () =>
          router.push({
            pathname: "/(pages)/VerificationScreen",
            params: { email: email },
          })
        );
      } else {
        const errorText = await response.text();
        showAlert(
          "Error",
          errorText || "Failed to send verification code. Please try again."
        );
      }
    } catch (error) {
      showAlert(
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
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.replace("/(auth)/Login")}
      >
        <Text style={styles.backArrow}>&larr;</Text>
      </TouchableOpacity>

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
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.sendCodeButtonText}>Send Code</Text>
        )}
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

export default ForgotPasswordScreen;
