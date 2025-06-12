// app/verify-code.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

// Correct way to define screen options for Expo Router file-system routing
// Export 'options' directly from the file, not as a property of the component.
export const options = {
  title: "Verify Code",
  headerShown: false, // Hide the header if your design doesn't have one
};

// You can remove unstable_settings if you don't need it for static optimization or initialRouteName specific to a group
// export const unstable_settings = {
//   // initialRouteName: 'verify-code',
// };

const VerificationScreen: React.FC = () => {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  // Assuming a 6-digit code based on your useState initialization
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);

  const textInputRefs = useRef<(TextInput | null)[]>([]);

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];

    // Always take the last character entered for a digit input
    newCode[index] = text.slice(-1);
    setCode(newCode);

    // Auto-focus to next input if a character was entered and it's not the last input
    if (text.length > 0 && index < code.length - 1) {
      textInputRefs.current[index + 1]?.focus();
    }
    // If it's the last input and a character is entered, blur the keyboard
    else if (text.length > 0 && index === code.length - 1) {
      textInputRefs.current[index]?.blur();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === "Backspace") {
      const newCode = [...code];

      // If the current input has a value, clear it
      if (newCode[index] !== "") {
        newCode[index] = "";
        setCode(newCode);
      }
      // If the current input is empty AND it's not the first input,
      // move focus to the previous input and clear its value
      else if (index > 0) {
        newCode[index - 1] = ""; // Clear the previous input's value
        setCode(newCode);
        textInputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleVerification = async () => {
    const enteredCode = code.join("");
    // Check if all inputs are filled based on `code.length`
    if (enteredCode.length !== code.length) {
      Alert.alert(
        "Invalid Code",
        `Please enter the ${code.length}-digit verification code.`
      );
      return;
    }

    try {
      console.log("Verifying code:", enteredCode);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Adjusted path assuming 'app/reset-password.tsx'
      router.push({
        pathname: "/(pages)/ResetPassword",
        params: { email: email, verificationCode: enteredCode },
      });
    } catch (error) {
      console.error("Failed to verify code:", error);
      Alert.alert(
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
  resendLink: {
    color: "#000",
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  verificationButton: {
    backgroundColor: "#000",
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

export default VerificationScreen;
