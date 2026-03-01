// App.tsx
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// ── Screens ───────────────────────────────────────────────────────────────────
import HomeScreen from "./screens/Home";
import MapScreen  from "./screens/MapScreen";
import ChatScreen from "./screens/Chat";
import ARScreen   from "./screens/AR";

// ─────────────────────────────────────────────────────────────────────────────
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{ headerShown: false, animation: "fade" }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Map"  component={MapScreen}  />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="AR"   component={ARScreen}   />
      </Stack.Navigator>
    </NavigationContainer>
  );
}