import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import React, { useContext, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AuthContext } from "@/context/AuthContext";

const continueSignUp = () => {
  const context = useContext(AuthContext);
  const user = context?.user;
  const setUser = context?.setUser;

  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [referralCode, setReferralCode] = useState("");

  const { firstName, lastName, username, email, password, image } =
    useLocalSearchParams();
  const router = useRouter();

  const handleSignUp = async () => {
    const request = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userName: username,
        firstName,
        lastName,
        password,
        email,
        phone,
        address,
        profilePic: image,
        referralCode,
      }),
    };

    try {
      const response = await fetch(
        "http://192.168.1.76:8080/api/auth/register",
        request
      );
      console.log(request);

      if (!response.ok) {
        const errorData = await response.json();
        console.log("Backend error:", errorData);
        throw new Error("Sign up failed");
      }

      const data = await response.json();
      console.log("Sign up successful:", data);
      setUser && setUser(data);
      router.replace("/(tabs)/" as any);
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <View style={styles.referralContainer}>
      <TextInput
        style={{ ...styles.input, width: "100%" }}
        placeholder="Phone Number"
        placeholderTextColor={"#555"}
        keyboardType="phone-pad"
        onChangeText={(text) => setPhone(text)}
      />
      <TextInput
        style={{ ...styles.input, width: "100%" }}
        placeholder="Address"
        placeholderTextColor={"#555"}
        onChangeText={(text) => setAddress(text)}
      />
      <TextInput
        style={{ ...styles.input, width: "100%" }}
        placeholder="Referral Code"
        placeholderTextColor={"#555"}
        onChangeText={(text) => setReferralCode(text)}
      />
      <Text style={styles.optionalText}>Optional</Text>
      <View>
        <TouchableOpacity style={styles.signUpBtn} onPress={handleSignUp}>
          <Text style={styles.signUpText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  signUpBtn: {
    width: "100%",
    backgroundColor: "#008B8B",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    padding: 15,
  },
  signUpText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "OpenSans_600SemiBold",
  },
  referralContainer: {
    width: "100%",
    position: "relative",
  },
  input: {
    height: 45,
    marginVertical: 15,
    borderWidth: 2,
    borderColor: "#008B8B",
    padding: 12,
    borderRadius: 10,
    fontFamily: "OpenSans_400Regular",
  },
  optionalText: {
    position: "absolute",
    right: 10,
    top: 30,
    fontSize: 12,
    color: "#666",
    fontFamily: "OpenSans_400Regular",
  },
});

export default continueSignUp;
