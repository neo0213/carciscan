import { Ionicons } from "@expo/vector-icons";
import Entypo from '@expo/vector-icons/Entypo';
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ScanScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const [facing, setFacing] = useState<'back' | 'front'>("back");

  useEffect(() => {
    if (!permission) {
      // initial load will request the permission object
      requestPermission();
    }
  }, [permission, requestPermission]);

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
        router.push({ pathname: "/preview", params: { uri: result.assets[0].uri } });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const useTextEntry = () => {
    router.push({ pathname: "/text-entry" });
  };

  const takePhoto = async () => {
    if (!cameraRef.current || isCapturing) return;
    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({ 
        quality: 0.8
       });
      router.push({ pathname: "/preview", params: { uri: photo.uri } });
    } catch (e) {
      Alert.alert("Capture failed", "Please try again.");
    } finally {
      setIsCapturing(false);
    }
  };

  if (!permission) {
    return <View style={styles.center}><Text style={styles.muted}>Requesting camera permission…</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Camera access needed</Text>
        <Text style={styles.muted}>Enable camera permissions in Settings to scan labels.</Text>
        <TouchableOpacity onPress={requestPermission} style={[styles.iconButton, { marginTop: 16 }]}> 
          <Text>Grant permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Scan Label</Text>
        <View style={styles.headerSpacer} />

        <TouchableOpacity onPress={useTextEntry} style={styles.useTextButton}>
          <Text style={styles.useTextButtonText}>Use Text Entry</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} pictureSize="1280x720"/>
        <View style={styles.overlayTop}>
          <Text style={styles.brand}>CarciScan</Text>
          <Text style={styles.helper}>Align the label within the frame</Text>
        </View>
        {/* frame overlay removed per request */}
        <View style={styles.controls}>
          <TouchableOpacity onPress={pickImage} style={styles.iconButton} accessibilityLabel="Pick from library">
            <Ionicons name="images" size={26} color="#0B4C8C" />
          </TouchableOpacity>
          <TouchableOpacity onPress={takePhoto} style={[styles.shutter, isCapturing && styles.shutterDisabled]} disabled={isCapturing} accessibilityLabel="Capture photo" />
          <TouchableOpacity onPress={() => setFacing(prev => prev === 'back' ? 'front' : 'back')} style={styles.iconButton} accessibilityLabel="Flip camera">
            <Ionicons name="camera-reverse" size={26} color="#0B4C8C" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#000"
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
  cameraContainer: {
    flex: 1,
    position: "relative"
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 22, fontWeight: "600", color: "#0B4C8C", marginBottom: 8, textAlign: "center" },
  muted: { fontSize: 14, color: "#6B7280", textAlign: "center" },
  brand: { fontSize: 20, fontWeight: "700", color: "#0B4C8C" },
  helper: { fontSize: 13, color: "#ffffff", opacity: 0.8 },
  overlayTop: { position: "absolute", top: 20, left: 20, right: 20, alignItems: "center", gap: 8 },
  frame: {
    position: "absolute",
    top: "20%",
    left: 24,
    right: 24,
    height: "50%",
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.9)",
    backgroundColor: "transparent"
  },
  controls: {
    position: "absolute",
    bottom: 40,
    left: 24,
    right: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  iconButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4
  },
  shutter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "#0EA5E9",
    borderWidth: 6,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6
  },
  shutterDisabled: { opacity: 0.6 },
  useTextButton: {
    padding: 10,
    marginRight: 8,
    borderColor: "#FFFFFF",
    borderWidth: 1,
    borderRadius: 12
  },
  useTextButtonText: {
    color: "#FFFFFF",
    fontWeight: "600"
  }
});


