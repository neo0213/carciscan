import { Text, View, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Link } from "expo-router";

export default function Index() {
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        {/* <Image source={require("../assets/images/react-logo.png")} style={styles.logo} /> */}
        <Text style={styles.title}>CarciScan</Text>
        <Text style={styles.subtitle}>Carcinogenicity Detection via Label OCR + XGBoost</Text>
      </View>
      <View style={styles.content}>
      <View style={styles.card}>
        <Text style={styles.cardText}>Capture a product label to analyze ingredients for potential carcinogens.</Text>
        <Link href="/scan" asChild>
          <TouchableOpacity style={styles.cta} accessibilityLabel="Start scan">
            <Text style={styles.ctaText}>Start Scan</Text>
          </TouchableOpacity>
        </Link>
      </View>
      <Text style={styles.footer}>Paddle OCR-powered extraction</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#F7FBFF", justifyContent: "space-between" },
  hero: { alignItems: "center", marginTop: 80, marginBottom: 24, flex: 2, justifyContent: "center" },
  content: { flex: 1 },
  logo: { width: 96, height: 96, marginBottom: 16, opacity: 0.85, resizeMode: "contain" },
  title: { fontSize: 36, fontWeight: "800", color: "#0B4C8C" },
  subtitle: { fontSize: 14, color: "#4B5563", marginTop: 6, textAlign: "center" },
  card: { backgroundColor: "#ffffff", borderRadius: 16, padding: 20, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  cardText: { fontSize: 16, color: "#1F2937", marginBottom: 16 },
  cta: { backgroundColor: "#0EA5E9", height: 52, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  ctaText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  footer: { textAlign: "center", color: "#6B7280", marginTop: 24 }
});
