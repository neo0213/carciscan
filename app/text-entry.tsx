import Entypo from '@expo/vector-icons/Entypo';
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function TextEntryScreen() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [textValue, setTextValue] = useState("");




  const sendText = async () => {
    if (!textValue || textValue.trim().length === 0) {
      Alert.alert('Validation', 'Please enter some text to analyze.');
      return;
    }


    try {
      setIsUploading(true);
      const endpoint = "https://carciscan.edwardgarcia.site/api/v2/text";

      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 60_000);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ ingredients: textValue }),
        signal: controller.signal
      });
      clearTimeout(id);

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || 'Request failed');
        router.push({ pathname: '/results', params: { apiResult: JSON.stringify(json), resultText: JSON.stringify(json, null, 2) } });
      } else {
        const text = await res.text();
        if (!res.ok) throw new Error(text || 'Request failed');
        router.push({ pathname: '/results', params: { resultText: text } });
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Please try again.');
    } finally {
      setIsUploading(false);
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}>
        {/* Custom Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
            accessibilityLabel="Go back"
          >
            <Entypo name="chevron-left" size={24} color="#0B4C8C" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Text Entry</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          <TextInput
            style={styles.textInput}
            placeholder="Enter Ingredients"
            placeholderTextColor="#9CA3AF"
            value={textValue}
            onChangeText={setTextValue}
            multiline
          />
        </View>

        <View style={styles.footer}>
                  <TouchableOpacity
                      onPress={sendText}
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
      alignItems: "center",
    marginTop: 20,
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
  },
   textInput: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    borderColor: "#FFFFFF",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16
  },
  content: {
    flex: 1,
    padding: 16
  },
    footer: { padding: 16, paddingBottom: 0, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#111827', backgroundColor: '#000' },
  button: { height: 48, borderRadius: 12, paddingHorizontal: 20, alignItems: "center", justifyContent: "center", minWidth: 120 },
  primary: { backgroundColor: "#0EA5E9" },
  buttonTextPrimary: { color: "#ffffff", fontWeight: "600" },
});


