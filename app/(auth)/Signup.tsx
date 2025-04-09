import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  TextInput,
} from "react-native";
import React, { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { FontAwesome } from "@expo/vector-icons";

const SignUp = () => {
  const [image, setImage] = useState<string | null>(null);

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
  return (
    <SafeAreaView style={styles.container}>
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
            marginTop: 20,
            width: "100%",
            flex: 1,
            alignItems: "center",
          }}
        >
          <TextInput
            style={{ ...styles.input, width: "100%" }}
            placeholder="example@gmail.com"
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
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? 25 : 0,
  },
  imageContainer: {
    flex: 1,
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
    height: 40,
    marginVertical: 15,
    borderWidth: 2,
    borderColor: "#008B8B",
    padding: 10,
  },
});

export default SignUp;
