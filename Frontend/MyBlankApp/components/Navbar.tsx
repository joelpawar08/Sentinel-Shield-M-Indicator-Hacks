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

// Professional icon set using Unicode symbols
const TABS = [
  { name: "Home", icon: "⌂", label: "Home" },
  { name: "Map",  icon: "⊙", label: "Map"  },
  { name: "Chat", icon: "⋮", label: "Chat" },
  { name: "AR",   icon: "◇", label: "AR" },
];

export default function Navbar() {
  const navigation = useNavigation<any>();
  const route      = useRoute();

  return (
    <View style={s.wrapper}>
      <View style={s.container}>
        {TABS.map((tab, index) => {
          const focused = route.name === tab.name;
          return (
            <TouchableOpacity
              key={tab.name}
              style={s.tab}
              onPress={() => navigation.navigate(tab.name)}
              activeOpacity={0.7}
            >
              <View style={[s.iconWrap, focused && s.iconWrapActive]}>
                <Text style={[s.icon, focused && s.iconActive]}>{tab.icon}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 20 : 16,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 32,
  },
  container: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    paddingVertical: 6,
    paddingHorizontal: 8,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    borderWidth: 0.5,
    borderColor: "rgba(0, 0, 0, 0.06)",
    gap: 4,
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  iconWrapActive: {
    backgroundColor: "#007AFF",
  },
  icon: { 
    fontSize: 19, 
    color: "#8E8E93",
    fontWeight: "400",
  },
  iconActive: { 
    color: "#FFFFFF",
  },
});