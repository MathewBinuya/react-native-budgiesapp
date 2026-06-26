import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions
} from "react-native";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import styles from "../../assets/styles/slides.style";

const { width } = Dimensions.get("window");


const SLIDES = [
  {
    key: "1",
    image: require("../../assets/images/onBoarding-image-1.png"),
    title: "Raise a budgie together",
    body: "Feed and play with your shared pet each day. Care for it together and watch it grow.",
  },
  {
    key: "2",
    image: require("../../assets/images/onBoarding-image-2.png"),
    title: "Write to each other",
    body: "Keep a shared journal of little notes, answered prompts, and moments worth remembering.",
  },
  {
    key: "3",
    image: require("../../assets/images/onBoarding-image-3.png"),
    title: "Keep your streak alive",
    body: "Check in every day as a pair. Build a streak and a picture book of your story.",
  },
];

export default function Slides() {
  const listRef = useRef(null);
  const [index, setIndex] = useState(0);
  const { completeOnboarding } = useAuthStore();

  

  const isLast = index === SLIDES.length - 1;

  const finish = async () => {
    await completeOnboarding(); // mark seen so the slides never show again
    router.replace("/(auth)/welcome");
  };

  const handleNext = () => {
    if (isLast) {
      finish();
    } else {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    }
  };

  const onScroll = (e) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };

  return (
    <View style={styles.container}>
      {/* Skip */}
      <TouchableOpacity style={styles.skip} onPress={finish}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        renderItem={({ item }) => (
        <View style={[styles.slide, { width }]}>
          <Image source={item.image} style={styles.image} resizeMode="contain" />
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.body}>{item.body}</Text>
        </View>
      )}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === index && styles.dotActive]}
          />
        ))}
      </View>

      {/* Next / Get started */}
      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>
          {isLast ? "Get started" : "Next"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

