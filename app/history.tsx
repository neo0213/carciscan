import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert, Modal, ScrollView, StatusBar, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { clearHistory, deleteHistory, getHistory, updateScanName } from "../database/historyDatabase";
import { useTheme } from "../context/ThemeContext";

type Ingredient = {
  id: number;
  name: string;
  matched_name?: string | null;
  prediction_details?: { carcinogenicity_group?: string; confidence?: number | null };
  confidence?: number | null;
};

type Scan = {
  id: number;
  scan_name?: string;
  scan_date: string;
  ingredients: Ingredient[];
  api_result?: any;
};

export default function HistoryScreen() {
  const [history, setHistory] = useState<Scan[]>([]);
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [editVisible, setEditVisible] = useState(false);
  const [editText, setEditText] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const riskLabel = (group: string) => {
    const g = String(group).toLowerCase();
    if (g.includes("1")) return "Carcinogenic";
    if (g.includes("2a") || g.includes("2b") || g.includes("2")) return "Possibly";
    if (g.includes("3")) return "Not likely";
    return "Unknown";
  };

  const riskStyle = (label: string) => {
    if (label === "Carcinogenic") return { fg: colors.danger, bg: colors.dangerLight };
    if (label === "Possibly") return { fg: colors.warning, bg: colors.warningLight };
    if (label === "Not likely") return { fg: colors.safe, bg: colors.safeLight };
    return { fg: colors.muted, bg: colors.mutedLight };
  };

  const load = () => {
    const data = getHistory();
    setHistory(
      data.map((r: any) => ({
        id: r.id,
        scan_name: r.scan_name,
        scan_date: r.scan_date,
        ingredients: r.ingredients ? JSON.parse(r.ingredients) : [],
        api_result: r.api_result ? JSON.parse(r.api_result) : null,
      })),
    );
  };

  useEffect(load, []);

  const worstRisk = (scan: Scan) => {
    const det = scan.ingredients.filter((i) => !!i.matched_name);
    if (!det.length) return null;
    const labels = det.map((i) => riskLabel(String(i.prediction_details?.carcinogenicity_group ?? "")));
    if (labels.includes("Carcinogenic")) return "Carcinogenic";
    if (labels.includes("Possibly")) return "Possibly";
    return "Not likely";
  };

  const openResult = (scan: Scan) => {
    if (scan.api_result) {
      router.push({
        pathname: "/results",
        params: {
          apiResult: JSON.stringify(scan.api_result),
          resultText: JSON.stringify(scan.api_result, null, 2),
          fromHistory: "true",
        },
      });
    } else if (scan.ingredients.length > 0) {
      // Reconstruct a minimal API result from stored ingredients
      const reconstructed = { ingredients: scan.ingredients };
      router.push({
        pathname: "/results",
        params: {
          apiResult: JSON.stringify(reconstructed),
          resultText: JSON.stringify(reconstructed, null, 2),
          fromHistory: "true",
        },
      });
    }
  };

  return (
    <View style={[s.root, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.push("/")} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.text }]}>History</Text>
        {history.length > 0 ? (
          <TouchableOpacity
            onPress={() =>
              Alert.alert("Clear all?", "This can't be undone.", [
                { text: "Cancel", style: "cancel" },
                { text: "Clear", style: "destructive", onPress: () => { clearHistory(); setHistory([]); } },
              ])
            }
            hitSlop={12}
          >
            <Text style={[s.clearText, { color: colors.danger }]}>Clear</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      {history.length > 0 ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
          {history.map((scan) => {
            const worst = worstRisk(scan);
            const rs = worst ? riskStyle(worst) : null;
            const detected = scan.ingredients.filter((i) => !!i.matched_name);

            return (
              <TouchableOpacity
                key={scan.id}
                activeOpacity={0.7}
                onPress={() => openResult(scan)}
                style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={s.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.scanName, { color: colors.text }]} numberOfLines={1}>
                      {scan.scan_name || new Date(scan.scan_date).toLocaleDateString()}
                    </Text>
                    <Text style={[s.scanMeta, { color: colors.textTertiary }]}>
                      {new Date(scan.scan_date).toLocaleString()} · {detected.length}/{scan.ingredients.length} detected
                    </Text>
                  </View>
                  <View style={s.cardRight}>
                    {rs && worst && (
                      <View style={[s.pill, { backgroundColor: rs.bg }]}>
                        <Text style={[s.pillText, { color: rs.fg }]}>{worst}</Text>
                      </View>
                    )}
                    <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                  </View>
                </View>

                {/* Quick actions row */}
                <View style={[s.cardActions, { borderTopColor: colors.border }]}>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      setEditingId(scan.id);
                      setEditText(scan.scan_name ?? "");
                      setEditVisible(true);
                    }}
                    style={s.cardAction}
                    hitSlop={8}
                  >
                    <Ionicons name="pencil-outline" size={14} color={colors.accent} />
                    <Text style={[s.cardActionText, { color: colors.accent }]}>Rename</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      Alert.alert("Delete?", "Remove this scan?", [
                        { text: "Cancel", style: "cancel" },
                        { text: "Delete", style: "destructive", onPress: () => { deleteHistory(scan.id); load(); } },
                      ]);
                    }}
                    style={s.cardAction}
                    hitSlop={8}
                  >
                    <Ionicons name="trash-outline" size={14} color={colors.danger} />
                    <Text style={[s.cardActionText, { color: colors.danger }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <View style={s.empty}>
          <Text style={[s.emptyTitle, { color: colors.text }]}>No scans yet</Text>
          <Text style={[s.emptyDesc, { color: colors.textTertiary }]}>
            Scan a product label to see results here.
          </Text>
        </View>
      )}

      {/* Rename modal */}
      <Modal visible={editVisible} transparent animationType="fade">
        <View style={[s.overlay, { backgroundColor: colors.overlay }]}>
          <View style={[s.modal, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.modalTitle, { color: colors.text }]}>Rename scan</Text>
            <TextInput
              style={[s.modalInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
              placeholder="Enter a name"
              placeholderTextColor={colors.textTertiary}
              value={editText}
              onChangeText={setEditText}
              autoFocus
            />
            <View style={s.modalBtns}>
              <TouchableOpacity
                onPress={() => { setEditVisible(false); setEditText(""); }}
                style={[s.modalBtn, { borderColor: colors.border, borderWidth: 1 }]}
              >
                <Text style={[s.modalBtnText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (editingId != null && editText) { updateScanName(editingId, editText); }
                  setEditVisible(false); setEditText(""); load();
                }}
                style={[s.modalBtn, { backgroundColor: colors.accent }]}
              >
                <Text style={[s.modalBtnText, { color: "#fff" }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 17, fontWeight: "600" },
  clearText: { fontSize: 15, fontWeight: "500" },
  list: { padding: 16, paddingBottom: 40 },
  card: { borderRadius: 10, borderWidth: 1, marginBottom: 8, overflow: "hidden" },
  cardTop: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  scanName: { fontSize: 16, fontWeight: "600" },
  scanMeta: { fontSize: 14, marginTop: 2 },
  cardRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  pillText: { fontSize: 13, fontWeight: "600" },
  cardActions: {
    flexDirection: "row", gap: 16, paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 1,
  },
  cardAction: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardActionText: { fontSize: 15, fontWeight: "600" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", gap: 8, padding: 32 },
  emptyTitle: { fontSize: 20, fontWeight: "600" },
  emptyDesc: { fontSize: 16, textAlign: "center" },
  overlay: { flex: 1, justifyContent: "center", alignItems: "center" },
  modal: { width: "85%", borderRadius: 14, padding: 20, borderWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: "600", marginBottom: 14 },
  modalInput: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16 },
  modalBtns: { flexDirection: "row", gap: 8 },
  modalBtn: { flex: 1, height: 44, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  modalBtnText: { fontWeight: "600", fontSize: 16 },
});
