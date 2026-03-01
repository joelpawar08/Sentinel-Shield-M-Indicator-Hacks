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
  SafeAreaView,
  Dimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import Navbar from "../components/Navbar";

const { width: SW } = Dimensions.get("window");

// ── Types ──────────────────────────────────────────────────────────────────────
type Role = "user" | "assistant";

interface Message {
  id: string;
  role: Role;
  text: string;
  imageUri?: string;       // local URI shown in bubble
  imageBase64?: string;    // base64 sent to API
  imageMime?: string;
  loading?: boolean;
}

// ── Anthropic call ─────────────────────────────────────────────────────────────
async function callClaude(
  history: Message[],
  userText: string,
  imageBase64?: string,
  imageMime?: string
): Promise<string> {
  // Build messages array for API
  const apiMessages = history
    .filter((m) => !m.loading)
    .map((m) => {
      if (m.role === "user" && m.imageBase64) {
        return {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: m.imageMime || "image/jpeg",
                data: m.imageBase64,
              },
            },
            { type: "text", text: m.text || " " },
          ],
        };
      }
      return { role: m.role, content: m.text };
    });

  // Add current user message
  const userContent: any[] = [];
  if (imageBase64) {
    userContent.push({
      type: "image",
      source: {
        type: "base64",
        media_type: imageMime || "image/jpeg",
        data: imageBase64,
      },
    });
  }
  userContent.push({ type: "text", text: userText || " " });

  apiMessages.push({ role: "user", content: userContent });

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system:
        "You are a helpful emergency and disaster management AI assistant. Help users with medical information, navigation, safety tips, and emergency guidance. Be concise, clear, and empathetic.",
      messages: apiMessages,
    }),
  });

  const data = await response.json();
  if (data?.content?.[0]?.text) return data.content[0].text;
  throw new Error("No response from Claude");
}

