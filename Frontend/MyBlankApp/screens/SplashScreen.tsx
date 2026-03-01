import React, { useEffect } from "react";
import { View, Image, StyleSheet } from "react-native";

interface Props {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: Props) {

  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/icon.png")}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 120,
    height: 120,
  },
});