// components/Navbar.tsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";

const TABS = [
  { name: "Home", emoji: "🏠", label: "Home" },
  { name: "Map",  emoji: "🗺️",  label: "Map"  },
  { name: "Chat", emoji: "💬", label: "Chat" },
  { name: "AR",   emoji: "📡", label: "AR Nav" },
];

export default function Navbar() {
  const navigation = useNavigation<any>();
  const route      = useRoute();

  return (
    <View style={s.container}>
      {TABS.map((tab) => {
        const focused = route.name === tab.name;
        return (
          <TouchableOpacity
            key={tab.name}
            style={s.tab}
            onPress={() => navigation.navigate(tab.name)}
            activeOpacity={0.7}
          >
            <View style={[s.iconWrap, focused && s.iconWrapActive]}>
              <Text style={s.emoji}>{tab.emoji}</Text>
            </View>
            <Text style={[s.label, focused && s.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#EEF0F5",
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 24 : 10,
    paddingHorizontal: 8,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  iconWrap: {
    width: 44,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  iconWrapActive: {
    backgroundColor: "#007AFF14",
  },
  emoji:  { fontSize: 20 },
  label:  { fontSize: 10, fontWeight: "600", color: "#999" },
  labelActive: { color: "#007AFF", fontWeight: "700" },
});