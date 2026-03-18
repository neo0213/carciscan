import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert, Platform, SafeAreaView, StatusBar, StyleSheet, Text,
  TouchableOpacity, View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function ScanScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const [facing, setFacing] = useState<"back" | "front">("back");

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission, requestPermission]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Please grant photo library access.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 1,
      });
      if (!result.canceled && result.assets[0]) {
        router.push({ pathname: "/preview", params: { uri: result.assets[0].uri } });
      }
    } catch {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const takePhoto = async () => {
    if (!cameraRef.current || isCapturing) return;
    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
      router.push({ pathname: "/preview", params: { uri: photo.uri } });
    } catch {
      Alert.alert("Capture failed", "Please try again.");
    } finally {
      setIsCapturing(false);
    }
  };

  if (!permission) {
    return (
      <View style={[s.center, { backgroundColor: colors.bg }]}>
        <Text style={[s.body, { color: colors.textSecondary }]}>Requesting camera…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[s.center, { backgroundColor: colors.bg }]}>
        <Text style={[s.title, { color: colors.text }]}>Camera access</Text>
        <Text style={[s.body, { color: colors.textSecondary, textAlign: "center", maxWidth: 280 }]}>
          We need camera permission to scan product labels.
        </Text>
        <TouchableOpacity onPress={requestPermission} style={[s.btn, { backgroundColor: colors.accent }]}>
          <Text style={s.btnText}>Allow camera</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} />

      {/* Top */}
      <SafeAreaView style={s.top}>
        <View style={s.topRow}>
          <TouchableOpacity onPress={() => router.back()} style={s.pill}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={s.topTitle}>Scan label</Text>
          <TouchableOpacity onPress={() => router.push("/text-entry")} style={s.pill}>
            <Ionicons name="create-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Bottom */}
      <View style={s.bottom}>
        <TouchableOpacity onPress={pickImage} style={s.sideBtn}>
          <Ionicons name="images-outline" size={22} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={takePhoto}
          disabled={isCapturing}
          style={[s.shutter, isCapturing && { opacity: 0.5 }]}
        >
          <View style={s.shutterInner} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setFacing((p) => (p === "back" ? "front" : "back"))}
          style={s.sideBtn}
        >
          <Ionicons name="camera-reverse-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },
  title: { fontSize: 20, fontWeight: "600" },
  body: { fontSize: 15, lineHeight: 22 },
  btn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10, marginTop: 8 },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  top: {
    position: "absolute", top: 0, left: 0, right: 0,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 36 : 0,
  },
  topRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 8,
  },
  topTitle: { color: "#fff", fontSize: 16, fontWeight: "600" },
  pill: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center", justifyContent: "center",
  },
  bottom: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    flexDirection: "row", alignItems: "center", justifyContent: "space-evenly",
    paddingBottom: 48, paddingTop: 20,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  sideBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  shutter: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 3, borderColor: "#fff",
    alignItems: "center", justifyContent: "center",
  },
  shutterInner: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: "#fff",
  },
});
