// screens/MapScreen.tsx
// ⚠️ IMPORTANT: Make sure your navigator (e.g. App.tsx / navigation stack) only
// imports THIS file for the map screen. Delete any other map screen file you have.

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Linking,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import axios from "axios";
import Navbar from "../components/Navbar";

// ─── Constants ────────────────────────────────────────────────────────────────
const DANGER_API    = "http://192.168.0.169:8000/danger";
const DANGER_RADIUS = 5000;
const { height: SH } = Dimensions.get("window");

const EMERGENCY_CONTACTS = [
  { id: "1", label: "Ambulance",       number: "102",  icon: "🚑", color: "#FF3B30" },
  { id: "2", label: "Police",          number: "100",  icon: "🚔", color: "#007AFF" },
  { id: "3", label: "Disaster Mgmt",   number: "108",  icon: "🌪️",  color: "#FF9500" },
  { id: "4", label: "Women Helpline",  number: "1091", icon: "👩‍⚕️", color: "#AF52DE" },
  { id: "5", label: "Fire Brigade",    number: "101",  icon: "🔥",  color: "#FF6B35" },
  { id: "6", label: "Accident Report", number: "1073", icon: "🚗",  color: "#34C759" },
];

interface Place { id: string; name: string; lat: number; lon: number; }

