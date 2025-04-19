import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import React, { useState } from "react";

const CategoryItem = ({
  item,
  selectedCategory,
  handleSelect,
}: {
  item: string;
  selectedCategory: string;
  handleSelect: (item: string) => void;
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        {
          backgroundColor: selectedCategory === item ? "#008B8B" : "#fff",
        },
      ]}
      onPress={() => handleSelect(item)}
    >
      <Text
        style={{
          color: selectedCategory === item ? "#F0F7F7" : "#008B8B",
          fontFamily: "OpenSans_700Bold",
          fontSize: 16,
        }}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );
};

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const handleSelect = (item: string) => {
    setSelectedCategory((prev) => (prev === item ? "" : item));
  };
  const categories = [
    "Tutoring",
    "Programming",
    "Design",
    "Writing",
    "Translation",
    "Gardening",
    "Repairs",
    "Pet Care",
    "Music",
    "Cooking",
    "Fitness",
    "Cleaning",
    "Photography",
    "Crafts",
    "Language Learning",
    "Business Help",
    "Legal Help",
    "Marketing",
    "IT Support",
    "Other",
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Popular Categories</Text>
      <View style={{ height: 70 }}>
        <FlatList
          data={categories}
          horizontal={true}
          renderItem={({ item }) => (
            <CategoryItem
              item={item}
              selectedCategory={selectedCategory}
              handleSelect={handleSelect}
            />
          )}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F7F7",
  },

  categoryItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 0,
    paddingHorizontal: 10,
    marginHorizontal: 8,
    marginVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    fontSize: 24,
    fontFamily: "OpenSans_700Bold",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    color: "#008B8B",
  },
});

export default Index;
