// screens/Home.tsx
import React from "react";
import { View, Text, StyleSheet, SafeAreaView, Image, Dimensions } from "react-native";
import Navbar from "../components/Navbar";

const { width: SW } = Dimensions.get("window");

export default function HomeScreen() {
  return (
    <SafeAreaView style={s.root}>
      <View style={s.center}>

        {/* NDMA Logo from assets */}
        <Image
          source={require("../assets/ndma.jpeg")}
          style={s.logo}
          resizeMode="contain"
        />

        {/* DISHA heading in light navy */}
        <Text style={s.disha}>DISHA</Text>

        {/* Full form */}
        <Text style={s.fullForm}>
          Disaster Intelligence System for Human Assistance
        </Text>

      </View>
      <Navbar />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFFFFF" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
  },
  logo: {
    width: 300,
    height: 300,
  },
  disha: {
    fontSize: 72,
    fontWeight: "900",
    color: "#1A3A6E",
    letterSpacing: 10,
  },
  fullForm: {
    fontSize: 14,
    color: "#000080",
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.2,
    lineHeight: 22,
    maxWidth: SW * 0.75,
  },
});