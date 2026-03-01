// screens/AR.tsx
import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  SafeAreaView,
  Animated,
  Dimensions,
  ScrollView,
} from "react-native";
import Navbar from "../components/Navbar";

const { width: SW, height: SH } = Dimensions.get("window");

const STEPS = [
  {
    number: "01",
    icon: "📷",
    title: "Enable Camera Access",
    desc: "When prompted, tap Allow to grant camera permission. AR Navigation needs your camera to overlay directions onto the real world.",
    tip: "Go to Settings → App → Camera if you denied it.",
  },
  {
    number: "02",
    icon: "📡",
    title: "Launch AR Navigation",
    desc: "Tap the AR Nav button below. This opens AR Maps in Live View mode — point your camera at the street and waypoints will appear.",
    tip: "Make sure you're outdoors with a clear sky for best GPS accuracy.",
  },
  {
    number: "03",
    icon: "🧭",
    title: "Follow the Waypoints",
    desc: "Walk in the direction of the floating arrows on your camera view. Markers show turns, distances, and your destination in real time.",
    tip: "Hold your phone upright and steady while walking.",
  },
];

export default function ARScreen() {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();

    // Button pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const openAR = () => Linking.openURL("https://mindi26.netlify.app/");

  return (
    <SafeAreaView style={s.root}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO ── */}
        <Animated.View style={[s.hero, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={s.heroBadge}>
            <Text style={s.heroBadgeText}>BETA</Text>
          </View>
          <Text style={s.heroIcon}>📡</Text>
          <Text style={s.heroTitle}>AR Navigation</Text>
          <Text style={s.heroSub}>
            See live directions overlaid on the real world through your camera.
            Follow the steps below to get started.
          </Text>
        </Animated.View>

        {/* ── STEPS ── */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {STEPS.map((step, index) => (
            <View key={step.number} style={s.stepCard}>
              {/* Step connector line */}
              {index < STEPS.length - 1 && <View style={s.connector} />}

              {/* Number + Icon */}
              <View style={s.stepLeft}>
                <View style={s.stepBadge}>
                  <Text style={s.stepNumber}>{step.number}</Text>
                </View>
                <Text style={s.stepIcon}>{step.icon}</Text>
              </View>

              {/* Content */}
              <View style={s.stepBody}>
                <Text style={s.stepTitle}>{step.title}</Text>
                <Text style={s.stepDesc}>{step.desc}</Text>

                {/* Tip pill */}
                <View style={s.tipPill}>
                  <Text style={s.tipIcon}>💡</Text>
                  <Text style={s.tipText}>{step.tip}</Text>
                </View>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* ── LAUNCH BUTTON ── */}
        <Animated.View style={[s.btnWrap, { transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity style={s.arBtn} onPress={openAR} activeOpacity={0.85}>
            <View style={s.arBtnInner}>
              <Text style={s.arBtnIcon}>🗺️</Text>
              <View>
                <Text style={s.arBtnLabel}>AR Nav</Text>
                <Text style={s.arBtnSub}>Opens Google Maps Live View</Text>
              </View>
              <Text style={s.arBtnArrow}>→</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* ── NOTE ── */}
        <Text style={s.note}>
          AR Navigation uses Google Maps Live View. Requires internet connection and GPS.
        </Text>

        {/* Bottom spacing for navbar */}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ── NAVBAR pinned to bottom ── */}
      <Navbar />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: "#0B0F1E" },
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 10 },

  // ── HERO ──────────────────────────────────────────────────────────────────
  hero: {
    alignItems: "center",
    marginBottom: 32,
    paddingTop: 10,
  },
  heroBadge: {
    backgroundColor: "#007AFF22",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#007AFF55",
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 18,
  },
  heroBadgeText: {
    color: "#007AFF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
  },
  heroIcon: {
    fontSize: 52,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.8,
    marginBottom: 10,
  },
  heroSub: {
    fontSize: 14,
    color: "#8892AA",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: SW * 0.82,
  },

  // ── STEPS ─────────────────────────────────────────────────────────────────
  stepCard: {
    flexDirection: "row",
    marginBottom: 20,
    position: "relative",
  },
  connector: {
    position: "absolute",
    left: 19,
    top: 70,
    width: 2,
    height: "78%",
    backgroundColor: "#1E2847",
    zIndex: 0,
  },

  stepLeft: {
    alignItems: "center",
    marginRight: 16,
    gap: 6,
    zIndex: 1,
  },
  stepBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  stepNumber: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  stepIcon: {
    fontSize: 20,
  },

  stepBody: {
    flex: 1,
    backgroundColor: "#111827",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1E2847",
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 7,
    letterSpacing: -0.2,
  },
  stepDesc: {
    fontSize: 13,
    color: "#8892AA",
    lineHeight: 20,
    marginBottom: 10,
  },
  tipPill: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#1C2A45",
    borderRadius: 10,
    padding: 10,
    gap: 7,
    borderLeftWidth: 3,
    borderLeftColor: "#007AFF",
  },
  tipIcon: { fontSize: 13, marginTop: 1 },
  tipText: {
    fontSize: 11,
    color: "#6A7899",
    lineHeight: 16,
    flex: 1,
    fontWeight: "500",
  },

  // ── BUTTON ────────────────────────────────────────────────────────────────
  btnWrap: {
    marginTop: 8,
    marginBottom: 14,
  },
  arBtn: {
    backgroundColor: "#007AFF",
    borderRadius: 20,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
  },
  arBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 22,
    gap: 14,
  },
  arBtnIcon:  { fontSize: 28 },
  arBtnLabel: { fontSize: 18, fontWeight: "900", color: "#fff", letterSpacing: -0.3 },
  arBtnSub:   { fontSize: 11, color: "#ffffff99", marginTop: 2, fontWeight: "500" },
  arBtnArrow: { marginLeft: "auto", fontSize: 20, color: "#ffffffCC", fontWeight: "700" },

  // ── NOTE ──────────────────────────────────────────────────────────────────
  note: {
    textAlign: "center",
    color: "#3A4460",
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "500",
  },
});