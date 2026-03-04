// screens/Chat.tsx
import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import Navbar from "../components/Navbar";

const { width: SW } = Dimensions.get("window");

const API_URL = "https://sentinel-shield-m-indicator-hacks.onrender.com/ai/evacuation-tips";

type Role = "user" | "assistant";

interface Message {
  id: string;
  role: Role;
  text: string;
  imageUri?: string;
  loading?: boolean;
}

async function callBackend(
  userText: string,
  imageUri?: string,
  imageMime?: string
): Promise<string> {
  const formData = new FormData();
  formData.append("prompt", userText || "Analyze this situation and give emergency advice.");

  if (imageUri) {
    formData.append("image", {
      uri:  imageUri,
      name: "photo.jpg",
      type: imageMime || "image/jpeg",
    } as any);
  } else {
    formData.append("image", {
      uri:  "https://via.placeholder.com/10x10.jpg",
      name: "placeholder.jpg",
      type: "image/jpeg",
    } as any);
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { Accept: "application/json" },
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => String(response.status));
    throw new Error(`Server error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  if (data?.ai_evacuation_advice) return data.ai_evacuation_advice;
  if (typeof data === "string") return data;
  if (data?.response) return data.response;
  if (data?.message) return data.message;
  return JSON.stringify(data);
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "0",
      role: "assistant",
      text: "Good morning! I'm your emergency assistant. What's your situation today? Don't be afraid to ask something personal.",
    },
  ]);
  const [input, setInput] = useState("");
  const [pickedImage, setPickedImage] = useState<{ uri: string; mime: string } | null>(null);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      base64: false,
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPickedImage({
        uri: asset.uri,
        mime: asset.mimeType || "image/jpeg",
      });
    }
  }, []);

  const removeImage = () => setPickedImage(null);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text && !pickedImage) return;
    if (sending) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: text || "Image sent for analysis",
      imageUri: pickedImage?.uri,
    };

    const loadingMsg: Message = {
      id: Date.now().toString() + "_load",
      role: "assistant",
      text: "",
      loading: true,
    };

    setMessages((m) => [...m, userMsg, loadingMsg]);
    setInput("");
    setPickedImage(null);
    setSending(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const reply = await callBackend(text, pickedImage?.uri, pickedImage?.mime);
      setMessages((m) => [
        ...m.filter((x) => x.id !== loadingMsg.id),
        { id: Date.now().toString() + "_r", role: "assistant", text: reply },
      ]);
    } catch (err: any) {
      setMessages((m) => [
        ...m.filter((x) => x.id !== loadingMsg.id),
        {
          id: Date.now().toString() + "_err",
          role: "assistant",
          text: `Error: ${err?.message || "Something went wrong. Please try again."}`,
        },
      ]);
    } finally {
      setSending(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }, [input, pickedImage, sending]);

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView
        style={s.kav}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          style={s.chatScroll}
          contentContainerStyle={s.chatContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg) => (
            <View key={msg.id}>
              {msg.role === "assistant" && !msg.loading && (
                <Text style={s.assistantLabel}>DISHA Assistant</Text>
              )}

              <View style={[s.bubbleWrap, msg.role === "user" ? s.bubbleWrapUser : s.bubbleWrapBot]}>
                <View style={[s.bubble, msg.role === "user" ? s.bubbleUser : s.bubbleBot]}>
                  {msg.imageUri && (
                    <Image source={{ uri: msg.imageUri }} style={s.bubbleImage} resizeMode="cover" />
                  )}
                  {msg.loading ? (
                    <View style={s.loadingRow}>
                      <ActivityIndicator size="small" color="#8E8E93" />
                    </View>
                  ) : (
                    <Text style={[s.bubbleText, msg.role === "user" ? s.bubbleTextUser : s.bubbleTextBot]}>
                      {msg.text}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={s.inputArea}>
          {pickedImage && (
            <View style={s.previewStrip}>
              <Image source={{ uri: pickedImage.uri }} style={s.previewThumb} resizeMode="cover" />
              <View style={s.previewMeta}>
                <Text style={s.previewLabel}>Image attached</Text>
              </View>
              <TouchableOpacity style={s.removeBtn} onPress={removeImage}>
                <Text style={s.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={s.inputRow}>
            <TouchableOpacity style={s.attachBtn} onPress={pickImage}>
              <Text style={s.attachIcon}>📎</Text>
            </TouchableOpacity>

            <TextInput
              style={s.textInput}
              value={input}
              onChangeText={setInput}
              placeholder="Type your message..."
              placeholderTextColor="#B0B8C8"
              multiline
              maxLength={1000}
              returnKeyType="default"
            />

            <TouchableOpacity
              style={[s.sendBtn, !input.trim() && !pickedImage && s.sendBtnDisabled]}
              onPress={send}
              disabled={sending || (!input.trim() && !pickedImage)}
            >
              {sending ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.sendIcon}>→</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Navbar />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8F9FB" },
  kav: { flex: 1 },

  chatScroll: { flex: 1 },
  chatContent: { padding: 20, paddingTop: 20, paddingBottom: 20 },

  assistantLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 12,
    marginTop: 24,
    letterSpacing: -0.2,
  },

  bubbleWrap: {
    marginBottom: 16,
  },
  bubbleWrapUser: { alignItems: "flex-end" },
  bubbleWrapBot: { alignItems: "flex-start" },

  bubble: {
    borderRadius: 24,
    padding: 18,
    maxWidth: SW * 0.75,
  },
  bubbleUser: {
    backgroundColor: "#E8EDF5",
  },
  bubbleBot: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleText: {
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  bubbleTextUser: {
    color: "#1C1C1E",
    fontWeight: "500",
  },
  bubbleTextBot: {
    color: "#6C757D",
    fontWeight: "400",
  },
  bubbleImage: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    marginBottom: 12,
  },

  loadingRow: {
    paddingVertical: 8,
  },

  inputArea: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 90,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },

  previewStrip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F7",
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
    gap: 10,
  },
  previewThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  previewMeta: {
    flex: 1,
  },
  previewLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  removeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FF3B3015",
    justifyContent: "center",
    alignItems: "center",
  },
  removeBtnText: {
    fontSize: 13,
    color: "#FF3B30",
    fontWeight: "700",
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F7",
    justifyContent: "center",
    alignItems: "center",
  },
  attachIcon: {
    fontSize: 18,
  },

  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: "#F5F5F7",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: "#1C1C1E",
    fontWeight: "400",
    letterSpacing: -0.2,
  },

  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: {
    backgroundColor: "#D0D8E8",
  },
  sendIcon: {
    fontSize: 20,
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
