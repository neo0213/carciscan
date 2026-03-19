import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";

export default function Index() {
  const { colors, isDark, toggle } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      style={[
        s.root,
        {
          backgroundColor: colors.bg,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Nav */}
      <View style={s.nav}>
        <View style={s.brand}>
          <Image
            source={require("../assets/images/logo.png")}
            style={s.logoImg}
            resizeMode="contain"
          />
          <Text style={[s.logoText, { color: colors.text }]}>CarciScan</Text>
        </View>
        <TouchableOpacity onPress={toggle} style={s.themeBtn} hitSlop={12}>
          <Ionicons
            name={isDark ? "sunny-outline" : "moon-outline"}
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Centered content block */}
      <View style={s.center}>
        <View style={s.hero}>
          <Text style={[s.heading, { color: colors.text }]}>
            Scan Household products{"\n"}for carcinogenicity.
          </Text>
          <Text style={[s.sub, { color: colors.textSecondary }]}>
            Capture or upload an ingredient label, or enter ingredients manually
            to check for potential carcinogens.
          </Text>
        </View>

        <View style={s.actions}>
          <TouchableOpacity
            onPress={() => router.push("/scan")}
            style={[s.primary, { backgroundColor: colors.accent }]}
            activeOpacity={0.85}
          >
            <Text style={s.primaryText}>Scan with camera</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/text-entry")}
            style={[s.secondary, { borderColor: colors.border }]}
            activeOpacity={0.7}
          >
            <Text style={[s.secondaryText, { color: colors.text }]}>
              Enter ingredients manually
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => router.push("/history")}
          style={s.footerLink}
        >
          <Text style={[s.footerText, { color: colors.textTertiary }]}>
            View scan history
          </Text>
          <Ionicons
            name="chevron-forward"
            size={14}
            color={colors.textTertiary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20 },
  nav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 8 },
  logo: { height: 36, width: 36 },
  logoImg: { height: 36, width: 36 },
  logoText: { fontSize: 17, fontWeight: "600", letterSpacing: -0.3 },
  themeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  center: { flex: 1, justifyContent: "flex-end", paddingBottom: 60 },
  hero: { paddingBottom: 28 },
  heading: {
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -0.8,
    lineHeight: 42,
  },
  sub: { fontSize: 15, lineHeight: 23, marginTop: 12, maxWidth: 320 },
  actions: { gap: 10, paddingBottom: 12 },
  primary: {
    height: 52,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  secondary: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: { fontSize: 16, fontWeight: "500" },
  footerLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 14,
  },
  footerText: { fontSize: 14 },
});
