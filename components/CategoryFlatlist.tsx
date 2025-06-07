import React from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity } from "react-native";
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
          fontFamily: "Poppins_700Bold",
          fontSize: 16,
        }}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );
};

const CategoryFlatlist = ({ data, handleSelect, selectedCategory }: any) => {
  return (
    <FlatList
      data={data}
      horizontal={true}
      renderItem={({ item }) => (
        <CategoryItem
          item={item.title} // pass the title string here
          selectedCategory={selectedCategory}
          handleSelect={handleSelect}
        />
      )}
      keyExtractor={(item) => item.id.toString()} // use id as key
      showsHorizontalScrollIndicator={false}
    />
  );
};

export default CategoryFlatlist;

const styles = StyleSheet.create({
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
});
