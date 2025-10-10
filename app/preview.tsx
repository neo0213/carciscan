import { useLocalSearchParams, useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Alert, Platform, SafeAreaView } from "react-native";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import Entypo from '@expo/vector-icons/Entypo';

export default function PreviewScreen() {
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [currentImageUri, setCurrentImageUri] = useState<string | null>(uri || null);

  const upload = async () => {
    if (!currentImageUri) return;
    try {
      setIsUploading(true);
      const rawEnv = process.env.EXPO_PUBLIC_API_URL || "http://10.195.201.57:8000";
      if (!rawEnv) {
        Alert.alert("Missing API URL", "Set EXPO_PUBLIC_API_URL in your env.");
        return;
      }
      const endpoint = normalizePredictUrl(rawEnv);

      const form = new FormData();
      form.append("image", {
        uri: currentImageUri,
        name: "scan.jpg",
        type: "image/jpeg"
      } as any);

      const res = await fetchWithTimeout(endpoint, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "multipart/form-data" },
        body: form
      }, 60_000);

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || "Upload failed");
        
        // Navigate to results page
        router.push({
          pathname: "/results",
          params: { 
            apiResult: JSON.stringify(json),
            resultText: JSON.stringify(json, null, 2)
          }
        });
      } else {
        const text = await res.text();
        if (!res.ok) throw new Error(text || "Upload failed");
        
        // Navigate to results page with raw text
        router.push({
          pathname: "/results",
          params: { resultText: text }
        });
      }
    } catch (e: any) {
      Alert.alert("Upload error", e?.message ?? "Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant photo library access to select an image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCurrentImageUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          accessibilityLabel="Go back"
        >
          <Entypo name="chevron-left" size={24} color="#0B4C8C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preview</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {currentImageUri ? (
          <Image source={{ uri: currentImageUri }} style={styles.preview} resizeMode="cover" />
        ) : (
          <View style={styles.missing}><Text style={styles.muted}>No image</Text></View>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => router.replace("/scan")} style={[styles.button, styles.secondary]}>
          <Text style={styles.buttonTextSecondary}>Retake</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={upload} style={[styles.button, styles.primary]} disabled={isUploading}>
          {isUploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonTextPrimary}>Send to API</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Uses React Native FormData + fetch per latest Expo FS guidance

function normalizePredictUrl(input: string) {
  try {
    const url = new URL(translateLocalhostForEmulator(input));
    if (!/\/api\/v1\/predict\/?$/.test(url.pathname)) {
      url.pathname = url.pathname.replace(/\/?$/, "/api/v1/predict");
    }
    return url.toString();
  } catch {
    return input;
  }
}

function translateLocalhostForEmulator(input: string) {
  // Android emulator cannot reach host localhost; use 10.0.2.2
  if (Platform.OS === "android") {
    return input.replace("http://localhost", "http://10.0.2.2").replace("http://127.0.0.1", "http://10.0.2.2");
  }
  return input;
}

async function fetchWithTimeout(resource: RequestInfo | URL, options: RequestInit = {}, timeoutMs = 60_000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(resource, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(id);
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B1220" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#1F2937",
    backgroundColor: "#0B1220"
  },
  backButton: {
    padding: 8,
    marginRight: 8
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F3F4F6",
    flex: 1
  },
  headerSpacer: {
    width: 40
  },
  content: {
    flex: 1
  },
  preview: { flex: 1 },
  missing: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { color: "#9CA3AF" },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#0B1220",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#1F2937"
  },
  button: { height: 48, borderRadius: 12, paddingHorizontal: 20, alignItems: "center", justifyContent: "center", minWidth: 120 },
  primary: { backgroundColor: "#0EA5E9" },
  secondary: { backgroundColor: "#111827", borderWidth: 1, borderColor: "#374151" },
  buttonTextPrimary: { color: "#ffffff", fontWeight: "600" },
  buttonTextSecondary: { color: "#E5E7EB", fontWeight: "600" }
});