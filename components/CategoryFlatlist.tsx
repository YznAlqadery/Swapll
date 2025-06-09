import React from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity } from "react-native";

type Category = {
  id: number;
  title: string;
};

const CategoryItem = ({
  item,
  selectedCategoryId,
  handleSelect,
  setCategory,
}: {
  item: Category;
  selectedCategoryId: number | null;
  handleSelect: (id: number) => void;
  setCategory?: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const isSelected = selectedCategoryId === item.id;

  return (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        { backgroundColor: isSelected ? "#008B8B" : "#fff" },
      ]}
      onPress={() => {
        handleSelect(item.id);
        if (setCategory) {
          setCategory((prevCategory) =>
            prevCategory === item.title ? "" : item.title
          );
        }
      }}
    >
      <Text
        style={{
          color: isSelected ? "#F0F7F7" : "#008B8B",
          fontFamily: "Poppins_700Bold",
          fontSize: 16,
        }}
      >
        {item.title}
      </Text>
    </TouchableOpacity>
  );
};

interface CategoryFlatlistProps {
  data: Category[];
  selectedCategoryId: number | null;
  setSelectedCategoryId: React.Dispatch<React.SetStateAction<number | null>>;
  setCategory?: React.Dispatch<React.SetStateAction<string>>;
}

const CategoryFlatlist: React.FC<CategoryFlatlistProps> = ({
  data,
  selectedCategoryId,
  setSelectedCategoryId,
  setCategory,
}) => {
  const handleSelect = (id: number) => {
    setSelectedCategoryId((prevId) => (prevId === id ? null : id));
  };

  return (
    <FlatList
      data={data}
      horizontal={true}
      renderItem={({ item }) => (
        <CategoryItem
          item={item}
          selectedCategoryId={selectedCategoryId}
          handleSelect={handleSelect}
          setCategory={setCategory}
        />
      )}
      keyExtractor={(item) => item.id.toString()}
      showsHorizontalScrollIndicator={false}
    />
  );
};

export default CategoryFlatlist;

const styles = StyleSheet.create({
  categoryItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
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
