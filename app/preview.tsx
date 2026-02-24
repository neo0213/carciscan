import Entypo from '@expo/vector-icons/Entypo';
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, Modal, PanResponder, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as ImageManipulator from "expo-image-manipulator";
export default function PreviewScreen() {
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [currentImageUri, setCurrentImageUri] = useState<string | null>(uri || null);
  const [showCrop, setShowCrop] = useState(false);
  // const [productType, setProductType] = useState<number | null>(null); //changed this for product type

  //categories of product to choose from
  // const CATEGORY_OPTIONS: { label: string; value: number }[] = [
  //     { label: "Aerosol / Spray", value: 1 },
  //     { label: "Liquid Solution", value: 2 },
  //     { label: "Powder / Granular", value: 3 },
  //     { label: "Cream / Gel / Paste", value: 4 },
  //     { label: "Solid / Tablet / Block", value: 5 },
  //     { label: "Vapor / Strong Fumes", value: 6 },
  //     { label: "Mixed / Unknown", value: 7 },
  // ];


    const upload = async () => {
        if (!currentImageUri) return;

        // if (!productType) {
        //     Alert.alert("Select Category", "Please choose a category first.");
        //     return;
        // }

        try {
            setIsUploading(true);
            const rawEnv = process.env.EXPO_PUBLIC_API_URL || "https://carciscan.edwardgarcia.site/"; // "https://carciscan-api-production.up.railway.app/"
            if (!rawEnv) {
                Alert.alert("Missing API URL", "Set EXPO_PUBLIC_API_URL in your env.");
                return;
            }
            const endpoint = normalizePredictUrl(rawEnv);

            const form = new FormData();
            // API expects the file field to be named `file`
            form.append("file", {
                uri: currentImageUri,
                name: "scan.jpg",
                type: "image/jpeg"
            } as any);

            //added this for category type

            // Step 3: Append category (send to backend)
            // form.append("category", String(productType));


            const res = await fetchWithTimeout(endpoint, {
                method: "POST",
                // Let fetch set the Content-Type (with boundary) for multipart form data
                headers: { Accept: "application/json" },
                body: form
            }, 60_000);

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const json = await res.json();
        console.log("API response:", json);
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

     /*
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
  };*/

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Permission needed");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                exif: true,               // 🔑 get EXIF data
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];

                let imageUri = asset.uri;

                // Normalize orientation if EXIF exists
                if (asset.exif?.Orientation) {
                    const manipulated = await ImageManipulator.manipulateAsync(
                        imageUri,
                        [{ rotate: 0 }], // forces orientation fix
                        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
                    );
                    imageUri = manipulated.uri;
                }

                setCurrentImageUri(imageUri);
            }
        } catch (error) {
            Alert.alert("Error", "Failed to pick image");
        }
    };

    // aspectRatio via Image.getSize was causing left-alignment on iOS (raw file dims
    // are landscape even for portrait shots due to EXIF rotation). resizeMode="contain"
    // handles scaling correctly on its own.
    // const [imageAspectRatio, setImageAspectRatio] = useState<number>(1);
    // useEffect(() => {
    //     if (!currentImageUri) return;
    //     Image.getSize(
    //         currentImageUri,
    //         (width, height) => { setImageAspectRatio(width / height); },
    //         () => { setImageAspectRatio(1); }
    //     );
    // }, [currentImageUri]);


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
                  <Image
                      source={{ uri: currentImageUri }}
                      style={styles.preview}
                      resizeMode="contain"
                  />
              ) : (
                  <View style={styles.missing}>
                      <Text style={styles.muted}>No image</Text>
                  </View>
              )}
          </View>

          {/* Product Category Selector — commented out
          <View style={{ marginTop: 20, marginLeft: 10, marginRight: 10}}>
              <Text style={{ color: "#E5E7EB", marginBottom: 20, fontWeight: "600", marginLeft: 10 }}>
                  Select Product Category
              </Text>

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                  {CATEGORY_OPTIONS.map((item) => {
                      const selected = productType === item.value;

                      return (
                          <TouchableOpacity
                              key={item.value}
                              onPress={() => setProductType(item.value)}
                              style={{
                                  width: "48%",
                                  marginBottom: 10,
                                  paddingVertical: 10,
                                  paddingHorizontal: 14,
                                  borderRadius: 10,
                                  borderWidth: 1,
                                  borderColor: selected ? "#0EA5E9" : "#374151",
                                  backgroundColor: selected ? "#0EA5E9" : "#111827",
                                  alignItems: "center"
                              }}
                          >
                              <Text style={{ color: "#fff", fontWeight: "600" }}>
                                  {item.label}
                              </Text>
                          </TouchableOpacity>
                      );
                  })}
              </View>
          </View>
          */}



      <View style={styles.footer}>
        <TouchableOpacity onPress={() => router.replace("/scan")} style={[styles.button, styles.secondary]}>
          <Text style={styles.buttonTextSecondary}>Retake</Text>
        </TouchableOpacity>
        {currentImageUri && (
          <TouchableOpacity onPress={() => setShowCrop(true)} style={[styles.button, styles.secondary]}>
            <Text style={styles.buttonTextSecondary}>Crop</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={upload} style={[styles.button, styles.primary]} disabled={isUploading}>
          {isUploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonTextPrimary}>Analyze</Text>}
        </TouchableOpacity>
      </View>

      {showCrop && currentImageUri && (
        <CropModal
          uri={currentImageUri}
          onApply={(croppedUri) => { setCurrentImageUri(croppedUri); setShowCrop(false); }}
          onCancel={() => setShowCrop(false)}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Crop Modal ───────────────────────────────────────────────────────────────
function CropModal({
  uri,
  onApply,
  onCancel,
}: {
  uri: string;
  onApply: (croppedUri: string) => void;
  onCancel: () => void;
}) {
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  // Refs so PanResponder closures (created once) can read latest values
  const containerSizeRef = useRef({ width: 0, height: 0 });
  const naturalSizeRef = useRef({ width: 0, height: 0 });
  const cropRef = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const [cropDisplay, setCropDisplay] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const initialized = useRef(false);

  useEffect(() => {
    Image.getSize(uri, (w, h) => {
      naturalSizeRef.current = { width: w, height: h };
      setNaturalSize({ width: w, height: h });
    });
  }, [uri]);

  useEffect(() => {
    if (!containerSize.width || !naturalSize.width || initialized.current) return;
    const scale = Math.min(containerSize.width / naturalSize.width, containerSize.height / naturalSize.height);
    const dw = naturalSize.width * scale;
    const dh = naturalSize.height * scale;
    const ox = (containerSize.width - dw) / 2;
    const oy = (containerSize.height - dh) / 2;
    const box = { x: ox, y: oy, w: dw, h: dh };
    cropRef.current = box;
    setCropDisplay(box);
    initialized.current = true;
  }, [containerSize, naturalSize]);

  const makeCornerPan = (corner: "tl" | "tr" | "bl" | "br") => {
    const start = { x: 0, y: 0, w: 0, h: 0 };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => Object.assign(start, cropRef.current),
      onPanResponderMove: (_, { dx, dy }) => {
        const MIN = 60;
        const b = { ...start };
        if (corner === "tl") {
          if (b.w - dx >= MIN && b.h - dy >= MIN) { b.x += dx; b.y += dy; b.w -= dx; b.h -= dy; }
        } else if (corner === "tr") {
          if (b.w + dx >= MIN && b.h - dy >= MIN) { b.y += dy; b.w += dx; b.h -= dy; }
        } else if (corner === "bl") {
          if (b.w - dx >= MIN && b.h + dy >= MIN) { b.x += dx; b.w -= dx; b.h += dy; }
        } else {
          if (b.w + dx >= MIN && b.h + dy >= MIN) { b.w += dx; b.h += dy; }
        }
        cropRef.current = b;
        setCropDisplay({ ...b });
      },
    });
  };

  const tlPan = useRef(makeCornerPan("tl")).current;
  const trPan = useRef(makeCornerPan("tr")).current;
  const blPan = useRef(makeCornerPan("bl")).current;
  const brPan = useRef(makeCornerPan("br")).current;

  const moveStart = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const movePan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => Object.assign(moveStart.current, cropRef.current),
    onPanResponderMove: (_, { dx, dy }) => {
      const cs = containerSizeRef.current;
      const ns = naturalSizeRef.current;
      if (!cs.width || !ns.width) return;
      const scale = Math.min(cs.width / ns.width, cs.height / ns.height);
      const ox = (cs.width - ns.width * scale) / 2;
      const oy = (cs.height - ns.height * scale) / 2;
      const s = moveStart.current;
      const newX = Math.max(ox, Math.min(s.x + dx, ox + ns.width * scale - s.w));
      const newY = Math.max(oy, Math.min(s.y + dy, oy + ns.height * scale - s.h));
      const b = { ...s, x: newX, y: newY };
      cropRef.current = b;
      setCropDisplay({ ...b });
    },
  })).current;

  const handleApply = async () => {
    const scale = Math.min(containerSize.width / naturalSize.width, containerSize.height / naturalSize.height);
    const dw = naturalSize.width * scale;
    const dh = naturalSize.height * scale;
    const ox = (containerSize.width - dw) / 2;
    const oy = (containerSize.height - dh) / 2;
    const x = Math.max(0, (cropDisplay.x - ox) / scale);
    const y = Math.max(0, (cropDisplay.y - oy) / scale);
    const w = Math.min(cropDisplay.w / scale, naturalSize.width - x);
    const h = Math.min(cropDisplay.h / scale, naturalSize.height - y);
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ crop: { originX: Math.round(x), originY: Math.round(y), width: Math.round(w), height: Math.round(h) } }],
      { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
    );
    onApply(result.uri);
  };

  const HANDLE = 24;
  return (
    <Modal visible animationType="fade" statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        <View
          style={{ flex: 1 }}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            containerSizeRef.current = { width, height };
            setContainerSize({ width, height });
          }}
        >
          <Image source={{ uri }} style={{ flex: 1 }} resizeMode="contain" />
          {cropDisplay.w > 0 && (
            <>
              {/* Semi-transparent masks */}
              <View style={{ position: "absolute", left: 0, right: 0, top: 0, height: cropDisplay.y, backgroundColor: "rgba(0,0,0,0.55)" }} />
              <View style={{ position: "absolute", left: 0, right: 0, top: cropDisplay.y + cropDisplay.h, bottom: 0, backgroundColor: "rgba(0,0,0,0.55)" }} />
              <View style={{ position: "absolute", top: cropDisplay.y, left: 0, width: cropDisplay.x, height: cropDisplay.h, backgroundColor: "rgba(0,0,0,0.55)" }} />
              <View style={{ position: "absolute", top: cropDisplay.y, left: cropDisplay.x + cropDisplay.w, right: 0, height: cropDisplay.h, backgroundColor: "rgba(0,0,0,0.55)" }} />
              {/* Crop border */}
              <View style={{ position: "absolute", left: cropDisplay.x, top: cropDisplay.y, width: cropDisplay.w, height: cropDisplay.h, borderWidth: 1.5, borderColor: "#fff" }} />
              {/* Draggable move area (behind corners) */}
              <View
                {...movePan.panHandlers}
                style={{ position: "absolute", left: cropDisplay.x, top: cropDisplay.y, width: cropDisplay.w, height: cropDisplay.h }}
              />
              {/* Corner handles */}
              {([
                { pan: tlPan, left: cropDisplay.x - HANDLE / 2, top: cropDisplay.y - HANDLE / 2 },
                { pan: trPan, left: cropDisplay.x + cropDisplay.w - HANDLE / 2, top: cropDisplay.y - HANDLE / 2 },
                { pan: blPan, left: cropDisplay.x - HANDLE / 2, top: cropDisplay.y + cropDisplay.h - HANDLE / 2 },
                { pan: brPan, left: cropDisplay.x + cropDisplay.w - HANDLE / 2, top: cropDisplay.y + cropDisplay.h - HANDLE / 2 },
              ] as any[]).map((h, i) => (
                <View
                  key={i}
                  {...h.pan.panHandlers}
                  style={{ position: "absolute", width: HANDLE, height: HANDLE, borderRadius: 4, backgroundColor: "#0EA5E9", left: h.left, top: h.top }}
                />
              ))}
            </>
          )}
        </View>
        {/* Toolbar */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, paddingBottom: 32, backgroundColor: "#111827" }}>
          <TouchableOpacity onPress={onCancel} style={{ padding: 12 }}>
            <Text style={{ color: "#9CA3AF", fontWeight: "600", fontSize: 16 }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleApply} style={{ paddingHorizontal: 20, paddingVertical: 12, backgroundColor: "#0EA5E9", borderRadius: 10 }}>
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Apply Crop</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// Uses React Native FormData + fetch per latest Expo FS guidance

function normalizePredictUrl(input: string) {
  try {
    const url = new URL(translateLocalhostForEmulator(input));
    // Ensure we point to the image prediction endpoint
    if (!/\/api\/v2\/image\/?$/.test(url.pathname)) {
      url.pathname = url.pathname.replace(/\/?$/, "/api/v2/image");
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
    marginTop: 20,
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
        flex: 1,
        padding: 16,
        justifyContent: "center",
        alignItems: "center",
    },

    preview: {
        width: "100%",
        flex: 1,
        borderRadius: 16,
        backgroundColor: "#000",
    },


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