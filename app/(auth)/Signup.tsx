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
} from "react-native";
import React, { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { FontAwesome } from "@expo/vector-icons";
import { Link } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  Gesture,
  GestureHandlerRootView,
  ScrollView,
} from "react-native-gesture-handler";

const SignUp = () => {
  const [image, setImage] = useState<string | null>(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateText, setDateText] = useState("");

  // Image picker function for selecting an image on your device
  const selectImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // Date picker function for selecting a date

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || new Date();

    setShowDatePicker(Platform.OS === "ios");
    setDate(currentDate);

    const formattedDate = currentDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    setDateText(formattedDate);
  };
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.imageContainer}>
              {image ? (
                <View>
                  <View style={styles.imageWrapper}>
                    <TouchableOpacity onPress={selectImage}>
                      <Image source={{ uri: image }} style={styles.image} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.imageLabel}>Upload your photo</Text>
                </View>
              ) : (
                <View>
                  <View style={styles.imageWrapper}>
                    <TouchableOpacity
                      style={styles.iconContainer}
                      onPress={selectImage}
                    >
                      <FontAwesome name="user" size={40} color="#008B8B" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.imageLabel}>Upload your photo</Text>
                </View>
              )}
              <View
                style={{
                  marginTop: 25,
                  width: "100%",
                  flex: 1,
                  alignItems: "center",
                }}
              >
                <TextInput
                  style={{ ...styles.input, width: "100%" }}
                  placeholder="Email/Username"
                  placeholderTextColor={"#000"}
                />
                <View
                  style={{
                    flexDirection: "row",
                    width: "100%",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <TextInput
                    style={{ ...styles.input, width: "48%" }}
                    placeholder="First Name"
                    placeholderTextColor={"#000"}
                  />
                  <TextInput
                    style={{ ...styles.input, width: "48%" }}
                    placeholder="Last Name"
                    placeholderTextColor={"#000"}
                  />
                </View>
                <View style={styles.dateInputContainer}>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="Date of Birth"
                    placeholderTextColor={"#000"}
                    value={dateText}
                    editable={false}
                  />
                  <TouchableOpacity
                    style={styles.calendarIcon}
                    onPress={() => setShowDatePicker((prev) => !prev)}
                  >
                    <FontAwesome name="calendar" size={20} color="#008B8B" />
                  </TouchableOpacity>
                </View>
                {showDatePicker && (
                  <View style={styles.datePickerContainer}>
                    <DateTimePicker
                      value={date}
                      mode="date"
                      display="spinner"
                      onChange={handleDateChange}
                      maximumDate={new Date()}
                      minimumDate={new Date(1920, 0, 1)}
                      themeVariant="light"
                      textColor="#008B8B"
                    />
                  </View>
                )}
                <TextInput
                  style={{ ...styles.input, width: "100%" }}
                  placeholder="Password"
                  placeholderTextColor={"#000"}
                  secureTextEntry={true}
                />
                <TextInput
                  style={{ ...styles.input, width: "100%" }}
                  placeholder="Confirm Password"
                  placeholderTextColor={"#000"}
                  secureTextEntry={true}
                />
                <TextInput
                  style={{ ...styles.input, width: "100%" }}
                  placeholder="Refferal Code"
                  placeholderTextColor={"#000"}
                />
                <TouchableOpacity style={styles.signUpBtn}>
                  <Text style={styles.signUpText}>Sign Up</Text>
                </TouchableOpacity>
                <View
                  style={{
                    flexDirection: "row",
                    marginTop: 20,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "#000", fontSize: 14 }}>
                    Already have an account?{" "}
                  </Text>
                  <Link href="/Login">
                    <Text
                      style={{
                        color: "#008B8B",
                        fontSize: 14,
                        fontWeight: "bold",
                      }}
                    >
                      Login
                    </Text>
                  </Link>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F7F7",
    paddingTop: Platform.OS === "android" ? 25 : 0,
  },
  imageContainer: {
    width: "100%",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    padding: 20,
  },
  imageWrapper: {
    width: 75,
    height: 75,
    borderRadius: 100,
    overflow: "hidden",
    borderWidth: 4,
    borderColor: "#008B8B",
    marginLeft: 20,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  iconContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  imageLabel: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    color: "#000",
    marginTop: 10,
  },
  input: {
    height: 45,
    marginVertical: 15,
    borderWidth: 2,
    borderColor: "#008B8B",
    padding: 12,
    borderRadius: 10,
  },
  signUpBtn: {
    width: "100%",
    backgroundColor: "#008B8B",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    padding: 13,
  },
  signUpText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  dateInputContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    marginVertical: 15,
  },
  dateInput: {
    height: 40,
    borderWidth: 2,
    borderColor: "#008B8B",
    padding: 12,
    borderRadius: 10,
    width: "100%",
  },
  calendarIcon: {
    position: "absolute",
    right: 12,
    padding: 5,
  },
  datePickerContainer: {
    backgroundColor: "#F0F7F7",
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
    borderWidth: 2,
    borderColor: "#008B8B",
    width: "100%",
    alignItems: "center",
  },
});

export default SignUp;
