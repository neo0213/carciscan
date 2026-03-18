import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../context/ThemeContext";

const KNOWN_ERRORS: Record<string, string> = {
  "Network request failed": "No internet connection. Check your network and try again.",
  "The user aborted a request": "Request timed out. The server took too long to respond.",
  AbortError: "Request timed out. Try again.",
  "Failed to fetch": "Could not reach the server. Check your connection.",
};

function friendlyMessage(raw: string): string {
  for (const [key, msg] of Object.entries(KNOWN_ERRORS)) {
    if (raw.includes(key)) return msg;
  }
  if (raw.toLowerCase().includes("timeout")) return "Request timed out. Try again.";
  if (raw.toLowerCase().includes("500")) return "Server error. Try again in a moment.";
  if (raw.toLowerCase().includes("404")) return "Endpoint not found. Check the server configuration.";
  if (raw.toLowerCase().includes("401") || raw.toLowerCase().includes("403")) return "Unauthorized. Check your credentials.";
  if (raw.toLowerCase().includes("422") || raw.toLowerCase().includes("invalid")) return "The server couldn't process the request. Check your input.";
  return raw || "Something went wrong. Please try again.";
}

interface Props {
  message: string;
  onDismiss: () => void;
}

export function ErrorBanner({ message, onDismiss }: Props) {
  const { colors } = useTheme();
  const friendly = friendlyMessage(message);

  return (
    <View style={[s.container, { backgroundColor: colors.dangerLight, borderColor: colors.danger + "40" }]}>
      <Ionicons name="alert-circle-outline" size={18} color={colors.danger} style={{ marginTop: 1 }} />
      <Text style={[s.text, { color: colors.danger }]} numberOfLines={3}>
        {friendly}
      </Text>
      <TouchableOpacity onPress={onDismiss} hitSlop={12}>
        <Ionicons name="close" size={16} color={colors.danger} />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  text: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
  },
});
