import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ErrorBanner } from "../components/ErrorBanner";
import { useTheme } from "../context/ThemeContext";

export default function TextEntryScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!text.trim()) {
      setError("Please enter at least one ingredient.");
      return;
    }
    setError(null);
    try {
      setLoading(true);
      const endpoint = "https://carciscan.edwardgarcia.site/api/v2/text";
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 60_000);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: text }),
        signal: controller.signal,
      });
      clearTimeout(id);
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || `Server error (${res.status})`);
        router.push({
          pathname: "/results",
          params: { apiResult: JSON.stringify(json), resultText: JSON.stringify(json, null, 2) },
        });
      } else {
        const raw = await res.text();
        if (!res.ok) throw new Error(raw || `Server error (${res.status})`);
        router.push({ pathname: "/results", params: { resultText: raw } });
      }
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[s.root, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />

      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.text }]}>Enter ingredients</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[s.label, { color: colors.textSecondary }]}>
            Paste or type an ingredient list, separated by commas.
          </Text>

          <View style={[s.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[s.input, { color: colors.text }]}
              placeholder="e.g. Sugar, Palm Oil, Red 40, Sodium Nitrite…"
              placeholderTextColor={colors.textTertiary}
              value={text}
              onChangeText={(v) => { setText(v); if (error) setError(null); }}
              multiline
              textAlignVertical="top"
              autoFocus
            />
          </View>

          {text.length > 0 && (
            <TouchableOpacity onPress={() => setText("")} style={s.clearRow}>
              <Text style={[s.clearText, { color: colors.textTertiary }]}>Clear</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Bottom */}
        <View style={[s.bottom, { paddingBottom: insets.bottom + 12, borderTopColor: colors.border, backgroundColor: colors.bg }]}>
          {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
          <TouchableOpacity
            onPress={submit}
            disabled={loading}
            style={[s.submitBtn, { backgroundColor: colors.accent }, loading && { opacity: 0.6 }]}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.submitText}>Analyze</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 16, fontWeight: "600" },
  scroll: { padding: 20, flexGrow: 1 },
  label: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  inputBox: { borderWidth: 1, borderRadius: 12, overflow: "hidden" },
  input: { fontSize: 15, lineHeight: 22, padding: 16, minHeight: 200 },
  clearRow: { alignSelf: "flex-end", marginTop: 8 },
  clearText: { fontSize: 13, fontWeight: "500" },
  bottom: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  submitBtn: {
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
