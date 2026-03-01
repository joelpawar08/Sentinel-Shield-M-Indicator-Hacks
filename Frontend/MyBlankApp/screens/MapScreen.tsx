// screens/MapScreen.tsx
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import axios from "axios";
import Navbar from "../components/Navbar";

const DANGER_API    = "https://sentinel-shield-m-indicator-hacks.onrender.com/danger-status";
const DANGER_RADIUS = 2000;
const { height: SH } = Dimensions.get("window");

const EMERGENCY_CONTACTS = [
  { id: "1", label: "Ambulance",      number: "102",  icon: "🚑", color: "#FF3B30" },
  { id: "2", label: "Police",         number: "100",  icon: "🚔", color: "#007AFF" },
  { id: "3", label: "Disaster Mgmt",  number: "108",  icon: "🌪️",  color: "#FF9500" },
  { id: "4", label: "Women Helpline", number: "1091", icon: "👩‍⚕️", color: "#AF52DE" },
  { id: "5", label: "Fire Brigade",   number: "101",  icon: "🔥",  color: "#FF6B35" },
  { id: "6", label: "Accident Report",number: "1073", icon: "🚗",  color: "#34C759" },
];

interface Place { id: string; name: string; lat: number; lon: number; }

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000; // meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function MapScreen() {
  const [location,  setLocation]  = useState<{ latitude: number; longitude: number } | null>(null);
  const [danger,    setDanger]    = useState(false);
  const [places,    setPlaces]    = useState<Place[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<"hospitals" | "contacts">("hospitals");

  // Fetch danger status every 3s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(DANGER_API);
        setDanger(res.data.danger_zone);
      } catch { /* silent */ }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Get location + hospitals/shelters once
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const loc    = await Location.getCurrentPositionAsync({});
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setLocation(coords);

      try {
        const query = `[out:json][timeout:25];
(
  node["amenity"="hospital"](around:15000,${coords.latitude},${coords.longitude});
  node["amenity"="shelter"](around:15000,${coords.latitude},${coords.longitude});
  way["amenity"="hospital"](around:15000,${coords.latitude},${coords.longitude});
  way["amenity"="shelter"](around:15000,${coords.latitude},${coords.longitude});
);
out center;`;

        const res = await axios.post("https://overpass-api.de/api/interpreter", query, {
          headers: { "Content-Type": "text/plain" },
        });

        const processed = res.data.elements
          .map((el: any) => {
            const hlat = el.lat || el.center?.lat;
            const hlon = el.lon || el.center?.lon;
            if (!hlat || !hlon) return null;

            const amenity = el.tags?.amenity || "unknown";
            let name = el.tags?.name || "";
            if (!name) {
              name = amenity === "hospital" ? "Nearby Hospital" : "Safe Shelter / Basement";
            }

            return {
              id: el.id.toString(),
              name,
              lat: hlat,
              lon: hlon,
            } as Place;
          })
          .filter(Boolean) as Place[];

        // Sort by real distance to user (nearest first)
        processed.sort((a, b) =>
          getDistance(coords.latitude, coords.longitude, a.lat, a.lon) -
          getDistance(coords.latitude, coords.longitude, b.lat, b.lon)
        );

        setPlaces(processed.slice(0, 5));
      } catch {
        /* silent - places remains empty → map will use generic safe point */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openNavigation = (lat: number, lon: number) =>
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`);

  const callNumber = (number: string) =>
    Linking.openURL(`tel:${number}`);

  if (loading || !location) {
    return (
      <View style={s.loader}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={s.loaderText}>Locating you…</Text>
      </View>
    );
  }

  const leafletHTML = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <style>
    body,html{margin:0;padding:0}
    #map{height:100vh;width:100vw}
    #routeStatus{
      position:absolute;bottom:16px;left:50%;transform:translateX(-50%);
      background:rgba(0,122,255,0.92);color:#fff;
      font-family:sans-serif;font-size:12px;font-weight:700;
      padding:7px 16px;border-radius:20px;z-index:9999;
      display:none;white-space:nowrap;
      box-shadow:0 3px 12px rgba(0,122,255,0.4);
    }
  </style>
</head>
<body>
  <audio id="alarm" loop>
    <source src="https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg">
  </audio>
  <div id="map"></div>
  <div id="routeStatus"></div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var lat    = ${location.latitude};
    var lon    = ${location.longitude};
    var danger = ${danger};
    var RADIUS = ${DANGER_RADIUS};
    var safePlaces = ${JSON.stringify(places)};

    var map = L.map('map').setView([lat, lon], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    var marker = L.marker([lat, lon], { draggable: true }).addTo(map);

    var dangerCircle = null;
    var routeLayer   = null;
    var safeMarker   = null;
    var alarm        = document.getElementById('alarm');
    var statusEl     = document.getElementById('routeStatus');

    // ── Distance helper (meters) ─────────────────────────────────────────────
    function distM(a, b, c, d) {
      var R  = 6371e3;
      var p1 = a * Math.PI / 180, p2 = c * Math.PI / 180;
      var dp = (c - a) * Math.PI / 180, dl = (d - b) * Math.PI / 180;
      var x  = Math.sin(dp/2)*Math.sin(dp/2)+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)*Math.sin(dl/2);
      return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
    }

    // ── Get generic safe exit point (fallback) ───────────────────────────────
    function getSafeExitPoint(userLat, userLon, centerLat, centerLon, radius) {
      var dLat = userLat - centerLat;
      var dLon = userLon - centerLon;
      var len  = Math.sqrt(dLat*dLat + dLon*dLon);

      if (len === 0) { dLat = 1; dLon = 0; len = 1; }

      var nLat = dLat / len;
      var nLon = dLon / len;

      var exitDistDeg = (radius + 300) / 111320;

      return {
        lat: centerLat + nLat * exitDistDeg,
        lon: centerLon + nLon * exitDistDeg * (1 / Math.cos(centerLat * Math.PI / 180))
      };
    }

    // ── NEW: Find nearest hospital or shelter OUTSIDE danger zone ─────────────
    function findNearestSafePlace(userLat, userLon, centerLat, centerLon, radius, places) {
      let nearest = null;
      let minDist = Infinity;

      for (let p of places) {
        const distToUser   = distM(userLat, userLon, p.lat, p.lon);
        const distToCenter = distM(centerLat, centerLon, p.lat, p.lon);

        if (distToCenter > radius + 100 && distToUser < minDist) {
          minDist = distToUser;
          nearest = p;
        }
      }
      return nearest;
    }

    // ── Draw OSRM walking route ───────────────────────────────────────────────
    function drawRoute(fromLat, fromLon, toLat, toLon, placeName = "Safe Zone") {
      if (routeLayer)  { map.removeLayer(routeLayer);  routeLayer  = null; }
      if (safeMarker)  { map.removeLayer(safeMarker);  safeMarker  = null; }

      statusEl.style.display = 'block';
      statusEl.textContent   = '🔄 Calculating evacuation route…';

      var url = 'https://router.project-osrm.org/route/v1/foot/'
        + fromLon + ',' + fromLat + ';'
        + toLon   + ',' + toLat
        + '?overview=full&geometries=geojson';

      fetch(url)
        .then(function(r){ return r.json(); })
        .then(function(data) {
          if (!data.routes || data.routes.length === 0) {
            statusEl.textContent = '⚠️ No route found';
            return;
          }

          var coords = data.routes[0].geometry.coordinates.map(function(c){
            return [c[1], c[0]];
          });

          var distKm = (data.routes[0].distance / 1000).toFixed(1);
          var mins   = Math.ceil(data.routes[0].duration / 60);

          routeLayer = L.polyline(coords, {
            color:     '#007AFF',
            weight:    5,
            opacity:   0.9,
            dashArray: '12, 8',
            lineCap:   'round',
            lineJoin:  'round',
          }).addTo(map);

          var safeIcon = L.divIcon({
            html: '<div style="background:#34C759;color:#fff;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 3px 10px rgba(52,199,89,0.5);border:2px solid #fff;">✓</div>',
            iconSize:   [36, 36],
            iconAnchor: [18, 18],
            className:  '',
          });

          safeMarker = L.marker([toLat, toLon], { icon: safeIcon })
            .bindPopup('<b>🟢 ' + placeName + '</b><br>' + distKm + ' km · ~' + mins + ' min walk')
            .addTo(map)
            .openPopup();

          map.fitBounds(routeLayer.getBounds(), { padding: [40, 40] });

          statusEl.textContent = '🟢 ' + placeName + ': ' + distKm + ' km · ' + mins + ' min walk';
          statusEl.style.background = 'rgba(52,199,89,0.92)';
        })
        .catch(function() {
          statusEl.textContent = '⚠️ Route unavailable';
        });
    }

    // ── Handle danger zone (NEW logic) ───────────────────────────────────────
    function handleDanger(currentLat, currentLon) {
      if (!dangerCircle) {
        dangerCircle = L.circle([lat, lon], {
          radius:      RADIUS,
          color:       'red',
          fillColor:   '#ff0000',
          fillOpacity: 0.15,
          weight:      2,
        }).addTo(map);
      }

      // Find nearest REAL safe place (hospital or shelter) outside danger zone
      var nearestSafe = findNearestSafePlace(currentLat, currentLon, lat, lon, RADIUS, safePlaces);

      var targetLat, targetLon, placeName = "Safe Exit";
      if (nearestSafe) {
        targetLat = nearestSafe.lat;
        targetLon = nearestSafe.lon;
        placeName = nearestSafe.name;
      } else {
        var exit = getSafeExitPoint(currentLat, currentLon, lat, lon, RADIUS);
        targetLat = exit.lat;
        targetLon = exit.lon;
      }

      drawRoute(currentLat, currentLon, targetLat, targetLon, placeName);
      alarm.play();
    }

    function clearDanger() {
      if (dangerCircle) { map.removeLayer(dangerCircle); dangerCircle = null; }
      if (routeLayer)   { map.removeLayer(routeLayer);   routeLayer   = null; }
      if (safeMarker)   { map.removeLayer(safeMarker);   safeMarker   = null; }
      alarm.pause();
      alarm.currentTime = 0;
      statusEl.style.display = 'none';
      statusEl.style.background = 'rgba(0,122,255,0.92)';
    }

    // ── Initial render ───────────────────────────────────────────────────────
    if (danger) {
      handleDanger(lat, lon);
    }

    // ── Marker drag — recalculate route from dragged position ────────────────
    marker.on('dragend', function() {
      var pos = marker.getLatLng();
      if (danger) {
        var inside = distM(lat, lon, pos.lat, pos.lng) < RADIUS;
        if (inside) {
          handleDanger(pos.lat, pos.lng);
        } else {
          clearDanger();
          statusEl.style.display  = 'block';
          statusEl.textContent    = '✅ You are outside the danger zone';
          statusEl.style.background = 'rgba(52,199,89,0.92)';

          if (!dangerCircle) {
            dangerCircle = L.circle([lat, lon], {
              radius:      RADIUS,
              color:       'red',
              fillColor:   '#ff0000',
              fillOpacity: 0.15,
              weight:      2,
            }).addTo(map);
          }
        }
      }
    });

  </script>
</body>
</html>`;

  return (
    <SafeAreaView style={s.root}>

      {/* MAP */}
      <View style={s.mapWrap}>
        <WebView
          source={{ html: leafletHTML }}
          style={StyleSheet.absoluteFill}
          scrollEnabled={false}
        />
        {danger && (
          <View style={s.dangerPill}>
            <Text style={s.dangerPillText}>⚠️ DANGER ZONE ACTIVE</Text>
          </View>
        )}
      </View>

      {/* BOTTOM PANEL */}
      <View style={s.panel}>

        <View style={s.tabBar}>
          <TouchableOpacity
            onPress={() => setActiveTab("hospitals")}
            style={[s.tabBtn, activeTab === "hospitals" && s.tabBtnOn]}
          >
            <Text style={[s.tabTxt, activeTab === "hospitals" && s.tabTxtOn]}>
              🏥  Nearest Hospitals / Shelters
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

        {activeTab === "hospitals" && (
          <ScrollView showsVerticalScrollIndicator={false}>
            {places.length === 0
              ? <Text style={s.empty}>No safe places found nearby</Text>
              : places.map((item, i) => (
                  <View key={item.id} style={s.row}>
                    <View style={s.rowL}>
                      <View style={s.numBadge}>
                        <Text style={s.numText}>{i + 1}</Text>
                      </View>
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

      <Navbar />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#EEF1F8" },

  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#EEF1F8" },
  loaderText: { marginTop: 10, fontSize: 14, color: "#888" },

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

  tabBar: {
    flexDirection: "row",
    backgroundColor: "#F0F2F7",
    borderRadius: 12,
    padding: 3,
    marginBottom: 8,
  },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center" },
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

  row: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: "#F2F4F8",
  },
  rowL:    { flexDirection: "row", alignItems: "center", flex: 1, marginRight: 10, gap: 10 },
  rowMid:  { flex: 1 },
  rowTitle:{ fontSize: 13, fontWeight: "700", color: "#111" },
  rowSub:  { fontSize: 11, color: "#999", marginTop: 1 },

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