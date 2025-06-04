import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
} from "react-native";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { FontAwesome } from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { SelectList } from "react-native-dropdown-select-list";
import Slider from "@react-native-community/slider";

const CategoryItem = ({ item, isActive, onPress }: any) => {
  return (
    <View>
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.categoryContainer,
          isActive && styles.activeCategoryContainer,
        ]}
      >
        <FontAwesome name={item.icon} size={24} color="#008B8B" />
        <Text style={styles.categoryText}>{item.value}</Text>
      </TouchableOpacity>
    </View>
  );
};

const Search = () => {
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  // dummy data
  const categories = [
    { key: "1", value: "Electronics", icon: "laptop" },
    { key: "2", value: "Furniture", icon: "bed" },
    { key: "3", value: "Clothing", icon: "shopping-bag" },
    { key: "4", value: "Home Services", icon: "home" },
    { key: "5", value: "Professional Services", icon: "briefcase" },
    { key: "6", value: "Technical Skills", icon: "cogs" },
    { key: "7", value: "Creative Skills", icon: "paint-brush" },
    { key: "8", value: "Language Skills", icon: "language" },
  ];

  const paymentMethods = [
    { key: "1", value: "Skill" },
    { key: "2", value: "Service" },
    { key: "3", value: "Item" },
    { key: "4", value: "Swapll Coin" },
  ];

  const handleActiveCategory = (index: number) => {
    setActiveCategory(index === activeCategory ? null : index);
  };
  // ref
  const bottomSheetRef = useRef<BottomSheet>(null);

  // callback
  const snapPoints = useMemo(() => ["83%"], []);

  // open bottom sheet
  const openBottomSheet = useCallback(() => {
    bottomSheetRef.current?.expand();
  }, []);

  const renderBackdrop = useCallback((props: any) => {
    return (
      <BottomSheetBackdrop
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        {...props}
      />
    );
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <View>
          <Text style={styles.header}>Find Skills, Services, or Items</Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            gap: 17,
            alignItems: "center",
          }}
        >
          <View style={styles.searchContainer}>
            <FontAwesome
              name="search"
              size={20}
              color="#008B8B"
              style={{ margin: 10 }}
            />
            <TextInput
              placeholder="Search"
              style={{
                width: "80%",
                fontFamily: "Poppins_400Regular",
              }}
              placeholderTextColor="#008B8B"
            />
          </View>
          <View>
            <TouchableOpacity
              onPress={openBottomSheet}
              style={styles.filterButton}
            >
              <FontAwesome name="sliders" size={20} color="#008B8B" />
            </TouchableOpacity>
          </View>
        </View>
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          enableDynamicSizing={true}
          enablePanDownToClose={true}
          backdropComponent={renderBackdrop}
          style={{
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}
        >
          <BottomSheetView style={styles.bottomSheetContainer}>
            <View style={styles.BottomHeaderContainer}>
              <Text style={styles.bottomSheetHeader}>Filter Search</Text>
              <Text style={styles.bottomSheetSubheader}>
                Filter by category, payment method, and more to find exactly
                what you're looking for.
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 5,
              }}
            >
              <Text style={{ ...styles.bottomSheetHeader, fontSize: 16 }}>
                Search Category
              </Text>
              {activeCategory !== null && (
                <TouchableOpacity onPress={() => setActiveCategory(null)}>
                  <Text
                    style={{
                      color: "#66B2B2",
                      fontSize: 14,
                      fontFamily: "Poppins_400Regular",
                      marginRight: 8,
                    }}
                  >
                    {`Clear All`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              horizontal={true}
              data={categories}
              renderItem={({ item, index }) => (
                <CategoryItem
                  item={item}
                  isActive={activeCategory === index}
                  onPress={() => handleActiveCategory(index)}
                />
              )}
              keyExtractor={(item) => item.key}
              style={{ maxHeight: 80 }}
            />
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 20,
                marginBottom: 5,
              }}
            >
              <Text style={{ ...styles.bottomSheetHeader, fontSize: 16 }}>
                Payment Method
              </Text>
              {paymentMethod !== "" && (
                <TouchableOpacity onPress={() => setPaymentMethod("")}>
                  <Text
                    style={{
                      color: "#66B2B2",
                      fontSize: 14,
                      fontFamily: "Poppins_400Regular",
                      marginRight: 8,
                    }}
                  >
                    {`Clear All`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <SelectList
              setSelected={(val: any) => setPaymentMethod(val)}
              data={paymentMethods}
              save="value"
              placeholder="Select payment method"
              boxStyles={{
                width: "100%",
                borderColor: "#008B8B",
                borderWidth: 1,
                borderRadius: 10,
                padding: 10,
                marginBottom: 10,
                marginTop: 10,
              }}
              inputStyles={{
                color: "#008B8B",
                fontFamily: "Poppins_400Regular",
              }}
              dropdownStyles={{
                borderRadius: 10,
                borderColor: "#008B8B",
                borderWidth: 1,
                backgroundColor: "#fff",
              }}
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
            <View style={{ marginTop: 20, marginBottom: 10 }}>
              <Text
                style={{
                  ...styles.bottomSheetHeader,
                  fontSize: 16,
                  marginBottom: 8,
                }}
              >
                Price Range
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ color: "#008B8B" }}>Min: {minPrice} JD</Text>
                <Text style={{ color: "#008B8B" }}>Max: {maxPrice} JD</Text>
              </View>
              <Slider
                style={{ width: "100%", height: 40 }}
                minimumValue={0}
                maximumValue={maxPrice}
                value={minPrice}
                onValueChange={setMinPrice}
                minimumTrackTintColor="#008B8B"
                maximumTrackTintColor="#B0C4C4"
                thumbTintColor="#008B8B"
                step={1}
              />
              <Slider
                style={{ width: "100%", height: 40 }}
                minimumValue={minPrice}
                maximumValue={1000}
                value={maxPrice}
                onValueChange={setMaxPrice}
                minimumTrackTintColor="#008B8B"
                maximumTrackTintColor="#B0C4C4"
                thumbTintColor="#008B8B"
                step={1}
              />
            </View>

            <TouchableOpacity
              onPress={() => {
                bottomSheetRef.current?.close();
              }}
              style={{
                width: "92%",
                justifyContent: "center",
                alignItems: "center",
                alignSelf: "center",
                padding: 10,
                borderRadius: 10,
                backgroundColor: "#008B8B",
                marginTop: "auto",
                marginBottom: 95,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 16,
                  fontFamily: "Poppins_500Medium",
                }}
              >
                Apply
              </Text>
            </TouchableOpacity>
          </BottomSheetView>
        </BottomSheet>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F7F7",
  },
  header: {
    fontSize: 24,
    textAlign: "center",
    padding: 10,
    fontFamily: "Poppins_700Bold",
    color: "#008B8B",
  },
  searchContainer: {
    width: "80%",
    justifyContent: "center",
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 10,
    marginLeft: 6,
    borderWidth: 2,
    borderColor: "#B0C4C4",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    fontFamily: "Poppins_400Regular",
    color: "#000",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bottomSheetContainer: {
    flex: 1,
    padding: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: "#fff",
  },
  BottomHeaderContainer: {
    width: "100%",
    alignSelf: "center",
    marginBottom: 20,
  },
  bottomSheetHeader: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    color: "#008B8B",
  },
  bottomSheetSubheader: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#66B2B2",
    marginTop: 8,
  },
  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 10,
    borderRadius: 10,
    borderColor: "#008B8B",
    borderWidth: 1,
    marginTop: 10,
    marginRight: 10,
    backgroundColor: "#fff",
  },
  categoryText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#008B8B",
    textAlign: "center",
  },
  activeCategoryContainer: {
    backgroundColor: "rgba(0, 139, 139, 0.1)",
    borderWidth: 2,
  },
  filterButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    marginTop: 10,

    borderWidth: 2,
    borderColor: "#B0C4C4",
    fontFamily: "Poppins_400Regular",
    color: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});
export default Search;
