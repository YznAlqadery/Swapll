import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from "react-native";
import React, { useState } from "react";
import CustomBottomSheet from "@/components/BottomSheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export interface Offer {
  id: string;
  owner: string;
  title: string;
  image: string;
  description: string;
  price: number;
  deliveryTime: string;
  status: string;
  offerType: string;
  paymentMethod: string;
}

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

const OfferItem = ({
  item,
  selectedOffer,
  handleSelectOffer,
}: {
  item: Offer;
  selectedOffer: Offer;
  handleSelectOffer: (item: Offer) => void;
}) => {
  return (
    <TouchableOpacity
      style={styles.offerItem}
      onPress={() => handleSelectOffer(item)}
    >
      <View style={styles.offerImageContainer}>
        <Image
          source={{ uri: item.image }}
          style={styles.offerImage}
          resizeMode="cover"
        />
      </View>
      <View style={styles.offerDetails}>
        <Text
          style={{
            color: "#008B8B",
            fontFamily: "OpenSans_700Bold",
            fontSize: 16,
          }}
        >
          {item.title}
        </Text>
        <Text
          style={{
            color: "#666",
            fontFamily: "OpenSans_600SemiBold",
            fontSize: 13,
            marginBottom: 4,
          }}
        >
          by {item.owner}
        </Text>
        <Text
          style={{
            color: "#008B8B",
            fontFamily: "OpenSans_400Regular",
            fontSize: 14,
          }}
        >
          {item.description}
        </Text>
        <Text
          style={{
            color: "#008B8B",
            fontFamily: "OpenSans_700Bold",
            fontSize: 15,
            marginTop: 6,
          }}
        >
          ${item.price}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [sheetOpen, setSheetOpen] = useState<boolean>(false);

  const handleSelect = (item: string) => {
    setSelectedCategory((prev) => (prev === item ? "" : item));
  };
  const handleSelectOffer = (offer: Offer) => {
    if (selectedOffer?.id === offer.id && sheetOpen) {
      setSheetOpen(false);
      setTimeout(() => {
        setSelectedOffer(offer);
        setSheetOpen(true);
      }, 300); // Wait for the sheet to close before reopening
    } else {
      setSelectedOffer(offer);
      setSheetOpen(true);
    }
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

  const offers = [
    {
      id: "1",
      title: "Math Tutoring",
      description:
        "Get help with algebra, calculus, and more from an experienced tutor.",
      price: 20,
      deliveryTime: "2 days",
      status: "active",
      image: "https://images.unsplash.com/photo-1503676382389-4809596d5290",
      offerType: "skill",
      paymentMethod: "cash",
      owner: "Alice Johnson",
    },
    {
      id: "2",
      title: "Logo Design",
      description: "Professional logo design for your business or project.",
      price: 50,
      deliveryTime: "3 days",
      status: "active",
      image: "https://images.unsplash.com/photo-1464983953574-0892a716854b",
      offerType: "service",
      paymentMethod: "credit card",
      owner: "Bob Smith",
    },
    {
      id: "3",
      title: "Used Laptop",
      description: "Dell Inspiron, 8GB RAM, 256GB SSD, lightly used.",
      price: 300,
      deliveryTime: "1 day",
      status: "sold",
      image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8",
      offerType: "item",
      paymentMethod: "cash",
      owner: "Charlie Lee",
    },
    {
      id: "4",
      title: "Guitar Lessons",
      description: "Learn to play acoustic or electric guitar from scratch.",
      price: 25,
      deliveryTime: "1 week",
      status: "active",
      image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4",
      offerType: "skill",
      paymentMethod: "paypal",
      owner: "Diana Evans",
    },
    {
      id: "5",
      title: "House Cleaning",
      description: "Thorough cleaning for apartments and houses.",
      price: 40,
      deliveryTime: "2 days",
      status: "active",
      image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
      offerType: "service",
      paymentMethod: "credit card",
      owner: "Emily Carter",
    },
    {
      id: "6",
      title: "Mountain Bike",
      description: "Well-maintained mountain bike, ready for trails.",
      price: 150,
      deliveryTime: "Immediate",
      status: "active",
      image: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308",
      offerType: "item",
      paymentMethod: "cash",
      owner: "Frank Miller",
    },
    {
      id: "7",
      title: "Spanish Translation",
      description:
        "Translate documents from English to Spanish quickly and accurately.",
      price: 15,
      deliveryTime: "1 day",
      status: "active",
      image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca",
      offerType: "service",
      paymentMethod: "paypal",
      owner: "Gabriela Ruiz",
    },
    {
      id: "8",
      title: "Handmade Scarf",
      description: "Warm, stylish, and handmade with love.",
      price: 30,
      deliveryTime: "3 days",
      status: "active",
      image: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2",
      offerType: "item",
      paymentMethod: "cash",
      owner: "Helen Kim",
    },
  ];

  return (
    <GestureHandlerRootView
      style={{
        flex: 1,
        backgroundColor: "#fff",
      }}
    >
      <SafeAreaView style={styles.container}>
        <Text style={styles.header}>Popular categories</Text>
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
        <View
          style={{
            flex: 1,
            marginVertical: 20,
            paddingBottom: 40,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontFamily: "OpenSans_700Bold",
              marginBottom: 20,
              color: "#008B8B",
              marginLeft: 20,
            }}
          >
            Popular offers
          </Text>
          <FlatList
            data={offers}
            renderItem={({ item }) => (
              <OfferItem
                item={item}
                selectedOffer={selectedOffer || ({} as Offer)}
                handleSelectOffer={handleSelectOffer}
              />
            )}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
          />
        </View>
        {selectedOffer && (
          <CustomBottomSheet
            offer={selectedOffer}
            open={sheetOpen}
            onClose={() => setSheetOpen(false)}
          />
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
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

  offerItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  offerDescription: {
    fontSize: 16,
    fontFamily: "OpenSans_400Regular",
    color: "#008B8B",
  },

  offerImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginVertical: 8,
  },

  offerImageContainer: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginVertical: 8,
    overflow: "hidden",
  },
  offerDetails: {
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginVertical: 8,
  },
});

export default Index;
