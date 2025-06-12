import React from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity } from "react-native";

type Category = {
  id: number;
  title: string;
};

interface CategoryItemProps {
  item: Category;
  selectedCategoryId: number | null;
  onCategoryPress: (id: number) => void; // Renamed for clarity: tells parent a category was pressed
}

// Memoize CategoryItem for performance, as it's rendered in a FlatList
const CategoryItem = React.memo(
  ({ item, selectedCategoryId, onCategoryPress }: CategoryItemProps) => {
    const isSelected = selectedCategoryId === item.id;

    return (
      <TouchableOpacity
        style={[
          styles.categoryItem,
          { backgroundColor: isSelected ? "#008B8B" : "#fff" },
        ]}
        onPress={() => onCategoryPress(item.id)} // Call the consolidated press handler
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
  }
);

interface CategoryFlatlistProps {
  data: Category[];
  selectedCategoryId: number | null;
  setSelectedCategoryId: React.Dispatch<React.SetStateAction<number | null>>;
  // Removed setCategory prop from here, as its logic is now fully handled in Index.tsx's useEffect
}

const CategoryFlatlist: React.FC<CategoryFlatlistProps> = ({
  data,
  selectedCategoryId,
  setSelectedCategoryId,
}) => {
  const handleCategoryPress = (id: number) => {
    setSelectedCategoryId((prevId) => (prevId === id ? 0 : id));
  };

  return (
    <FlatList
      data={data}
      horizontal={true}
      renderItem={({ item }) => (
        <CategoryItem
          item={item}
          selectedCategoryId={selectedCategoryId}
          onCategoryPress={handleCategoryPress}
        />
      )}
      keyExtractor={(item) => item.id.toString()}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.flatlistContent} // Added for better spacing control
    />
  );
};

export default CategoryFlatlist;

const styles = StyleSheet.create({
  flatlistContent: {
    paddingHorizontal: 8, // Add some padding around the items
  },
  categoryItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 8, // Adjusted for better touch target
    paddingHorizontal: 16,
    marginHorizontal: 8,
    marginVertical: 16, // Keep margin vertical for consistent spacing
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    justifyContent: "center",
    alignItems: "center",
  },
});
