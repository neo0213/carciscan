import Entypo from '@expo/vector-icons/Entypo';
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as ImageManipulator from "expo-image-manipulator";
export default function PreviewScreen() {
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [currentImageUri, setCurrentImageUri] = useState<string | null>(uri || null);
  const [productType, setProductType] = useState<number | null>(null); //changed this for product type

//categories of product to choose from
    const CATEGORY_OPTIONS: { label: string; value: number }[] = [
        { label: "Aerosol / Spray", value: 1 },
        { label: "Liquid Solution", value: 2 },
        { label: "Powder / Granular", value: 3 },
        { label: "Cream / Gel / Paste", value: 4 },
        { label: "Solid / Tablet / Block", value: 5 },
        { label: "Vapor / Strong Fumes", value: 6 },
        { label: "Mixed / Unknown", value: 7 },
    ];


    const upload = async () => {
        if (!currentImageUri) return;

        if (!productType) {
            Alert.alert("Select Category", "Please choose a category first.");
            return;
        }

        try {
            setIsUploading(true);
            const rawEnv = process.env.EXPO_PUBLIC_API_URL || "https://carciscan-api-production.up.railway.app/";
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
            form.append("category", String(productType));


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

    //computing the size of the image
    const [imageAspectRatio, setImageAspectRatio] = useState<number>(1);

    useEffect(() => {
        if (!currentImageUri) return;

        Image.getSize(
            currentImageUri,
            (width, height) => {
                setImageAspectRatio(width / height);
            },
            () => {
                // fallback if size fails
                setImageAspectRatio(1);
            }
        );
    }, [currentImageUri]);


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
                      style={[styles.preview, { aspectRatio: imageAspectRatio }]}
                      resizeMode="contain"
                  />
              ) : (
                  <View style={styles.missing}>
                      <Text style={styles.muted}>No image</Text>
                  </View>
              )}
          </View>

          {/** choosing what type of product   **/ }

          {/* Product Category Selector */}
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
                                  width: "48%",              // 2 per row with equal size
                                  marginBottom: 10,          // spacing between rows
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



      <View style={styles.footer}>
        <TouchableOpacity onPress={() => router.replace("/scan")} style={[styles.button, styles.secondary]}>
          <Text style={styles.buttonTextSecondary}>Retake</Text>
        </TouchableOpacity>
              <TouchableOpacity
                  onPress={upload}
                  style={[styles.button, styles.primary]}
                  disabled={isUploading}
              >
                  {isUploading ? (
                      <ActivityIndicator color="#fff" />
                  ) : (
                      <Text style={styles.buttonTextPrimary}>Analyze</Text>
                  )}
              </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

// Uses React Native FormData + fetch per latest Expo FS guidance

function normalizePredictUrl(input: string) {
  try {
    const url = new URL(translateLocalhostForEmulator(input));
    // Ensure we point to the image prediction endpoint
    if (!/\/api\/v1\/predict\/predict\/?$/.test(url.pathname)) {
      url.pathname = url.pathname.replace(/\/?$/, "/api/v1/predict/predict");
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
    },

    preview: {
        width: "100%",
        maxHeight: "70%",     // prevents portrait images from pushing footer
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