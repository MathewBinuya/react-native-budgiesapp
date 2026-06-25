import { View, Text, Image, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import React from "react";
import COLORS from "../../constants/colors";
import styles from "../../assets/styles/welcome.style";

export default function Welcome() {
  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/welcome-image.png")}
        style={styles.illustration}
        resizeMode="contain"
      />
      <Text style={styles.title}>Budgies</Text>
      <Text style={styles.tagline}>you & me, day by day</Text>

      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("/signup")}
        >
          <Text style={styles.primaryText}>Make a nest</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push("/login")}
        >
          <Text style={styles.secondaryText}>Log in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}