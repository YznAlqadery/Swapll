import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import React, { useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import SkipButton from "@/components/SkipButton";

const category = () => {
  const { selected } = useLocalSearchParams();
  const [selectedCategory, setSelectedCategory] = useState("");

  const handleSelect = (text: string) => {
    setSelectedCategory((prevSelected) => (prevSelected === text ? "" : text));
  };
  // dummy data
  // type of data and their subcategories
  const categoryData = [
    {
      type: "Food",
      subcategories: ["Meal", "Snack", "Drink"],
    },
    {
      type: "Clothing",
      subcategories: ["T-Shirt", "Pants", "Shoes"],
    },
    {
      type: "Electronics",
      subcategories: ["Phone", "Laptop", "Tablet"],
    },
    {
      type: "Furniture",
      subcategories: ["Chair", "Table", "Sofa"],
    },
    {
      type: "Books",
      subcategories: ["Fiction", "Non-Fiction", "Mystery"],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Text style={styles.header}>
          Type of {selected.toString().toLocaleLowerCase()} you are offering
        </Text>
      </View>

      <FlatList
        data={categoryData}
        keyExtractor={(item) => item.type}
        renderItem={({ item }) => (
          <View>
            <TouchableOpacity
              onPress={() => handleSelect(item.type)}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginHorizontal: 20,
                marginVertical: 10,
                padding: 10,
                borderWidth: selectedCategory === item.type ? 2 : 0,
                borderColor:
                  selectedCategory === item.type ? "#008B8B" : "white",
                borderRadius: 10,
                backgroundColor: "#008B8B",
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontFamily: "OpenSans_700Bold",
                  color: "#F0F7F7",
                }}
              >
                {item.type}
              </Text>

              <TouchableOpacity onPress={() => handleSelect(item.type)}>
                <FontAwesome5 name="chevron-down" size={24} color="#F0F7F7" />
              </TouchableOpacity>
            </TouchableOpacity>

            {selectedCategory === item.type && (
              <View
                style={{ marginHorizontal: 20, marginTop: 5, marginBottom: 15 }}
              >
                {item.subcategories.map((subcat, index) => (
                  <TouchableOpacity
                    key={index}
                    style={{
                      backgroundColor: "#F0F7F7",
                      padding: 10,
                      marginVertical: 5,
                      borderRadius: 8,
                      borderLeftWidth: 3,
                      borderLeftColor: "#008B8B",
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "OpenSans_600SemiBold",
                        color: "#008B8B",
                      }}
                    >
                      {subcat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      />
      <SkipButton />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    fontSize: 22,
    marginHorizontal: 20,
    marginVertical: 10,
    fontFamily: "OpenSans_700Bold",
    color: "#008B8B",
  },
});

export default category;
