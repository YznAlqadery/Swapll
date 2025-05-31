import { View, Image, Dimensions, Text } from "react-native";
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
import AuthButtons from "./AuthButton";

const THEME = {
  background: "#F0F7F7",
  primary: "#008B8B",
  secondary: "#66B2B2",
};
const images = [
  "https://thumbs.dreamstime.com/b/horizontal-banner-smiling-young-men-women-volunteering-doing-volunteer-work-drawn-green-contour-lines-white-117142814.jpg",
  "https://previews.123rf.com/images/bsd555/bsd5552102/bsd555210204218/164573412-lively-discussion-rgb-color-icon-debate-disputation-work-conversation-reaching-decisions-process.jpg",
  "https://res.cloudinary.com/people-matters/image/upload/q_auto,f_auto/v1696823865/1696823864.jpg",
  "https://img.freepik.com/premium-vector/flat-cartoon-people-talking-discussion-group-vector_101884-187.jpg",
  "https://img.freepik.com/premium-vector/students-group_7388-165.jpg",
  "https://thumbs.dreamstime.com/b/community-work-day-flat-vector-illustration-volunteers-activists-isolated-cartoon-characters-white-background-young-people-179500663.jpg",
  "https://img.freepik.com/premium-vector/group-friends-study-together-using-shared-aibased-study-guide-which-adapts-each_216520-76551.jpg",
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

  const descriptions = [
    "Discover a new way to exchange skills, services, and items with no mandatory reciprocation.",
    "Join meaningful conversations and connect with like-minded individuals in your community.",
    "Build lasting relationships through sharing what you know and learning from others.",
    "Exchange ideas and collaborate on projects with people from diverse backgrounds.",
    "Form study groups and share knowledge to help each other grow and learn.",
    "Volunteer your time and skills to make a positive impact in your community.",
    "Use modern tools to find the perfect match for your skills and interests.",
  ];

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
        backgroundColor: THEME.background,
      }}
    >
      {imagesLoaded && (
        <Marquee spacing={_gap} position={offset}>
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
            marginTop: 60,
          }}
          duration={500}
          initialEnteringDelay={1000}
        >
          <Text
            style={{
              color: THEME.secondary,
              fontFamily: "Poppins_500Medium",
            }}
          >
            Welcome to
          </Text>
          <Text
            style={{
              color: THEME.primary,
              fontSize: 44,
              fontWeight: "bold",
              marginBottom: 10,
              fontFamily: "Poppins_700Bold",
            }}
          >
            Swapll
          </Text>
          <Animated.Text
            key={`description-${activeIndex}`}
            entering={FadeIn.duration(500)}
            exiting={FadeOut.duration(300)}
            style={{
              color: THEME.secondary,
              textAlign: "center",
              paddingHorizontal: 20,
              marginBottom: 10,
              fontFamily: "Poppins_400Regular",
              height: 80,
            }}
          >
            {descriptions[activeIndex]}
          </Animated.Text>

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
                backgroundColor={THEME.primary}
                title="Create Account"
                navigateTo="Signup"
              />
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(1500).duration(800)}>
              <AuthButtons
                backgroundColor="rgba(0, 139, 139, 0.6)"
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
