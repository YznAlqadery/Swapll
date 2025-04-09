import { View, Image, Dimensions, StyleSheet, Text } from "react-native";
import { Marquee } from "@animatereactnative/marquee";
import { Stagger } from "@animatereactnative/stagger";
import Animated, {
  FadeIn,
  FadeInUp,
  FadeOut,
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
  Easing,
  SharedValue,
  useAnimatedStyle,
  interpolate,
} from "react-native-reanimated";
import { useState, useEffect } from "react";
import { useNavigation } from "expo-router";
import AuthButtons from "./AuthButton";

const images = [
  "https://images.unsplash.com/photo-1633613286991-611fe299c4be?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80", // Cartoon exchange
  "https://images.unsplash.com/photo-1580130732478-4e339fb6836f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1374&q=80", // Cartoon collaboration
  "https://images.unsplash.com/photo-1607457561901-e6ec3a6d16cf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1374&q=80", // Cartoon handshake
  "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1488&q=80", // Cartoon community
  "https://images.unsplash.com/photo-1634128221889-82ed6efebfc3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80", // Cartoon sharing
  "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1374&q=80", // Cartoon marketplace
  "https://images.unsplash.com/photo-1633613286848-e6f43bbafb8d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80", // Cartoon teamwork
];

// Add quality and size parameters to optimize image loading
const optimizedImages = images.map(
  (url) => `${url}?auto=format&q=80&w=800&fit=crop`
);

const { width } = Dimensions.get("window");
const _itemWidth = width * 0.62; // 62% of the screen width
const _itemHeight = _itemWidth * 1.2; // 120% of the item width
const _gap = 16; // Gap between images
const _itemSize = _itemWidth + _gap; // Total size of each item including gap

function Item({
  index,
  image,
  offset,
}: {
  index: number;
  image: string;
  offset: SharedValue<number>;
}) {
  const _styles = useAnimatedStyle(() => {
    const itemPosition = index * _itemSize - width - _itemSize / 2;
    const totalSize = images.length * _itemSize;

    const range =
      ((itemPosition - (offset.value + totalSize * 1000)) % totalSize) +
      width +
      _itemSize / 2;
    return {
      transform: [
        {
          rotate: `${interpolate(
            range,
            [-_itemSize, (width - _itemSize) / 2, width],
            [-3, 0, 3]
          )}deg`,
        },
      ],
    };
  });
  return (
    <Animated.View
      style={[
        {
          width: _itemWidth,
          height: _itemHeight,
        },
        _styles,
      ]}
    >
      <Image
        source={{ uri: image }}
        style={{ flex: 1, borderRadius: 16 }}
        resizeMode="cover"
        // Add caching for better performance
      />
    </Animated.View>
  );
}

const WelcomingScreen = () => {
  const offset = useSharedValue(0); // Shared value for offset
  const [activeIndex, setActiveIndex] = useState(0); // State for active index
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Preload images for smoother transitions
  useEffect(() => {
    const preloadImages = async () => {
      try {
        const imagePromises = optimizedImages.map((image) => {
          return Image.prefetch(image);
        });
        await Promise.all(imagePromises);
        setImagesLoaded(true);
      } catch (error) {
        console.error("Error preloading images:", error);
        setImagesLoaded(false);
      }
    };

    preloadImages();
  }, []);

  useAnimatedReaction(
    () => {
      // Smooth out the calculation with a small damping factor
      const floatIndex =
        ((offset.value + width / 2) / _itemSize) % images.length;
      return Math.abs(Math.floor(floatIndex));
    },
    (value, previousValue) => {
      if (previousValue !== value) {
        runOnJS(setActiveIndex)(value); // Update active index
      }
    },
    [imagesLoaded] // Only run when images are loaded
  );

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#000",
      }}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            opacity: 0.5, // Opacity for the background image
          },
        ]}
      >
        <Animated.Image
          key={`image-${activeIndex}`}
          source={{ uri: optimizedImages[activeIndex] }}
          style={{ flex: 1 }}
          blurRadius={50} // Blur effect
          entering={FadeIn.duration(1000)}
          exiting={FadeOut.duration(1000)}
          resizeMode="cover"
        />
      </Animated.View>
      {imagesLoaded && (
        <Marquee
          spacing={_gap} // Space between items
          position={offset} // Position of the marquee
        >
          <Animated.View
            style={{ flexDirection: "row", alignItems: "center", gap: _gap }}
            entering={FadeInUp.delay(500)
              .duration(1000)
              .easing(Easing.elastic(0.9))
              .withInitialValues({
                transform: [{ translateY: -_itemHeight / 2 }],
              })}
          >
            {optimizedImages.map((image, index) => (
              <Item
                offset={offset}
                index={index}
                image={image}
                key={`image-${index}`}
              />
            ))}
          </Animated.View>
        </Marquee>
      )}
      {imagesLoaded && (
        <Stagger
          stagger={100}
          style={{
            flex: 0.5,
            justifyContent: "center",
            alignItems: "center",
            marginTop: 40,
          }}
          duration={500}
          initialEnteringDelay={1000}
        >
          <Text style={{ color: "white", fontWeight: "500", opacity: 0.5 }}>
            Welcome to
          </Text>
          <Text
            style={{
              color: "white",
              fontSize: 36,
              fontWeight: "bold",
              marginBottom: 10,
            }}
          >
            Swapll
          </Text>
          <Text
            style={{
              color: "white",
              opacity: 0.5,
              textAlign: "center",
              paddingHorizontal: 6,
              marginBottom: 10,
            }}
          >
            Discover a new way to exchange skills, services, and items with no
            mandatory reciprocation. Our platform connects people who want to
            share what they have or know, creating a community based on
            generosity and mutual support rather than strict transaction
            requirements.
          </Text>

          <View
            style={{
              flexDirection: "row",
              width: "100%",
              justifyContent: "center",
              gap: 16,
              alignItems: "center",
              marginTop: 20,
            }}
          >
            <Animated.View entering={FadeInUp.delay(1300).duration(800)}>
              <AuthButtons
                backgroundColor="rgba(255, 255, 255, 0.5)"
                title="Create Account"
                navigateTo="Signup"
              />
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(1500).duration(800)}>
              <AuthButtons
                backgroundColor=""
                title="Login"
                navigateTo="Login"
              />
            </Animated.View>
          </View>
        </Stagger>
      )}
    </View>
  );
};

export default WelcomingScreen;