// ─── Component ────────────────────────────────────────────────────────────────
export default function MapScreen() {
  const [location, setLocation]   = useState<{ latitude: number; longitude: number } | null>(null);
  const [danger,   setDanger]     = useState(false);
  const [places,   setPlaces]     = useState<Place[]>([]);
  const [loading,  setLoading]    = useState(true);
  const [activeTab, setActiveTab] = useState<"hospitals" | "contacts">("hospitals");

  // Fetch danger status every 3 s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(DANGER_API);
        setDanger(res.data.danger_zone);
      } catch { /* silent */ }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Get location + hospitals once on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const loc    = await Location.getCurrentPositionAsync({});
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setLocation(coords);

      try {
        const query = `[out:json];node["amenity"="hospital"](around:5000,${coords.latitude},${coords.longitude});out;`;
        const res   = await axios.post("https://overpass-api.de/api/interpreter", query, {
          headers: { "Content-Type": "text/plain" },
        });
        setPlaces(
          res.data.elements.slice(0, 5).map((h: any) => ({
            id:   h.id.toString(),
            name: h.tags?.name || "Hospital",
            lat:  h.lat,
            lon:  h.lon,
          }))
        );
      } catch { /* silent */ }

      setLoading(false);
    })();
  }, []);

  const openNavigation = (lat: number, lon: number) =>
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`);

  const callNumber = (number: string) =>
    Linking.openURL(`tel:${number}`);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading || !location) {
    return (
      <View style={s.loader}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={s.loaderText}>Locating you…</Text>
      </View>
    );
  }

  // ── Leaflet HTML (single WebView, all logic intact) ────────────────────────
  const leafletHTML = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <style>body,html{margin:0;padding:0}#map{height:100vh;width:100vw}</style>
</head>
<body>
  <audio id="alarm" loop>
    <source src="https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg">
  </audio>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var lat=${location.latitude}, lon=${location.longitude}, danger=${danger};
    var map=L.map('map').setView([lat,lon],13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    var marker=L.marker([lat,lon],{draggable:true}).addTo(map);
    if(danger){
      L.circle([lat,lon],{radius:${DANGER_RADIUS},color:'red',fillColor:'#f00',fillOpacity:0.3}).addTo(map);
    }
    var alarm=document.getElementById('alarm');
    function dist(a,b,c,d){
      var R=6371e3,p1=a*Math.PI/180,p2=c*Math.PI/180,
          dp=(c-a)*Math.PI/180,dl=(d-b)*Math.PI/180,
          x=Math.sin(dp/2)*Math.sin(dp/2)+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)*Math.sin(dl/2);
      return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
    }
    marker.on('dragend',function(){
      var p=marker.getLatLng();
      if(danger && dist(lat,lon,p.lat,p.lng)<${DANGER_RADIUS}){alarm.play();}
      else{alarm.pause();alarm.currentTime=0;}
    });
  </script>
</body>
</html>`;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.root}>

      {/* ONE MAP — 58% of screen height, nothing else renders a map */}
      <View style={s.mapWrap}>
        <WebView
          source={{ html: leafletHTML }}
          style={StyleSheet.absoluteFill}
          scrollEnabled={false}
        />
        {danger && (
          <View style={s.dangerPill}>
            <Text style={s.dangerPillText}>⚠️ DANGER ZONE</Text>
          </View>
        )}
      </View>

      {/* BOTTOM PANEL */}
      <View style={s.panel}>

        {/* Tab bar */}
        <View style={s.tabBar}>
          <TouchableOpacity
            onPress={() => setActiveTab("hospitals")}
            style={[s.tabBtn, activeTab === "hospitals" && s.tabBtnOn]}
          >
            <Text style={[s.tabTxt, activeTab === "hospitals" && s.tabTxtOn]}>
              🏥  Nearest Hospitals
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("contacts")}
            style={[s.tabBtn, activeTab === "contacts" && s.tabBtnOn]}
          >
            <Text style={[s.tabTxt, activeTab === "contacts" && s.tabTxtOn]}>
              🆘  Emergency
            </Text>
          </TouchableOpacity>
        </View>

        {/* Hospitals */}
        {activeTab === "hospitals" && (
          <ScrollView showsVerticalScrollIndicator={false}>
            {places.length === 0
              ? <Text style={s.empty}>No hospitals found nearby</Text>
              : places.map((item, i) => (
                  <View key={item.id} style={s.row}>
                    <View style={s.rowL}>
                      <View style={s.numBadge}><Text style={s.numText}>{i + 1}</Text></View>
                      <View style={s.rowMid}>
                        <Text style={s.rowTitle} numberOfLines={1}>{item.name}</Text>
                        <Text style={s.rowSub}>Emergency · Nearby</Text>
                      </View>
                    </View>
                    <TouchableOpacity style={s.btn} onPress={() => openNavigation(item.lat, item.lon)}>
                      <Text style={s.btnTxt}>Navigate</Text>
                    </TouchableOpacity>
                  </View>
                ))
            }
          </ScrollView>
        )}

        {/* Emergency contacts */}
        {activeTab === "contacts" && (
          <ScrollView showsVerticalScrollIndicator={false}>
            {EMERGENCY_CONTACTS.map((c) => (
              <View key={c.id} style={s.row}>
                <View style={s.rowL}>
                  <View style={[s.iconBox, { backgroundColor: c.color + "1A" }]}>
                    <Text style={s.iconEmoji}>{c.icon}</Text>
                  </View>
                  <View style={s.rowMid}>
                    <Text style={s.rowTitle}>{c.label}</Text>
                    <Text style={[s.rowSub, { color: c.color, fontWeight: "700" }]}>{c.number}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[s.btn, { backgroundColor: c.color }]}
                  onPress={() => callNumber(c.number)}
                >
                  <Text style={s.btnTxt}>📞 Call</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

      </View>

      {/* NAVBAR — rendered once, below panel */}
      <Navbar />

    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#EEF1F8",
  },

  loader: {
    flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#EEF1F8",
  },
  loaderText: { marginTop: 10, fontSize: 14, color: "#888" },

  // MAP
  mapWrap: {
    height: SH * 0.58,
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 22,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
  },
  dangerPill: {
    position: "absolute",
    top: 12, left: 12,
    backgroundColor: "#FF3B30",
    borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
    elevation: 6,
  },
  dangerPillText: { color: "#fff", fontSize: 11, fontWeight: "800" },

  // PANEL
  panel: {
    flex: 1,
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 12,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    overflow: "hidden",
  },

  // TABS
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#F0F2F7",
    borderRadius: 12,
    padding: 3,
    marginBottom: 8,
  },
  tabBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center",
  },
  tabBtnOn: {
    backgroundColor: "#fff",
    elevation: 3,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabTxt:   { fontSize: 12, fontWeight: "600", color: "#999" },
  tabTxtOn: { color: "#007AFF", fontWeight: "700" },

  // ROWS
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F4F8",
  },
  rowL: { flexDirection: "row", alignItems: "center", flex: 1, marginRight: 10, gap: 10 },
  rowMid: { flex: 1 },
  rowTitle: { fontSize: 13, fontWeight: "700", color: "#111" },
  rowSub:   { fontSize: 11, color: "#999", marginTop: 1 },

  numBadge: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: "#007AFF",
    justifyContent: "center", alignItems: "center", flexShrink: 0,
  },
  numText: { color: "#fff", fontSize: 12, fontWeight: "800" },

  iconBox: {
    width: 34, height: 34, borderRadius: 10,
    justifyContent: "center", alignItems: "center", flexShrink: 0,
  },
  iconEmoji: { fontSize: 17 },

  btn: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6, flexShrink: 0,
  },
  btnTxt: { color: "#fff", fontSize: 12, fontWeight: "700" },

  empty: { textAlign: "center", color: "#bbb", fontSize: 13, paddingVertical: 20 },
});