import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TextEntryScreen() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [textValue, setTextValue] = useState("");
  const insets = useSafeAreaInsets();

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
        headers: { 
          'Accept': 'application/json', 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ ingredients: textValue }),
        signal: controller.signal
      });
      clearTimeout(id);

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || 'Request failed');
        
        router.push({ 
          pathname: '/results', 
          params: { 
            apiResult: JSON.stringify(json), 
            resultText: JSON.stringify(json, null, 2) 
          } 
        });
      } else {
        const text = await res.text();
        if (!res.ok) throw new Error(text || 'Request failed');
        router.push({ 
          pathname: '/results', 
          params: { resultText: text } 
        });
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Area */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analyze Ingredients</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* KeyboardAvoidingView makes the footer "jump" up */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TextInput
            style={styles.textInput}
            placeholder="Enter Ingredients (e.g. Sugar, Palm Oil, Red 40...)"
            placeholderTextColor="#9CA3AF"
            value={textValue}
            onChangeText={setTextValue}
            multiline
            textAlignVertical="top"
          />
        </ScrollView>

        {/* Footer Area */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            onPress={sendText}
            style={[styles.button, styles.primary, isUploading && styles.shutterDisabled]}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#000" 
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#000",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  backIcon: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F3F4F6",
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    flexGrow: 1,
  },
  textInput: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
    borderColor: "#333",
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 20,
    minHeight: 250,
    backgroundColor: "#111", // Slightly lighter than background to see the box
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    marginBottom:20,
    backgroundColor: "#000",
  },
  button: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: "#0EA5E9",
    shadowColor: "#0EA5E9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primary: { 
    backgroundColor: "#0EA5E9" 
  },
  shutterDisabled: { 
    opacity: 0.6 
  },
  buttonTextPrimary: { 
    color: "#ffffff", 
    fontSize: 16, 
    fontWeight: "700" 
  },
});