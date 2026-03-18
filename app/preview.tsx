import { Ionicons } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Image, Modal, PanResponder,
  Platform, SafeAreaView, StatusBar, StyleSheet, Text,
  TouchableOpacity, View, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ErrorBanner } from "../components/ErrorBanner";
import { useTheme } from "../context/ThemeContext";

export default function PreviewScreen() {
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [uploading, setUploading] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(uri ? String(uri) : null);
  const [showCrop, setShowCrop] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (uri) setImageUri(String(uri));
  }, [uri]);

  const upload = async () => {
    if (!imageUri) return;
    setError(null);
    try {
      setUploading(true);
      const rawEnv = process.env.EXPO_PUBLIC_API_URL || "https://carciscan.edwardgarcia.site/";
      const endpoint = normUrl(rawEnv);
      const form = new FormData();
      form.append("file", { uri: imageUri, name: "scan.jpg", type: "image/jpeg" } as any);
      const res = await fetchTimeout(endpoint, { method: "POST", headers: { Accept: "application/json" }, body: form }, 60_000);
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || "Upload failed");
        router.replace({ pathname: "/results", params: { apiResult: JSON.stringify(json), resultText: JSON.stringify(json, null, 2) } });
      } else {
        const text = await res.text();
        if (!res.ok) throw new Error(text || "Upload failed");
        router.replace({ pathname: "/results", params: { resultText: text } });
      }
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") { setError("Photo library permission is required to pick an image."); return; }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, exif: true, quality: 0.8, allowsEditing: false,
      });
      if (!result.canceled && result.assets[0]) {
        let u = result.assets[0].uri;
        if (result.assets[0].exif?.Orientation) {
          const m = await ImageManipulator.manipulateAsync(u, [{ rotate: 0 }], { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG });
          u = m.uri;
        }
        setImageUri(u);
      }
    } catch { setError("Failed to pick image. Try again."); }
  };

  return (
    <View style={[s.root, { backgroundColor: colors.bg, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />

      {/* Header */}
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.text }]}>Preview</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Image */}
      <View style={s.imageArea}>
        {imageUri ? (
          <View style={[s.frame, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Image source={{ uri: imageUri }} style={s.img} resizeMode="contain" />
          </View>
        ) : (
          <View style={[s.empty, { borderColor: colors.border }]}>
            <Ionicons name="image-outline" size={40} color={colors.textTertiary} />
            <Text style={[s.emptyText, { color: colors.textTertiary }]}>No image</Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={[s.actionsWrapper, { borderTopColor: colors.border }]}>
        {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
        <View style={s.actions}>
          <TouchableOpacity onPress={() => router.back()} style={[s.actionBtn, { borderColor: colors.border }]}>
            <Text style={[s.actionText, { color: colors.text }]}>Retake</Text>
          </TouchableOpacity>
          {imageUri && (
            <TouchableOpacity onPress={() => setShowCrop(true)} style={[s.actionBtn, { borderColor: colors.border }]}>
              <Text style={[s.actionText, { color: colors.text }]}>Crop</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={upload}
            disabled={uploading}
            style={[s.primaryBtn, { backgroundColor: colors.accent }, uploading && { opacity: 0.6 }]}
          >
            {uploading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryText}>Analyze</Text>}
          </TouchableOpacity>
        </View>
      </View>

      {showCrop && imageUri && (
        <CropModal
          uri={imageUri}
          onApply={(u) => { setImageUri(u); setShowCrop(false); }}
          onCancel={() => setShowCrop(false)}
        />
      )}
    </View>
  );
}

/* ── Crop Modal ─────────────────────────────────────────── */
function CropModal({ uri, onApply, onCancel }: { uri: string; onApply: (u: string) => void; onCancel: () => void }) {
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef({ width: 0, height: 0 });
  const naturalRef = useRef({ width: 0, height: 0 });
  const cropRef = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const init = useRef(false);
  const [ready, setReady] = useState<string | null>(null);

  useEffect(() => {
    ImageManipulator.manipulateAsync(uri, [{ rotate: 0 }], { compress: 1, format: ImageManipulator.SaveFormat.JPEG })
      .then((r) => { setReady(r.uri); naturalRef.current = { width: r.width, height: r.height }; setNaturalSize({ width: r.width, height: r.height }); })
      .catch(() => { setReady(uri); Image.getSize(uri, (w, h) => { naturalRef.current = { width: w, height: h }; setNaturalSize({ width: w, height: h }); }); });
  }, [uri]);

  useEffect(() => {
    if (!containerSize.width || !naturalSize.width || init.current) return;
    const sc = Math.min(containerSize.width / naturalSize.width, containerSize.height / naturalSize.height);
    const dw = naturalSize.width * sc, dh = naturalSize.height * sc;
    const ox = (containerSize.width - dw) / 2, oy = (containerSize.height - dh) / 2;
    const f = 0.7;
    const b = { x: ox + (dw * (1 - f)) / 2, y: oy + (dh * (1 - f)) / 2, w: dw * f, h: dh * f };
    cropRef.current = b; setCrop(b); init.current = true;
  }, [containerSize, naturalSize]);

  const mkCorner = (corner: "tl" | "tr" | "bl" | "br") => {
    const st = { x: 0, y: 0, w: 0, h: 0 };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => Object.assign(st, cropRef.current),
      onPanResponderMove: (_, { dx, dy }) => {
        const MIN = 60; const b = { ...st };
        if (corner === "tl") { if (b.w - dx >= MIN && b.h - dy >= MIN) { b.x += dx; b.y += dy; b.w -= dx; b.h -= dy; } }
        else if (corner === "tr") { if (b.w + dx >= MIN && b.h - dy >= MIN) { b.y += dy; b.w += dx; b.h -= dy; } }
        else if (corner === "bl") { if (b.w - dx >= MIN && b.h + dy >= MIN) { b.x += dx; b.w -= dx; b.h += dy; } }
        else { if (b.w + dx >= MIN && b.h + dy >= MIN) { b.w += dx; b.h += dy; } }
        cropRef.current = b; setCrop({ ...b });
      },
    });
  };

  const tl = useRef(mkCorner("tl")).current;
  const tr = useRef(mkCorner("tr")).current;
  const bl = useRef(mkCorner("bl")).current;
  const br = useRef(mkCorner("br")).current;

  const ms = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const mp = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => Object.assign(ms.current, cropRef.current),
    onPanResponderMove: (_, { dx, dy }) => {
      const cs = containerRef.current, ns = naturalRef.current;
      if (!cs.width || !ns.width) return;
      const sc = Math.min(cs.width / ns.width, cs.height / ns.height);
      const ox = (cs.width - ns.width * sc) / 2, oy = (cs.height - ns.height * sc) / 2;
      const prev = ms.current;
      const nx = Math.max(ox, Math.min(prev.x + dx, ox + ns.width * sc - prev.w));
      const ny = Math.max(oy, Math.min(prev.y + dy, oy + ns.height * sc - prev.h));
      const b = { ...prev, x: nx, y: ny };
      cropRef.current = b; setCrop({ ...b });
    },
  })).current;

  const apply = async () => {
    const sc = Math.min(containerSize.width / naturalSize.width, containerSize.height / naturalSize.height);
    const dw = naturalSize.width * sc, dh = naturalSize.height * sc;
    const ox = (containerSize.width - dw) / 2, oy = (containerSize.height - dh) / 2;
    const x = Math.max(0, (crop.x - ox) / sc), y = Math.max(0, (crop.y - oy) / sc);
    const w = Math.min(crop.w / sc, naturalSize.width - x), h = Math.min(crop.h / sc, naturalSize.height - y);
    const r = await ImageManipulator.manipulateAsync(
      ready ?? uri,
      [{ crop: { originX: Math.round(x), originY: Math.round(y), width: Math.round(w), height: Math.round(h) } }],
      { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG },
    );
    onApply(r.uri);
  };

  const H = 22;
  if (!ready) {
    return (
      <Modal visible animationType="fade" statusBarTranslucent>
        <View style={{ flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color="#6E56CF" size="large" />
        </View>
      </Modal>
    );
  }
  return (
    <Modal visible animationType="fade" statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        <View
          style={{ flex: 1 }}
          onLayout={(e) => { const { width, height } = e.nativeEvent.layout; containerRef.current = { width, height }; setContainerSize({ width, height }); }}
        >
          <Image source={{ uri: ready }} style={{ flex: 1 }} resizeMode="contain" />
          {crop.w > 0 && (
            <>
              <View style={{ position: "absolute", left: 0, right: 0, top: 0, height: crop.y, backgroundColor: "rgba(0,0,0,0.55)" }} />
              <View style={{ position: "absolute", left: 0, right: 0, top: crop.y + crop.h, bottom: 0, backgroundColor: "rgba(0,0,0,0.55)" }} />
              <View style={{ position: "absolute", top: crop.y, left: 0, width: crop.x, height: crop.h, backgroundColor: "rgba(0,0,0,0.55)" }} />
              <View style={{ position: "absolute", top: crop.y, left: crop.x + crop.w, right: 0, height: crop.h, backgroundColor: "rgba(0,0,0,0.55)" }} />
              <View style={{ position: "absolute", left: crop.x, top: crop.y, width: crop.w, height: crop.h, borderWidth: 1.5, borderColor: "#fff" }} />
              <View {...mp.panHandlers} style={{ position: "absolute", left: crop.x, top: crop.y, width: crop.w, height: crop.h }} />
              {([
                { p: tl, l: crop.x - H / 2, t: crop.y - H / 2 },
                { p: tr, l: crop.x + crop.w - H / 2, t: crop.y - H / 2 },
                { p: bl, l: crop.x - H / 2, t: crop.y + crop.h - H / 2 },
                { p: br, l: crop.x + crop.w - H / 2, t: crop.y + crop.h - H / 2 },
              ] as any[]).map((c, i) => (
                <View key={i} {...c.p.panHandlers} style={{ position: "absolute", width: H, height: H, borderRadius: 4, backgroundColor: "#fff", left: c.l, top: c.t }} />
              ))}
            </>
          )}
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", padding: 20, paddingBottom: 44, backgroundColor: "#111" }}>
          <TouchableOpacity onPress={onCancel} style={{ padding: 12 }}>
            <Text style={{ color: "#888", fontWeight: "600", fontSize: 16 }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={apply} style={{ paddingHorizontal: 24, paddingVertical: 12, backgroundColor: "#6E56CF", borderRadius: 10 }}>
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>Apply</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function normUrl(input: string) {
  try {
    const url = new URL(Platform.OS === "android" ? input.replace("http://localhost", "http://10.0.2.2").replace("http://127.0.0.1", "http://10.0.2.2") : input);
    if (!/\/api\/v2\/image\/?$/.test(url.pathname)) url.pathname = url.pathname.replace(/\/?$/, "/api/v2/image");
    return url.toString();
  } catch { return input; }
}

async function fetchTimeout(resource: RequestInfo | URL, opts: RequestInit = {}, ms = 60_000) {
  const c = new AbortController();
  const id = setTimeout(() => c.abort(), ms);
  try { return await fetch(resource, { ...opts, signal: c.signal }); } finally { clearTimeout(id); }
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 16, fontWeight: "600" },
  imageArea: { flex: 1, padding: 16 },
  frame: { flex: 1, borderRadius: 12, overflow: "hidden", borderWidth: 1 },
  img: { width: "100%", flex: 1 },
  empty: {
    flex: 1, borderRadius: 12, borderWidth: 1, borderStyle: "dashed",
    alignItems: "center", justifyContent: "center", gap: 8,
  },
  emptyText: { fontSize: 14 },
  actionsWrapper: {
    padding: 16, borderTopWidth: StyleSheet.hairlineWidth,
  },
  actions: {
    flexDirection: "row", gap: 8,
  },
  actionBtn: {
    flex: 1, height: 48, borderRadius: 10, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  actionText: { fontWeight: "600", fontSize: 15 },
  primaryBtn: {
    flex: 1.5, height: 48, borderRadius: 10, alignItems: "center", justifyContent: "center",
  },
  primaryText: { color: "#fff", fontWeight: "600", fontSize: 15 },
});
