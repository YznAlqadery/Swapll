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
  ScrollView,
  Modal,
  Pressable,
  Keyboard,
} from "react-native";
import React, { useState, useCallback } from "react";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { selectImage } from "@/services/selectImage";

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

interface LabeledInputProps {
  label: string;
  name: string;
  focusedInput: string | null;
  setFocusedInput: React.Dispatch<React.SetStateAction<string | null>>;
  error?: string;
  secureTextEntry?: boolean;
  showPasswordToggle?: boolean;
  onToggleShowPassword?: () => void;
  [key: string]: any;
}

const LabeledInput: React.FC<LabeledInputProps> = ({
  label,
  name,
  focusedInput,
  setFocusedInput,
  error,
  secureTextEntry,
  showPasswordToggle,
  onToggleShowPassword,
  ...props
}) => (
  <View style={styles.inputWrapper}>
    <Text style={styles.label}>{label}</Text>
    <View
      style={[
        styles.inputContainer,
        focusedInput === name && styles.inputFocused,
        error && styles.inputError,
      ]}
    >
      <TextInput
        {...props}
        placeholderTextColor="#888"
        style={styles.input}
        onFocus={() => setFocusedInput(name)}
        onBlur={() => setFocusedInput(null)}
        secureTextEntry={secureTextEntry}
      />
      {showPasswordToggle && (
        <TouchableOpacity onPress={onToggleShowPassword} style={styles.eyeIcon}>
          <Ionicons
            name={secureTextEntry ? "eye-off" : "eye"}
            size={20}
            color="#666"
          />
        </TouchableOpacity>
      )}
    </View>
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
);

interface PasswordValidity {
  minLength: boolean;
  hasNumber: boolean;
  hasUpper: boolean;
  hasLower: boolean;
}

const SignUp = () => {
  const [image, setImage] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertOnConfirm, setAlertOnConfirm] = useState<
    (() => void) | undefined
  >(undefined);

  const router = useRouter();

  const showAlert = useCallback(
    (title: string, message: string, onConfirm?: () => void) => {
      setAlertTitle(title);
      setAlertMessage(message);
      setAlertOnConfirm(() => onConfirm);
      setIsAlertVisible(true);
    },
    []
  );

  const hideAlert = useCallback(() => {
    setIsAlertVisible(false);
    setAlertTitle("");
    setAlertMessage("");
    setAlertOnConfirm(undefined);
  }, []);

  const handleSelectImage = useCallback(async () => {
    const selectedImage = await selectImage();
    if (selectedImage) setImage(selectedImage);
  }, []);

  const isPasswordValid = (pwd: string): PasswordValidity => {
    const minLength = pwd.length >= 8;
    const hasNumber = /[0-9]/.test(pwd);
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    return { minLength, hasNumber, hasUpper, hasLower };
  };

  const handleToggleShowPassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const handleToggleShowConfirmPassword = useCallback(() => {
    setShowConfirmPassword((prev) => !prev);
  }, []);

  const handleContinue = useCallback(() => {
    Keyboard.dismiss();
    const newErrors: { [key: string]: string } = {};
    let hasValidationError = false;

    if (!firstName.trim()) {
      newErrors.firstName = "First name is required.";
      hasValidationError = true;
    }
    if (!lastName.trim()) {
      newErrors.lastName = "Last name is required.";
      hasValidationError = true;
    }
    if (!username.trim()) {
      newErrors.username = "Username is required.";
      hasValidationError = true;
    }
    if (!email.trim()) {
      newErrors.email = "Email is required.";
      hasValidationError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address.";
      hasValidationError = true;
    }
    if (!password.trim()) {
      newErrors.password = "Password is required.";
      hasValidationError = true;
    } else {
      const pwdValidity = isPasswordValid(password);
      if (!pwdValidity.minLength) {
        newErrors.password = "Password must be at least 8 characters.";
        hasValidationError = true;
      } else if (!pwdValidity.hasNumber) {
        newErrors.password = "Password must contain at least one number.";
        hasValidationError = true;
      } else if (!pwdValidity.hasUpper) {
        newErrors.password =
          "Password must contain at least one uppercase letter.";
        hasValidationError = true;
      } else if (!pwdValidity.hasLower) {
        newErrors.password =
          "Password must contain at least one lowercase letter.";
        hasValidationError = true;
      }
    }
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Confirm password is required.";
      hasValidationError = true;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
      hasValidationError = true;
    }

    setErrors(newErrors);

    if (hasValidationError) {
      showAlert("Validation Error", "Please correct the highlighted fields.");
      return;
    }

    router.push({
      pathname: "/(auth)/continueSignUp",
      params: {
        firstName,
        lastName,
        username,
        email,
        password,
        image,
      },
    });
  }, [
    firstName,
    lastName,
    username,
    email,
    password,
    confirmPassword,
    image,
    showAlert,
    router,
  ]);

  return (
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
              error={errors.email}
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
                  error={errors.firstName}
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
                  error={errors.lastName}
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
              error={errors.username}
            />
            <LabeledInput
              label="Password"
              name="password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              focusedInput={focusedInput}
              setFocusedInput={setFocusedInput}
              error={errors.password}
              showPasswordToggle={true}
              onToggleShowPassword={handleToggleShowPassword}
            />

            <LabeledInput
              label="Confirm Password"
              name="confirmPassword"
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              focusedInput={focusedInput}
              setFocusedInput={setFocusedInput}
              error={errors.confirmPassword}
              showPasswordToggle={true}
              onToggleShowPassword={handleToggleShowConfirmPassword}
            />

            <TouchableOpacity style={styles.signUpBtn} onPress={handleContinue}>
              <Text style={styles.signUpText}>Continue</Text>
            </TouchableOpacity>

            <View style={styles.loginPrompt}>
              <Text style={styles.promptText}>Already have an account?</Text>
              <Link href="/Login">
                <Text style={styles.loginLink}>Login</Text>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomAlertModal
        isVisible={isAlertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={hideAlert}
        onConfirm={alertOnConfirm}
      />
    </SafeAreaView>
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
  inputWrapper: {
    width: "100%",
    marginBottom: 15,
  },
  label: {
    marginBottom: 5,
    color: "#008B8B",
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 45,
    borderWidth: 2,
    borderColor: "#B0C4C4",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    paddingHorizontal: 15,
    fontFamily: "Poppins_400Regular",
    color: "#000",
  },
  inputFocused: {
    borderColor: "#008B8B",
    shadowColor: "#008B8B",
    shadowOpacity: 0.4,
    elevation: 5,
  },
  inputError: {
    borderColor: "#FF6B6B",
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 12,
    marginTop: 4,
    fontFamily: "Poppins_400Regular",
  },
  eyeIcon: {
    padding: 10,
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
export default SignUp;
