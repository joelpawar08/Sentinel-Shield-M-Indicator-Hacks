// screens/Home.tsx
import React, { useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions,
  Animated,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Navbar from "../components/Navbar";

const { width: SW } = Dimensions.get("window");

export default function HomeScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const marqueeAnim1 = useRef(new Animated.Value(0)).current;
  const marqueeAnim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Marquee animation for row 1 (right) - Faster
    Animated.loop(
      Animated.sequence([
        Animated.timing(marqueeAnim1, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(marqueeAnim1, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Marquee animation for row 2 (left) - Faster
    Animated.loop(
      Animated.sequence([
        Animated.timing(marqueeAnim2, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(marqueeAnim2, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={s.bgContainer}>
      <SafeAreaView style={s.root}>
        <ScrollView 
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          
          {/* Logo */}
          <Animated.View style={[s.logoContainer, { opacity: fadeAnim }]}>
            <View style={s.logoBox}>
              <Image 
                source={require("../assets/icon.png")} 
                style={s.logoImage}
                resizeMode="contain"
              />
            </View>
          </Animated.View>

          {/* Greeting Text */}
          <Animated.View style={[s.greetingContainer, { opacity: fadeAnim }]}>
            <Text style={s.appTitle}>DISHA</Text>
            <Text style={s.fullForm}>Disaster Intelligence System for Human Assistance</Text>
            <Text style={s.helpText}>Here's what I can help you with:</Text>
          </Animated.View>

          {/* Feature Pills with Marquee Animation */}
          <Animated.View style={[s.pillsContainer, { opacity: fadeAnim }]}>
            {/* Row 1 - Scroll Right */}
            <Animated.View 
              style={[
                s.pillRow,
                {
                  transform: [{
                    translateX: marqueeAnim1.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 10],
                    })
                  }]
                }
              ]}
            >
              <View style={s.pill}>
                <Text style={s.pillText}>AI Evacuations Helper</Text>
              </View>
              
              <View style={s.pill}>
                <Text style={s.pillText}>Safe Route Generator</Text>
              </View>
              
              <View style={s.pill}>
                <Text style={s.pillText}>Live Disaster Location</Text>
              </View>
            </Animated.View>

            {/* Row 2 - Scroll Left */}
            <Animated.View 
              style={[
                s.pillRow,
                {
                  transform: [{
                    translateX: marqueeAnim2.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -10],
                    })
                  }]
                }
              ]}
            >
              <View style={s.pill}>
                <Text style={s.pillText}>AR Navigation</Text>
              </View>
              
              <View style={s.pill}>
                <Text style={s.pillText}>Safe Zone Locator</Text>
              </View>
              
              <View style={s.pill}>
                <Text style={s.pillText}>Call Alerts</Text>
              </View>
            </Animated.View>
          </Animated.View>

          <View style={{ height: 120 }} />
        </ScrollView>

        <Navbar />
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  bgContainer: {
    flex: 1,
    backgroundColor: "#f7f4f3",
  },
  root: { 
    flex: 1, 
    backgroundColor: "transparent",
  },
  scroll: { 
    flex: 1,
  },
  scrollContent: { 
    paddingTop: 40,
    paddingHorizontal: 24,
  },

  // Logo Section
  logoContainer: {
    alignItems: "flex-start",
    marginBottom: 40,
  },
  logoBox: {
    width: 100,
    height: 100,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  logoImage: {
    width: 70,
    height: 70,
  },

  // Greeting Section
  greetingContainer: {
    marginBottom: 32,
  },
  appTitle: {
    fontSize: 56,
    fontWeight: "900",
    color: "#4e5166",
    lineHeight: 64,
    letterSpacing: -1.5,
    marginBottom: 8,
  },
  fullForm: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4e5166",
    lineHeight: 20,
    letterSpacing: -0.2,
    marginBottom: 24,
  },
  helpText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#4e5166",
    lineHeight: 28,
    letterSpacing: -0.4,
  },

  // Pills Section
  pillsContainer: {
    gap: 8,
  },
  pillRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
    flexWrap: "nowrap",
  },
  pill: {
    backgroundColor: "#e7e7e7",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4e5166",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4e5166",
    textAlign: "center",
    letterSpacing: -0.1,
  },
});
