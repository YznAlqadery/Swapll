import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import React, { useState } from "react";
import { FontAwesome } from "@expo/vector-icons";
import { selectImage } from "@/services/selectImage";
import { SelectList } from "react-native-dropdown-select-list";

const AddPost = () => {
  const [images, setImages] = useState<string[]>([]);
  const [offerType, setOfferType] = useState<string>("");

  const offerTypes = [
    { key: "1", value: "Skill" },
    { key: "2", value: "Service" },
    { key: "3", value: "Item" },
  ];

  const handleSelectImage = async () => {
    const selectedImage = await selectImage();
    if (selectedImage) {
      setImages([...images, selectedImage]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView>
          <Text style={styles.header}>
            Add your {offerType.toLocaleLowerCase() || "offer"}
          </Text>
          <View style={styles.form}>
            <Text style={styles.label}>Type of Offer</Text>
            <SelectList
              setSelected={(val: any) => setOfferType(val)}
              data={offerTypes}
              save="value"
              boxStyles={{
                borderColor: "#008B8B",
                borderRadius: 5,
                borderWidth: 1,
                height: 45,
                marginBottom: 15,
                backgroundColor: "#FFFFFF",
              }}
              placeholder="Select offer type"
              arrowicon={
                <FontAwesome
                  name="angle-down"
                  size={20}
                  color="#008B8B"
                  style={{ marginRight: 5 }}
                />
              }
              search={false}
            />
            {offerType && (
              <>
                <Text style={styles.label}>Images</Text>
                <View style={styles.imagesContainer}>
                  {images.map((image, index) => (
                    <View key={index} style={styles.imageWrapper}>
                      <Image source={{ uri: image }} style={styles.image} />
                      <TouchableOpacity
                        style={styles.removeImageBtn}
                        onPress={() => removeImage(index)}
                      >
                        <FontAwesome
                          name="times-circle"
                          size={20}
                          color="#FF6B6B"
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {images.length < 5 && (
                    <TouchableOpacity
                      style={styles.addImageBtn}
                      onPress={handleSelectImage}
                    >
                      <FontAwesome name="plus" size={24} color="#008B8B" />
                      <Text style={styles.addImageText}>
                        {images.length === 0 ? "Add Image" : "Add Another"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={styles.label}>Title</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter title"
                  placeholderTextColor={"gray"}
                />
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter description"
                  multiline
                  numberOfLines={4}
                  placeholderTextColor={"gray"}
                />
                <Text style={styles.label}>Price</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter price"
                  placeholderTextColor={"gray"}
                />
                <Text style={styles.label}>Location</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter location"
                  placeholderTextColor={"gray"}
                />
                <TouchableOpacity style={styles.button}>
                  <Text style={styles.buttonText}>Add</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F7F7",
  },
  header: {
    fontSize: 24,
    color: "#008B8B",
    marginLeft: 20,
    marginTop: 20,
    marginBottom: 20,
    textAlign: "center",
    fontFamily: "Poppins_700Bold",
  },
  form: {
    margin: 20,
    paddingBottom: 80,
  },
  label: {
    fontSize: 18,
    color: "#008B8B",
    marginBottom: 10,
    fontFamily: "Poppins_700Bold",
  },
  input: {
    height: 40,
    borderColor: "#008B8B",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingLeft: 10,
    backgroundColor: "#FFFFFF",
    fontFamily: "Poppins_400Regular",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 10,
    fontFamily: "Poppins_400Regular",
  },
  button: {
    backgroundColor: "#008B8B",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
  },
  imagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  imageWrapper: {
    width: 100,
    height: 100,
    margin: 5,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#008B8B",
  },
  removeImageBtn: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
  },
  addImageBtn: {
    width: 100,
    height: 100,
    borderWidth: 2,
    borderColor: "#008B8B",
    borderStyle: "dashed",
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
    backgroundColor: "rgba(0, 139, 139, 0.1)",
  },
  addImageText: {
    color: "#008B8B",
    marginTop: 5,
    fontSize: 12,
    textAlign: "center",
    fontFamily: "Poppins_400Regular",
  },
});

export default AddPost;