// ─────────────────────────────────────────────────────────────────────────────
export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "0",
      role: "assistant",
      text: "Hi! I'm your emergency assistant. You can ask me anything — send text or attach an image for analysis. 🚨",
    },
  ]);
  const [input, setInput]           = useState("");
  const [pickedImage, setPickedImage] = useState<{
    uri: string; base64: string; mime: string;
  } | null>(null);
  const [sending, setSending]       = useState(false);
  const scrollRef                   = useRef<ScrollView>(null);

  // ── Pick image ───────────────────────────────────────────────────────────────
  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const mime  = asset.mimeType || "image/jpeg";
      setPickedImage({
        uri:    asset.uri,
        base64: asset.base64 || "",
        mime,
      });
    }
  }, []);

  const removeImage = () => setPickedImage(null);

  // ── Send ─────────────────────────────────────────────────────────────────────
  const send = useCallback(async () => {
    const text = input.trim();
    if (!text && !pickedImage) return;
    if (sending) return;

    const userMsg: Message = {
      id:          Date.now().toString(),
      role:        "user",
      text,
      imageUri:    pickedImage?.uri,
      imageBase64: pickedImage?.base64,
      imageMime:   pickedImage?.mime,
    };

    const loadingMsg: Message = {
      id:      Date.now().toString() + "_load",
      role:    "assistant",
      text:    "",
      loading: true,
    };

    const prev = [...messages];
    setMessages((m) => [...m, userMsg, loadingMsg]);
    setInput("");
    setPickedImage(null);
    setSending(true);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const reply = await callClaude(prev, text, pickedImage?.base64, pickedImage?.mime);
      setMessages((m) => [
        ...m.filter((x) => x.id !== loadingMsg.id),
        { id: Date.now().toString() + "_r", role: "assistant", text: reply },
      ]);
    } catch {
      setMessages((m) => [
        ...m.filter((x) => x.id !== loadingMsg.id),
        { id: Date.now().toString() + "_err", role: "assistant", text: "⚠️ Something went wrong. Please try again." },
      ]);
    } finally {
      setSending(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }, [input, pickedImage, messages, sending]);

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView
        style={s.kav}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >

        {/* ── HEADER ── */}
        <View style={s.header}>
          <View style={s.headerDot} />
          <Text style={s.headerTitle}>Emergency Assistant</Text>
          <View style={s.onlinePill}>
            <View style={s.onlineDot} />
            <Text style={s.onlineText}>Online</Text>
          </View>
        </View>

        {/* ── CHAT AREA ── */}
        <ScrollView
          ref={scrollRef}
          style={s.chatScroll}
          contentContainerStyle={s.chatContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                s.bubbleWrap,
                msg.role === "user" ? s.bubbleWrapUser : s.bubbleWrapBot,
              ]}
            >
              {/* Avatar */}
              {msg.role === "assistant" && (
                <View style={s.avatar}>
                  <Text style={s.avatarEmoji}>🤖</Text>
                </View>
              )}

              <View
                style={[
                  s.bubble,
                  msg.role === "user" ? s.bubbleUser : s.bubbleBot,
                ]}
              >
                {/* Image preview inside bubble */}
                {msg.imageUri && (
                  <Image source={{ uri: msg.imageUri }} style={s.bubbleImage} resizeMode="cover" />
                )}

                {/* Loading dots */}
                {msg.loading ? (
                  <View style={s.loadingRow}>
                    <ActivityIndicator size="small" color="#007AFF" />
                    <Text style={s.loadingText}>Thinking…</Text>
                  </View>
                ) : (
                  <Text
                    style={[
                      s.bubbleText,
                      msg.role === "user" ? s.bubbleTextUser : s.bubbleTextBot,
                    ]}
                  >
                    {msg.text}
                  </Text>
                )}
              </View>

              {/* User avatar */}
              {msg.role === "user" && (
                <View style={[s.avatar, s.avatarUser]}>
                  <Text style={s.avatarEmoji}>👤</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        {/* ── INPUT AREA ── */}
        <View style={s.inputArea}>

          {/* Image preview strip */}
          {pickedImage && (
            <View style={s.previewStrip}>
              <Image source={{ uri: pickedImage.uri }} style={s.previewThumb} resizeMode="cover" />
              <View style={s.previewMeta}>
                <Text style={s.previewLabel}>Image attached</Text>
                <Text style={s.previewSub}>Ready to send</Text>
              </View>
              <TouchableOpacity style={s.removeBtn} onPress={removeImage}>
                <Text style={s.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={s.inputRow}>
            {/* Attach image button */}
            <TouchableOpacity style={s.attachBtn} onPress={pickImage}>
              <Text style={s.attachBtnText}>📎</Text>
            </TouchableOpacity>

            {/* Text input */}
            <TextInput
              style={s.textInput}
              value={input}
              onChangeText={setInput}
              placeholder="Ask anything…"
              placeholderTextColor="#B0B8C8"
              multiline
              maxLength={1000}
              returnKeyType="default"
            />

            {/* Send button */}
            <TouchableOpacity
              style={[
                s.sendBtn,
                (!input.trim() && !pickedImage) && s.sendBtnDisabled,
              ]}
              onPress={send}
              disabled={sending || (!input.trim() && !pickedImage)}
            >
              {sending
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={s.sendBtnText}>➤</Text>
              }
            </TouchableOpacity>
          </View>
        </View>

      </KeyboardAvoidingView>

      {/* ── NAVBAR ── */}
      <Navbar />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F0F3FA" },
  kav:  { flex: 1 },

  // HEADER
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF0F5",
    gap: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  headerDot: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: "#007AFF",
    justifyContent: "center", alignItems: "center",
  },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: "800", color: "#111", letterSpacing: -0.3 },
  onlinePill: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#EDFDF4", borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4, gap: 5,
  },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#34C759" },
  onlineText: { fontSize: 11, fontWeight: "700", color: "#34C759" },

  // CHAT SCROLL
  chatScroll: { flex: 1 },
  chatContent: { padding: 14, gap: 10, paddingBottom: 6 },

  // BUBBLES
  bubbleWrap: { flexDirection: "row", alignItems: "flex-end", gap: 8, maxWidth: SW * 0.85 },
  bubbleWrapUser: { alignSelf: "flex-end", flexDirection: "row-reverse" },
  bubbleWrapBot:  { alignSelf: "flex-start" },

  avatar: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: "#EEF2FF",
    justifyContent: "center", alignItems: "center",
    flexShrink: 0,
  },
  avatarUser: { backgroundColor: "#007AFF1A" },
  avatarEmoji: { fontSize: 16 },

  bubble: {
    borderRadius: 18, padding: 12,
    maxWidth: SW * 0.7,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  bubbleUser: {
    backgroundColor: "#007AFF",
    borderBottomRightRadius: 4,
  },
  bubbleBot: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 14, lineHeight: 21 },
  bubbleTextUser: { color: "#fff" },
  bubbleTextBot:  { color: "#111" },

  bubbleImage: {
    width: "100%", height: 160,
    borderRadius: 10, marginBottom: 8,
  },

  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 2 },
  loadingText: { fontSize: 13, color: "#007AFF", fontWeight: "600" },

  // INPUT AREA
  inputArea: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEF0F5",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    marginHorizontal: 10,
    marginBottom: 8,
    borderRadius: 20,
  },

  // Image preview strip
  previewStrip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F6FF",
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: "#D0E4FF",
  },
  previewThumb: { width: 44, height: 44, borderRadius: 8 },
  previewMeta: { flex: 1 },
  previewLabel: { fontSize: 12, fontWeight: "700", color: "#007AFF" },
  previewSub:   { fontSize: 10, color: "#888", marginTop: 1 },
  removeBtn: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: "#FF3B3020",
    justifyContent: "center", alignItems: "center",
  },
  removeBtnText: { fontSize: 11, color: "#FF3B30", fontWeight: "800" },

  // Input row
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  attachBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "#F0F3FA",
    justifyContent: "center", alignItems: "center",
    flexShrink: 0,
  },
  attachBtnText: { fontSize: 18 },

  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: "#F4F6FB",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111",
    fontWeight: "500",
  },

  sendBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "#007AFF",
    justifyContent: "center", alignItems: "center",
    flexShrink: 0,
    elevation: 3,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  sendBtnDisabled: { backgroundColor: "#C8D6E8", elevation: 0, shadowOpacity: 0 },
  sendBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});