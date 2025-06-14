import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  Modal,
  Pressable,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

export const options = {
  title: "Verify Code",
  headerShown: false,
};

interface CustomAlertModalProps {
  isVisible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  showConfirmButton?: boolean;
}

const CustomAlertModal: React.FC<CustomAlertModalProps> = ({
  isVisible,
  title,
  message,
  onClose,
  onConfirm,
  showConfirmButton = false,
}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <Pressable
        style={modalStyles.centeredView}
        onPress={showConfirmButton ? undefined : onClose}
      >
        <View style={modalStyles.modalView}>
          <Text style={modalStyles.modalTitle}>{title}</Text>
          <Text style={modalStyles.modalMessage}>{message}</Text>
          {showConfirmButton && onConfirm ? (
            <View style={modalStyles.modalButtons}>
              <TouchableOpacity
                style={[modalStyles.modalButton, modalStyles.cancelButton]}
                onPress={onClose}
              >
                <Text style={modalStyles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[modalStyles.modalButton, modalStyles.confirmButton]}
                onPress={() => {
                  onConfirm();
                  onClose();
                }}
              >
                <Text style={modalStyles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={modalStyles.okButton} onPress={onClose}>
              <Text style={modalStyles.okButtonText}>OK</Text>
            </TouchableOpacity>
          )}
        </View>
      </Pressable>
    </Modal>
  );
};

const VerificationScreen: React.FC = () => {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);

  const textInputRefs = useRef<(TextInput | null)[]>([]);

  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertOnConfirm, setAlertOnConfirm] = useState<
    (() => void) | undefined
  >(undefined);
  const [showAlertConfirmButton, setShowAlertConfirmButton] = useState(false);

  const showAlert = useCallback(
    (
      title: string,
      message: string,
      onConfirm?: () => void,
      showConfirmButton: boolean = false
    ) => {
      setAlertTitle(title);
      setAlertMessage(message);
      setAlertOnConfirm(() => onConfirm);
      setShowAlertConfirmButton(showConfirmButton);
      setIsAlertVisible(true);
    },
    []
  );

  const hideAlert = useCallback(() => {
    setIsAlertVisible(false);
    setAlertTitle("");
    setAlertMessage("");
    setAlertOnConfirm(undefined);
    setShowAlertConfirmButton(false);
  }, []);

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];

    newCode[index] = text.slice(-1);
    setCode(newCode);

    if (text.length > 0 && index < code.length - 1) {
      textInputRefs.current[index + 1]?.focus();
    } else if (text.length > 0 && index === code.length - 1) {
      textInputRefs.current[index]?.blur();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === "Backspace") {
      const newCode = [...code];

      if (newCode[index] !== "") {
        newCode[index] = "";
        setCode(newCode);
      } else if (index > 0) {
        newCode[index - 1] = "";
        setCode(newCode);
        textInputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleVerification = async () => {
    const enteredCode = code.join("");
    if (enteredCode.length !== code.length) {
      showAlert(
        "Invalid Code",
        `Please enter the ${code.length}-digit verification code.`
      );
      return;
    }

    try {
      console.log("Verifying code:", enteredCode);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      router.push({
        pathname: "/(pages)/ResetPassword",
        params: { email: email, verificationCode: enteredCode },
      });
    } catch (error) {
      console.error("Failed to verify code:", error);
      showAlert(
        "Error",
        "Verification failed. Please check the code and try again."
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

      <Text style={styles.title}>Please Check your Email</Text>
      <Text style={styles.subtitle}>
        We have sent the code to{" "}
        <Text style={styles.emailText}>{email || "your email"}</Text>
      </Text>

      <View style={styles.codeInputContainer}>
        {code.map((digit, index) => (
          <TextInput
            key={index}
            style={styles.codeInput}
            keyboardType="numeric"
            maxLength={1}
            onChangeText={(text) => handleCodeChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            value={digit}
            ref={(input) => {
              textInputRefs.current[index] = input;
            }}
            caretHidden={true}
            textAlign="center"
            textContentType={Platform.OS === "ios" ? "oneTimeCode" : "none"}
            autoComplete={Platform.OS === "android" ? "sms-otp" : "off"}
          />
        ))}
      </View>

      <TouchableOpacity
        style={styles.verificationButton}
        onPress={handleVerification}
      >
        <Text style={styles.verificationButtonText}>Verification</Text>
      </TouchableOpacity>

      <CustomAlertModal
        isVisible={isAlertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={hideAlert}
        onConfirm={alertOnConfirm}
        showConfirmButton={showAlertConfirmButton}
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
    alignItems: "center",
  },
  backButton: {
    alignSelf: "flex-start",
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
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 40,
    textAlign: "center",
  },
  emailText: {
    fontWeight: "bold",
    color: "#000",
  },
  codeInputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 30,
  },
  codeInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    width: 50,
    height: 60,
    fontSize: 24,
    textAlign: "center",
    fontWeight: "bold",
  },
  countdownText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 40,
  },

  verificationButton: {
    backgroundColor: "#008b8b",
    padding: 18,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
  verificationButtonText: {
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
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "85%",
    maxWidth: 400,
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: "center",
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    color: "#008B8B",
  },
  modalMessage: {
    marginBottom: 20,
    textAlign: "center",
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#333",
  },
  okButton: {
    backgroundColor: "#008B8B",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 25,
    elevation: 2,
    minWidth: 120,
    alignItems: "center",
  },
  okButtonText: {
    color: "white",
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#E0E0E0",
  },
  confirmButton: {
    backgroundColor: "#20B2AA",
  },
  cancelButtonText: {
    color: "#555",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
  },
  confirmButtonText: {
    color: "white",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
  },
});

export default VerificationScreen;
