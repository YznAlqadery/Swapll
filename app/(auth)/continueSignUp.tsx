import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Keyboard,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  Pressable,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import * as FileSystem from "expo-file-system";
import { useQueryClient } from "@tanstack/react-query";
import {
  fetchCategories,
  fetchRecentOffers,
  fetchTopRatedOffers,
} from "../(tabs)";

const ContinueSignUp = () => {
  const { setUser } = useAuth();

  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [referralUser, setReferralUser] = useState<string | null>(null);
  const [checkingReferral, setCheckingReferral] = useState(false);
  const [referralError, setReferralError] = useState("");

  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { firstName, lastName, username, email, password, image } =
    useLocalSearchParams();
  const router = useRouter();

  const queryClient = useQueryClient();

  const handleSignUp = async () => {
    Keyboard.dismiss();
    setLoading(true);
    setErrorMessage("");
    setIsErrorModalVisible(false);

    // Basic validation for phone and address
    if (!phone.trim()) {
      setErrorMessage("Please enter your phone number.");
      setIsErrorModalVisible(true);
      setLoading(false);
      return;
    }
    const phoneRegex = /^[0-9]{7,15}$/; // Example: 7 to 15 digits
    if (!phoneRegex.test(phone.trim())) {
      setErrorMessage(
        "Please enter a valid phone number (7-15 digits, numbers only)."
      );
      setIsErrorModalVisible(true);
      setLoading(false);
      return;
    }

    if (!address.trim()) {
      setErrorMessage("Please enter your address.");
      setIsErrorModalVisible(true);
      setLoading(false);
      return;
    }

    const userPayload = {
      userName: username,
      firstName,
      lastName,
      password,
      email,
      phone: phone.trim(),
      address: address.trim(),
      referralCode: referralCode.trim() || null, // Ensure empty string becomes null
    };

    const formData = new FormData();
    formData.append("user", JSON.stringify(userPayload));

    if (image) {
      const fileUri = image as string;
      try {
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (fileInfo.exists && fileInfo.uri) {
          const filename = fileInfo.uri.split("/").pop() ?? "profile.jpg";
          const ext = filename.split(".").pop()?.toLowerCase();
          const mimeType =
            ext === "png"
              ? "image/png"
              : ext === "jpg" || ext === "jpeg"
              ? "image/jpeg"
              : "application/octet-stream";
          formData.append("profilePic", {
            uri: fileInfo.uri,
            name: filename,
            type: mimeType,
          } as any);
        } else {
          setErrorMessage("Selected profile picture not found or invalid.");
          setIsErrorModalVisible(true);
          setLoading(false);
          return;
        }
      } catch (fileError: any) {
        setErrorMessage(
          `Error processing profile picture: ${fileError.message}`
        );
        setIsErrorModalVisible(true);
        setLoading(false);
        return;
      }
    }

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/auth/register`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errorData;
        if (contentType && contentType.includes("application/json")) {
          errorData = await response.json();
        } else {
          errorData = await response.text();
        }
        setErrorMessage(
          errorData.error || errorData || "Sign up failed. Please try again."
        );
        setIsErrorModalVisible(true);
        throw new Error(errorData.error || "Sign up failed");
      }

      const data = await response.json();
      if (setUser) {
        setUser(data.token);
      }

      queryClient.prefetchQuery({
        queryKey: ["categories"],
        queryFn: () => fetchCategories(data.token),
      });

      queryClient.prefetchQuery({
        queryKey: ["top-rated-offers"],
        queryFn: () => fetchTopRatedOffers(data.token),
      });

      queryClient.prefetchQuery({
        queryKey: ["recent-offers"],
        queryFn: () => fetchRecentOffers(data.token),
      });

      router.replace("/(tabs)/" as any);
    } catch (error: any) {
      if (!errorMessage) {
        setErrorMessage(
          error.message || "An unexpected error occurred during sign up."
        );
        setIsErrorModalVisible(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const checkReferralCode = async (code: string) => {
    setCheckingReferral(true);
    setReferralError("");
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/user/ref/${code}`
      );
      if (!response.ok) {
        throw new Error("Referral not found");
      }
      const username = await response.text();
      setReferralUser(username);
    } catch (err: any) {
      setReferralUser(null);
      setReferralError(err.message || "Invalid referral code");
    } finally {
      setCheckingReferral(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (referralCode.trim()) {
        checkReferralCode(referralCode.trim());
      } else {
        setReferralUser(null);
        setReferralError("");
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [referralCode]);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#F0F7F7",
      }}
    >
      <View style={styles.container}>
        <Text style={styles.headingText}>Complete Your Sign Up</Text>

        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={[
              styles.input,
              focusedInput === "phone" && styles.inputFocused,
            ]}
            placeholder="e.g. 07912345678"
            placeholderTextColor="#555"
            keyboardType="phone-pad"
            onChangeText={setPhone}
            value={phone}
            onFocus={() => setFocusedInput("phone")}
            onBlur={() => setFocusedInput(null)}
          />
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={[
              styles.input,
              focusedInput === "address" && styles.inputFocused,
            ]}
            placeholder="e.g. Tabrbour Amman, Jordan"
            placeholderTextColor="#555"
            onChangeText={setAddress}
            value={address}
            onFocus={() => setFocusedInput("address")}
            onBlur={() => setFocusedInput(null)}
          />
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.label}>
            Referral Code <Text style={styles.optionalLabel}>(Optional)</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              focusedInput === "referralCode" && styles.inputFocused,
            ]}
            placeholder="e.g. A1B2C3D4"
            placeholderTextColor="#555"
            onChangeText={setReferralCode}
            value={referralCode}
            onFocus={() => setFocusedInput("referralCode")}
            onBlur={() => setFocusedInput(null)}
          />

          {checkingReferral && (
            <Text
              style={{
                color: "#666",
                marginTop: 4,
                fontFamily: "Poppins_400Regular",
              }}
            >
              Checking referral...
            </Text>
          )}

          {referralUser &&
            referralUser.length > 0 && ( // Check for non-empty string
              <View style={styles.referralBox}>
                <Text
                  style={{
                    color: "#008b8b",
                    fontFamily: "Poppins_400Regular",
                  }}
                >
                  🟢 Nice! Referred by{" "}
                  <Text style={{ fontFamily: "Poppins_700Bold" }}>
                    {referralUser}
                  </Text>
                </Text>
              </View>
            )}

          {referralError ? (
            <Text
              style={{
                color: "red",
                marginTop: 4,
                fontFamily: "Poppins_400Regular",
              }}
            >
              {referralError}
            </Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.signUpBtn, loading && styles.signUpBtnDisabled]}
          onPress={handleSignUp}
          disabled={loading}
        >
          <Text style={styles.signUpText}>
            {loading ? <ActivityIndicator color={"#fff"} /> : "Sign Up"}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={isErrorModalVisible}
        onRequestClose={() => setIsErrorModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsErrorModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Sign-up Error</Text>
              <Text style={styles.modalMessage}>{errorMessage}</Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setIsErrorModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Got It</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    padding: 20,
  },
  headingText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#008B8B",
    marginBottom: 25,
    fontFamily: "OpenSans_700Bold",
    textAlign: "center",
  },
  inputWrapper: {
    position: "relative",
    marginVertical: 15,
    width: "100%",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#008B8B",
    marginBottom: 6,
    fontFamily: "OpenSans_600SemiBold",
  },
  optionalLabel: {
    fontWeight: "400",
    fontSize: 12,
    color: "#666",
  },
  input: {
    height: 45,
    marginBottom: 5,
    borderWidth: 2,
    borderColor: "#B0C4C4",
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    fontFamily: "Poppins_400Regular",
    color: "#000",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputFocused: {
    borderColor: "#008B8B",
    shadowColor: "#008B8B",
    shadowOpacity: 0.4,
    elevation: 5,
  },
  signUpBtn: {
    width: "100%",
    backgroundColor: "#008B8B",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    paddingVertical: 15,
  },
  signUpBtnDisabled: {
    backgroundColor: "#80B8B8",
  },
  signUpText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "OpenSans_600SemiBold",
  },
  referralBox: {
    backgroundColor: "#E0FFFF",
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#008b8b",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalContent: {
    width: "100%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "OpenSans_700Bold",
    color: "#D9534F",
    marginBottom: 15,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: "#008B8B",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 25,
    marginTop: 10,
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "OpenSans_600SemiBold",
  },
});

export default ContinueSignUp;
