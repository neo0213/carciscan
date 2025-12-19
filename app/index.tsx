import { Link } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Index() {
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.title}>CarciScan</Text>
        <Text style={styles.subtitle}>Scan labels — detect potential carcinogens</Text>
      </View>

      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Analyze a product label</Text>
          <Text style={styles.cardText}>Quickly capture a label and get ingredient analysis with practical advice.</Text>

          <View style={styles.actionsRow}>
            <Link href="/scan" style={[styles.actionButtonLarge, styles.primary]} asChild>
              <TouchableOpacity accessibilityLabel="Start scan">
                <Text style={styles.actionText}>Start Scan</Text>
              </TouchableOpacity>
            </Link>

            <Link href="/text-entry" style={[styles.actionButtonLarge, styles.secondaryOutline]} asChild>
              <TouchableOpacity accessibilityLabel="Enter text">
                <Text style={styles.actionTextSecondary}>Enter Text</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1220', padding: 20 },
  hero: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { color: '#F3F4F6', fontSize: 36, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: '#9CA3AF', marginTop: 8, textAlign: 'center' },
  cardContainer: { paddingBottom: 40 },
  card: { backgroundColor: '#0F1724', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  cardTitle: { color: '#E5E7EB', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  cardText: { color: '#9CA3AF', marginBottom: 16 },
  actionsRow: { flexDirection: 'column', gap: 5 },
  actionButtonLarge: { width: '100%', height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  actionButton: { flex: 1, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  primary: { backgroundColor: '#126db7ff' },
  secondaryOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#374151' },
  actionText: { color: '#ffffff', fontWeight: '800', fontSize: 16 },
  actionTextSecondary: { color: '#E5E7EB', fontWeight: '700', fontSize: 16 },
  infoRow: { marginTop: 20, alignItems: 'center' },
  info: { color: '#6B7280' }
});
