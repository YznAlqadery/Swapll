import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Alert,
  SafeAreaView,
  ActivityIndicator,
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

  const { firstName, lastName, username, email, password, image } =
    useLocalSearchParams();
  const router = useRouter();

  const queryClient = useQueryClient();

  const handleSignUp = async () => {
    Keyboard.dismiss();
    setLoading(true);

    const userPayload = {
      userName: username,
      firstName,
      lastName,
      password,
      email,
      phone,
      address,
      referralCode,
    };

    const formData = new FormData();

    formData.append("user", JSON.stringify(userPayload));

    if (image) {
      const fileUri = image as string;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        formData.append("profilePic", {
          uri: fileUri,
          name: "profile.jpg",
          type: "image/jpeg",
        } as any);
      }
    }

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/auth/register`,
        {
          method: "POST",
          // DO NOT set Content-Type header when sending FormData
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
        console.error("Backend error status:", response.status);
        console.error("Backend error body:", errorData);
        throw new Error(errorData.error || "Sign up failed");
      }

      const data = await response.json();
      console.log("Sign up successful:", data);
      if (setUser) {
        setUser(data.token);
      }

      //Prefetch categories and offers
      const categories = await queryClient.fetchQuery({
        queryKey: ["categories"],
        queryFn: () => fetchCategories(data.token),
      });

      const topRatedOffers = await queryClient.fetchQuery({
        queryKey: ["top-rated-offers"],
        queryFn: () => fetchTopRatedOffers(data.token),
      });

      const recentOffers = await queryClient.fetchQuery({
        queryKey: ["recent-offers"],
        queryFn: () => fetchRecentOffers(data.token),
      });

      router.replace("/(tabs)/" as any);
    } catch (error: any) {
      console.error("Sign up error:", error);
      Alert.alert(
        "Error",
        error.message || "Sign up failed. Please try again."
      );
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
      const username = await response.text(); // plain text response
      setReferralUser(username); // store the string
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
    }, 500); // wait 500ms after user stops typing

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
            <Text style={{ color: "#666", marginTop: 4 }}>
              Checking referral...
            </Text>
          )}

          {referralUser && referralUser.length > 9 && (
            <View style={styles.referralBox}>
              <Text
                style={{
                  color: "#008b8b",
                  fontFamily: "Poppins_400Regular",
                }}
              >
                🔴 {referralUser}
              </Text>
            </View>
          )}

          {referralUser && referralUser.length < 9 && (
            <View style={styles.referralBox}>
              <Text
                style={{ color: "#008b8b", fontFamily: "Poppins_400Regular" }}
              >
                🟢 Nice! Referred by{" "}
                <Text style={{ fontFamily: "Poppins_700Bold" }}>
                  {referralUser}
                </Text>
              </Text>
            </View>
          )}

          {referralError ? (
            <Text style={{ color: "red", marginTop: 4 }}>{referralError}</Text>
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
    transitionDuration: "200ms",
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
});

export default ContinueSignUp;
