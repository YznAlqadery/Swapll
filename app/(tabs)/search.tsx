import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from "react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FontAwesome } from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { SelectList } from "react-native-dropdown-select-list";
import Slider from "@react-native-community/slider";
import { useQuery } from "@tanstack/react-query";
import { fetchCategories, Offer } from ".";
import { useAuth } from "@/context/AuthContext";
import CategoryFlatlist from "@/components/CategoryFlatlist";
import { useRouter } from "expo-router";

const Search = () => {
  const { user: token } = useAuth();

  const [searchText, setSearchText] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [categoryId, setCategoryId] = useState<number | null>(null);

  const [searchedOffers, setSearchedOffers] = useState<Offer[]>([]);

  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [offerImageMap, setOfferImageMap] = useState<Map<string, string>>(
    new Map()
  );

  const router = useRouter();

  const { data: categories, isLoading: categoriesIsLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => fetchCategories(token as string),
    staleTime: 1000 * 60 * 5,
  });

  const paymentMethods = [
    { key: "1", value: "SWAP" },
    { key: "2", value: "COIN" },
    { key: "3", value: "BOTH" },
  ];

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

  type SearchParams = {
    keyword?: string;
    categoryId?: number;
    minPrice?: number;
    maxPrice?: number;
    paymentMethod?: string; // or your PaymentMethod type
  };

  async function handleSearch(params: SearchParams) {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/offers/search`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json", // <-- important for JSON payload
          },
          body: JSON.stringify(params),
        }
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const results = await response.json();
      setSearchedOffers(results);
      setSearchText("");
      setCategoryId(null);
      setMinPrice(0);
      setMaxPrice(1000);
      setPaymentMethod("");

      setCategoryId(null);
    } catch (error) {
      console.error("Search failed:", error);
    }
  }

  function renderOffer({ item }: { item: Offer }): JSX.Element | null {
    return (
      <TouchableOpacity
        style={styles.offerItem}
        onPress={() => {
          router.push({
            pathname: "/(pages)/OfferDetails",
            params: {
              offerId: item.id,
            },
          });
        }}
      >
        <View style={styles.offerImageContainer}>
          <Image
            source={
              item.image
                ? { uri: item.image }
                : require("@/assets/images/no_image.jpeg")
            }
            style={styles.offerImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.offerDetails}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.username}>by {item.username}</Text>
          <Text style={styles.description}>{item.description}</Text>

          <View style={styles.priceButtonsRow}>
            <View style={styles.priceContainer}>
              <Image
                style={styles.coin}
                source={require("@/assets/images/swapll_coin.png")}
              />
              <Text style={styles.price}>{item.price}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

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
            <TouchableOpacity
              onPress={() =>
                handleSearch({
                  keyword: searchText || undefined,
                  categoryId: categoryId ?? undefined, // safely handle null/undefined
                  minPrice: minPrice ?? undefined,
                  maxPrice: maxPrice ?? undefined,
                  paymentMethod: paymentMethod || undefined,
                })
              }
            >
              <FontAwesome
                name="search"
                size={20}
                color="#008B8B"
                style={{ margin: 10 }}
              />
            </TouchableOpacity>
            <TextInput
              placeholder="Search"
              style={{
                width: "80%",
                fontFamily: "Poppins_400Regular",
              }}
              placeholderTextColor="#008B8B"
              onChangeText={(text) => setSearchText(text)}
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
        {isLoadingImages && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#008B8B" />
          </View>
        )}
        {searchedOffers.length === 0 && (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>No results found</Text>
          </View>
        )}
        {!isLoadingImages && (
          <>
            <View
              style={{
                marginBottom: 150,
              }}
            >
              <FlatList
                data={searchedOffers}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderOffer}
                contentContainerStyle={styles.listContainer}
              />
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
                  {categoryId && (
                    <TouchableOpacity onPress={() => setCategoryId(null)}>
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
                <View
                  style={{
                    height: 70,
                  }}
                >
                  <CategoryFlatlist
                    data={categories}
                    setSelectedCategoryId={setCategoryId}
                    selectedCategoryId={categoryId}
                  />
                </View>
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

                    marginBottom: 5,
                    borderWidth: 2,
                    borderColor: "#B0C4C4",
                    padding: 16,
                    borderRadius: 10,
                    backgroundColor: "#FFFFFF",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                    transitionDuration: "200ms",
                  }}
                  fontFamily="Poppins_400Regular"
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
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Image
                        source={require("@/assets/images/swapll_coin.png")}
                        style={{ width: 16, height: 16, marginRight: 4 }}
                      />
                      <Text
                        style={{
                          color: "#008B8B",
                          fontFamily: "Poppins_400Regular",
                        }}
                      >
                        Min: {minPrice}
                      </Text>
                    </View>

                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginTop: 4,
                      }}
                    >
                      <Image
                        source={require("@/assets/images/swapll_coin.png")}
                        style={{ width: 16, height: 16, marginRight: 4 }}
                      />
                      <Text
                        style={{
                          color: "#008B8B",
                          fontFamily: "Poppins_400Regular",
                        }}
                      >
                        Max: {maxPrice}
                      </Text>
                    </View>
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
                    handleSearch({
                      keyword: searchText || undefined,
                      categoryId: categoryId ?? undefined,
                      minPrice,
                      maxPrice,
                      paymentMethod: paymentMethod || undefined,
                    });
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
          </>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F7F7",
    padding: 10,
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

  listContainer: {
    padding: 10,
  },
  offerImageContainer: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginVertical: 8,
    overflow: "hidden",
  },
  offerImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  offerDetails: {
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginVertical: 8,
  },
  offerItem: {
    width: 300,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignSelf: "center",
    marginVertical: 10,
  },
  title: {
    color: "#008B8B",
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
  },
  username: {
    color: "#666",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    marginBottom: 4,
  },
  description: {
    color: "#008B8B",
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    backgroundColor: "#E0FFFF",
    padding: 6,
    borderRadius: 8,
  },
  coin: {
    width: 25,
    height: 25,
    marginRight: 4,
    borderRadius: 50,
  },
  price: {
    color: "#008B8B",
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
  },

  headerContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  priceButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginTop: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noResultsText: {
    color: "#008B8B",
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    marginBottom: 4,
  },
});
export default Search;
