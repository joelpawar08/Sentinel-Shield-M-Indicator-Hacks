// screens/MapScreen.tsx
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Linking,
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, Circle, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import * as Location from "expo-location";
import axios from "axios";
import Navbar from "../components/Navbar";

const DANGER_API    = "https://sentinel-shield-m-indicator-hacks.onrender.com/danger-status";
const DANGER_RADIUS = 2000;
const { height: SH } = Dimensions.get("window");

// Dark theme map style (Uber/Ola inspired)
const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8b92ab" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#c5cae9" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b7a99" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#1e3a3a" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4a7c59" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#2c3e50" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1a252f" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#34495e" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2c3a" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#b0bec5" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2c3e50" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#7986cb" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0f1419" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#3d5a80" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#0f1419" }],
  },
];

const EMERGENCY_CONTACTS = [
  { id: "1", label: "Ambulance",      number: "102",  color: "#FF3B30" },
  { id: "2", label: "Police",         number: "100",  color: "#007AFF" },
  { id: "3", label: "Disaster Mgmt",  number: "108",  color: "#FF9500" },
  { id: "4", label: "Women Helpline", number: "1091", color: "#AF52DE" },
  { id: "5", label: "Fire Brigade",   number: "101",  color: "#FF6B35" },
  { id: "6", label: "Accident Report",number: "1073", color: "#34C759" },
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
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [safePlace, setSafePlace] = useState<Place | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const mapRef = useRef<MapView>(null);

  // Fetch danger status every 3s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(DANGER_API);
        const isDanger = res.data.danger_zone;
        setDanger(isDanger);
        
        // If danger activated and we have location, calculate route
        if (isDanger && location && places.length > 0) {
          calculateEvacuationRoute();
        } else if (!isDanger) {
          setRouteCoords([]);
          setSafePlace(null);
        }
      } catch { /* silent */ }
    }, 3000);
    return () => clearInterval(interval);
  }, [location, places]);

  // Get location + hospitals/shelters once + start live tracking
  useEffect(() => {
    let locationSubscription: any;
    
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const loc    = await Location.getCurrentPositionAsync({});
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setLocation(coords);

      // Start live location tracking
      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 10,
        },
        (newLocation) => {
          const newCoords = {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
          };
          setLocation(newCoords);
          
          // Update map camera if navigating
          if (isNavigating && mapRef.current) {
            mapRef.current.animateCamera({
              center: newCoords,
              zoom: 16,
            }, { duration: 1000 });
          }
        }
      );

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

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [isNavigating]);

  const openNavigation = (lat: number, lon: number, name: string) => {
    // Show route on map and enable live navigation
    if (location) {
      setIsNavigating(true);
      fetchRoute(location.latitude, location.longitude, lat, lon);
      setSafePlace({ id: 'selected', name, lat, lon });
      
      // Fit map to show both points
      if (mapRef.current) {
        mapRef.current.fitToCoordinates(
          [location, { latitude: lat, longitude: lon }],
          {
            edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
            animated: true
          }
        );
      }
    }
  };

  const callNumber = (number: string) =>
    Linking.openURL(`tel:${number}`);

  // Find nearest safe place outside danger zone
  const findNearestSafePlace = () => {
    if (!location || places.length === 0) return null;
    
    let nearest = null;
    let minDist = Infinity;

    for (let p of places) {
      const distToUser = getDistance(location.latitude, location.longitude, p.lat, p.lon);
      const distToCenter = getDistance(location.latitude, location.longitude, p.lat, p.lon);
      
      if (distToCenter > DANGER_RADIUS + 100 && distToUser < minDist) {
        minDist = distToUser;
        nearest = p;
      }
    }
    return nearest;
  };

  // Calculate evacuation route using OSRM
  const calculateEvacuationRoute = async () => {
    if (!location) return;

    const nearestSafe = findNearestSafePlace();
    if (!nearestSafe) {
      // Fallback: calculate exit point
      const exitPoint = getSafeExitPoint(location.latitude, location.longitude);
      setSafePlace({ id: 'exit', name: 'Safe Exit Point', lat: exitPoint.lat, lon: exitPoint.lon });
      await fetchRoute(location.latitude, location.longitude, exitPoint.lat, exitPoint.lon);
      return;
    }

    setSafePlace(nearestSafe);
    await fetchRoute(location.latitude, location.longitude, nearestSafe.lat, nearestSafe.lon);
  };

  // Get safe exit point (fallback when no hospitals found)
  const getSafeExitPoint = (userLat: number, userLon: number) => {
    const dLat = userLat - location!.latitude;
    const dLon = userLon - location!.longitude;
    let len = Math.sqrt(dLat * dLat + dLon * dLon);

    if (len === 0) { len = 1; }

    const nLat = dLat / len;
    const nLon = dLon / len;
    const exitDistDeg = (DANGER_RADIUS + 300) / 111320;

    return {
      lat: location!.latitude + nLat * exitDistDeg,
      lon: location!.longitude + nLon * exitDistDeg * (1 / Math.cos(location!.latitude * Math.PI / 180))
    };
  };

  // Fetch route from OSRM
  const fetchRoute = async (fromLat: number, fromLon: number, toLat: number, toLon: number) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/foot/${fromLon},${fromLat};${toLon},${toLat}?overview=full&geometries=geojson`;
      const res = await axios.get(url);
      
      if (res.data.routes && res.data.routes.length > 0) {
        const coords = res.data.routes[0].geometry.coordinates.map((c: number[]) => ({
          latitude: c[1],
          longitude: c[0]
        }));
        setRouteCoords(coords);

        // Fit map to show route
        if (mapRef.current && coords.length > 0) {
          mapRef.current.fitToCoordinates(coords, {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true
          });
        }
      }
    } catch (error) {
      console.log('Route fetch error:', error);
    }
  };

  if (loading || !location) {
    return (
      <View style={s.loader}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={s.loaderText}>Locating you…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.root}>

      {/* MAP */}
      <View style={s.mapWrap}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_DEFAULT}
          style={StyleSheet.absoluteFill}
          customMapStyle={DARK_MAP_STYLE}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation
          showsMyLocationButton
          showsCompass
          showsScale
          loadingEnabled
          loadingIndicatorColor="#007AFF"
          loadingBackgroundColor="#1a1a2e"
        >
          {/* User marker */}
          <Marker
            coordinate={location}
            title="Your Location"
            pinColor="#007AFF"
          />

          {/* Danger zone circle */}
          {danger && (
            <Circle
              center={location}
              radius={DANGER_RADIUS}
              strokeColor="rgba(255, 0, 0, 0.5)"
              fillColor="rgba(255, 0, 0, 0.15)"
              strokeWidth={2}
            />
          )}

          {/* Evacuation route */}
          {routeCoords.length > 0 && (
            <Polyline
              coordinates={routeCoords}
              strokeColor="#007AFF"
              strokeWidth={4}
              lineDashPattern={[12, 8]}
            />
          )}

          {/* Safe place marker */}
          {safePlace && (
            <Marker
              coordinate={{ latitude: safePlace.lat, longitude: safePlace.lon }}
              title={safePlace.name}
              description="Safe evacuation point"
              pinColor="#34C759"
            />
          )}

          {/* Hospital/shelter markers */}
          {places.slice(0, 3).map((place) => (
            <Marker
              key={place.id}
              coordinate={{ latitude: place.lat, longitude: place.lon }}
              title={place.name}
              description="Tap to navigate"
              pinColor="#FF9500"
              onCalloutPress={() => openNavigation(place.lat, place.lon)}
            />
          ))}
        </MapView>

        {danger && (
          <View style={s.dangerPill}>
            <View style={s.dangerDot} />
            <Text style={s.dangerPillText}>DANGER ZONE ACTIVE</Text>
          </View>
        )}

        {safePlace && routeCoords.length > 0 && (
          <View style={s.routeInfo}>
            <View style={s.routeInfoRow}>
              <View style={s.routeInfoIcon}>
                <Text style={s.routeInfoIconText}>→</Text>
              </View>
              <View style={s.routeInfoContent}>
                <Text style={s.routeInfoTitle}>{safePlace.name}</Text>
                <Text style={s.routeInfoSub}>Route calculated</Text>
              </View>
            </View>
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
              Safe Locations
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("contacts")}
            style={[s.tabBtn, activeTab === "contacts" && s.tabBtnOn]}
          >
            <Text style={[s.tabTxt, activeTab === "contacts" && s.tabTxtOn]}>
              Emergency Contacts
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === "hospitals" && (
          <ScrollView showsVerticalScrollIndicator={false}>
            {places.length === 0
              ? <Text style={s.empty}>No safe locations found nearby</Text>
              : places.map((item, i) => (
                  <View key={item.id} style={s.row}>
                    <View style={s.rowL}>
                      <View style={s.numBadge}>
                        <Text style={s.numText}>{i + 1}</Text>
                      </View>
                      <View style={s.rowMid}>
                        <Text style={s.rowTitle} numberOfLines={1}>{item.name}</Text>
                        <Text style={s.rowSub}>
                          {(getDistance(location!.latitude, location!.longitude, item.lat, item.lon) / 1000).toFixed(1)} km away
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={s.btn} 
                      onPress={() => openNavigation(item.lat, item.lon, item.name)}
                    >
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
                  <View style={[s.iconBox, { backgroundColor: c.color + "15" }]}>
                    <View style={[s.iconDot, { backgroundColor: c.color }]} />
                  </View>
                  <View style={s.rowMid}>
                    <Text style={s.rowTitle}>{c.label}</Text>
                    <Text style={[s.rowSub, { color: c.color, fontWeight: "600" }]}>{c.number}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[s.btn, { backgroundColor: c.color }]}
                  onPress={() => callNumber(c.number)}
                >
                  <Text style={s.btnTxt}>Call Now</Text>
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
  root: { flex: 1, backgroundColor: "#F5F5F7" },

  loader: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "#F5F5F7" 
  },
  loaderText: { 
    marginTop: 12, 
    fontSize: 15, 
    color: "#6C757D", 
    fontWeight: "500" 
  },

  mapWrap: {
    height: SH * 0.58,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 28,
    overflow: "hidden",
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    backgroundColor: "#1a1a2e",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
  },
  
  dangerPill: {
    position: "absolute",
    top: 24, 
    left: 24,
    backgroundColor: "#FF3B30",
    borderRadius: 24,
    paddingHorizontal: 20, 
    paddingVertical: 12,
    elevation: 8,
    shadowColor: "#FF3B30",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dangerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  dangerPillText: { 
    color: "#fff", 
    fontSize: 14, 
    fontWeight: "700", 
    letterSpacing: 0.3,
  },

  routeInfo: {
    position: "absolute",
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.04)",
  },
  routeInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  routeInfoIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  routeInfoIconText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  routeInfoContent: {
    flex: 1,
  },
  routeInfoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 3,
    letterSpacing: -0.3,
  },
  routeInfoSub: {
    fontSize: 13,
    color: "#8E8E93",
    fontWeight: "500",
  },

  panel: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 90,
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.04)",
  },

  tabBar: {
    flexDirection: "row",
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: { 
    flex: 1, 
    paddingVertical: 12, 
    borderRadius: 13, 
    alignItems: "center",
    justifyContent: "center",
  },
  tabBtnOn: {
    backgroundColor: "#FFFFFF",
    elevation: 3,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  tabTxt: { 
    fontSize: 14, 
    fontWeight: "600", 
    color: "#8E8E93",
    letterSpacing: -0.2,
  },
  tabTxtOn: { 
    color: "#007AFF", 
    fontWeight: "700",
    letterSpacing: -0.2,
  },

  row: {
    flexDirection: "row", 
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1, 
    borderBottomColor: "#F5F5F7",
  },
  rowL: { 
    flexDirection: "row", 
    alignItems: "center", 
    flex: 1, 
    marginRight: 14, 
    gap: 14,
  },
  rowMid: { flex: 1 },
  rowTitle: { 
    fontSize: 14, 
    fontWeight: "600", 
    color: "#1C1C1E",
    marginBottom: 3,
    letterSpacing: -0.3,
  },
  rowSub: { 
    fontSize: 12, 
    color: "#8E8E93", 
    fontWeight: "500",
    letterSpacing: -0.1,
  },

  numBadge: {
    width: 36, 
    height: 36, 
    borderRadius: 12,
    backgroundColor: "#007AFF",
    justifyContent: "center", 
    alignItems: "center", 
    flexShrink: 0,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  numText: { 
    color: "#FFFFFF", 
    fontSize: 14, 
    fontWeight: "700",
    letterSpacing: -0.2,
  },

  iconBox: {
    width: 44, 
    height: 44, 
    borderRadius: 14,
    justifyContent: "center", 
    alignItems: "center", 
    flexShrink: 0,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
  },
  iconDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },

  btn: {
    backgroundColor: "#007AFF",
    borderRadius: 14,
    paddingHorizontal: 18, 
    paddingVertical: 11, 
    flexShrink: 0,
    elevation: 3,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  btnTxt: { 
    color: "#FFFFFF", 
    fontSize: 14, 
    fontWeight: "700",
    letterSpacing: -0.1,
  },

  empty: { 
    textAlign: "center", 
    color: "#8E8E93", 
    fontSize: 15, 
    paddingVertical: 40, 
    fontWeight: "500",
    letterSpacing: -0.2,
  },
});

//done with Map Screens - Joel Pawar (AI Engineer )