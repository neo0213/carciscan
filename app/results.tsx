import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Linking,
  Platform, ScrollView, StatusBar, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ErrorBanner } from "../components/ErrorBanner";
import { insertHistory } from "../database/historyDatabase";
import { useTheme } from "../context/ThemeContext";

export default function ResultsScreen() {
  const { apiResult, resultText, fromHistory } = useLocalSearchParams<{ apiResult?: string; resultText?: string; fromHistory?: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [showUndetected, setShowUndetected] = useState(false);
  const [ocrText, setOcrText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reanalyzeError, setReanalyzeError] = useState<string | null>(null);

  const parsed = apiResult ? JSON.parse(apiResult) : null;

  useEffect(() => {
    if (parsed?.ocr_result?.text) setOcrText(parsed.ocr_result.text);
  }, [apiResult]);

  useEffect(() => {
    if (parsed?.ingredients && !saved && fromHistory !== "true") {
      try {
        insertHistory(
          parsed.ingredients,
          parsed.ocr_result?.text ?? null,
          parsed,
        );
      } catch {}
      setSaved(true);
    }
  }, [parsed, saved, fromHistory]);

  const toggle = (i: number) => {
    const s = new Set(expanded);
    s.has(i) ? s.delete(i) : s.add(i);
    setExpanded(s);
  };

  // Risk helpers
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

  // Summary
  const getSummary = () => {
    if (!parsed?.ingredients) return null;
    const det = parsed.ingredients.filter((i: any) => !!i.matched_name);
    if (!det.length) return null;
    const labels = det.map((i: any) => riskLabel(String(i?.prediction_details?.carcinogenicity_group ?? "")));
    if (labels.includes("Carcinogenic")) return { level: "High risk", desc: "Carcinogenic substances found", ...riskStyle("Carcinogenic") };
    if (labels.includes("Possibly")) return { level: "Moderate risk", desc: "Possibly carcinogenic substances found", ...riskStyle("Possibly") };
    return { level: "Low risk", desc: "No carcinogenic substances detected", ...riskStyle("Not likely") };
  };

  const summary = getSummary();

  const renderCard = (item: any, idx: number) => {
    const isOpen = expanded.has(idx);
    const group = item?.prediction_details?.carcinogenicity_group ?? item?.status ?? "Unknown";
    const label = riskLabel(String(group));
    const rs = riskStyle(label);

    return (
      <TouchableOpacity
        key={idx}
        onPress={() => toggle(idx)}
        activeOpacity={0.7}
        style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <View style={st.cardTop}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[st.name, { color: colors.text }]} numberOfLines={1}>
              {String(item.name)}
            </Text>
            {item.matched_name && (
              <Text style={[st.matched, { color: colors.textTertiary }]}>
                Matched: {item.matched_name}
              </Text>
            )}
          </View>
          <View style={[st.pill, { backgroundColor: rs.bg }]}>
            <Text style={[st.pillText, { color: rs.fg }]}>{label}</Text>
          </View>
        </View>

        {isOpen && (
          <View style={[st.details, { borderTopColor: colors.border }]}>
            {(() => {
              const raw = item?.prediction_details?.confidence ?? item?.confidence;
              if (raw == null) return null;
              const pct = (Number(raw) <= 1 ? Number(raw) * 100 : Number(raw)).toFixed(1);
              return (
                <View style={st.detailRow}>
                  <Text style={[st.detailLabel, { color: colors.text }]}>Confidence</Text>
                  <View style={st.barTrack}>
                    <View style={[st.barFill, { width: `${pct}%` as any, backgroundColor: rs.fg }]} />
                  </View>
                  <Text style={[st.detailVal, { color: colors.text }]}>{pct}%</Text>
                </View>
              );
            })()}
            {item?.prediction_details?.evidence && (
              <View style={st.detailRow}>
                <Text style={[st.detailLabel, { color: colors.text }]}>Evidence</Text>
                <Text style={[st.detailVal, { color: colors.text, flex: 1 }]}>
                  {item.prediction_details.evidence}
                </Text>
              </View>
            )}
            {item?.pubchem_url && (
              <TouchableOpacity
                style={st.detailRow}
                onPress={() => {
                  const u = String(item.pubchem_url).startsWith("http") ? item.pubchem_url : `https://${item.pubchem_url}`;
                  Linking.openURL(u).catch(() => {});
                }}
              >
                <Text style={[st.detailLabel, { color: colors.text }]}>PubChem</Text>
                <Text style={[st.detailVal, { color: colors.accent }]} numberOfLines={1}>
                  View →
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const reanalyze = async () => {
    if (!ocrText.trim()) { setReanalyzeError("Please enter some text to analyze."); return; }
    setReanalyzeError(null);
    try {
      setSubmitting(true);
      const base = process.env.EXPO_PUBLIC_API_URL || "https://carciscan.edwardgarcia.site/";
      const url = new URL(Platform.OS === "android" ? base.replace("http://localhost", "http://10.0.2.2") : base);
      if (!/\/api\/v2\/text\/?$/.test(url.pathname)) url.pathname = url.pathname.replace(/\/?$/, "/api/v2/text");
      const c = new AbortController(); const id = setTimeout(() => c.abort(), 60_000);
      const res = await fetch(url.toString(), { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" }, body: JSON.stringify({ ingredients: ocrText }), signal: c.signal });
      clearTimeout(id);
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || "Failed");
        router.replace({ pathname: "/results", params: { apiResult: JSON.stringify(json), resultText: JSON.stringify(json, null, 2) } });
      } else {
        const t = await res.text();
        if (!res.ok) throw new Error(t || "Failed");
        router.replace({ pathname: "/results", params: { resultText: t } });
      }
    } catch (e: any) { setReanalyzeError(e?.message ?? "Something went wrong. Try again."); } finally { setSubmitting(false); }
  };

  return (
    <View style={[st.root, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <View style={[st.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[st.headerTitle, { color: colors.text }]}>Results</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {parsed ? (
          <>
            {/* Summary */}
            {summary && (
              <View style={[st.summary, { backgroundColor: summary.bg, borderColor: summary.bg }]}>
                <View style={st.summaryRow}>
                  <Text style={[st.summaryLevel, { color: summary.fg }]}>{summary.level}</Text>
                  {parsed.processing_time != null && (
                    <Text style={[st.time, { color: colors.textTertiary }]}>
                      {parsed.processing_time.toFixed(2)}s
                    </Text>
                  )}
                </View>
                <Text style={[st.summaryDesc, { color: summary.fg }]}>{summary.desc}</Text>
                {parsed.practical_advice?.category_advice && (
                  <Text style={[st.advice, { color: colors.textSecondary }]}>
                    {parsed.practical_advice.category_advice}
                  </Text>
                )}
              </View>
            )}

            {(!parsed.ingredients || parsed.ingredients.length === 0) && (
              <View style={[st.noneBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[st.noneTitle, { color: colors.text }]}>No ingredients found</Text>
                <Text style={[st.noneDesc, { color: colors.textSecondary }]}>
                  We couldn't extract any ingredients from your input. Try re-scanning with better lighting, or enter the ingredients manually.
                </Text>
              </View>
            )}

            {parsed.ingredients?.length > 0 && (() => {
              const pri = (i: any) => {
                const g = String(i?.prediction_details?.carcinogenicity_group ?? "").toLowerCase();
                if (g.includes("1")) return 0;
                if (g.includes("2a")) return 1;
                if (g.includes("2b") || g.includes("2")) return 2;
                if (g.includes("3")) return 3;
                return 4;
              };
              const detected = parsed.ingredients.filter((i: any) => !!i.matched_name).sort((a: any, b: any) => pri(a) - pri(b));
              const undetected = parsed.ingredients.filter((i: any) => !i.matched_name);

              return (
                <>
                  {detected.length === 0 && undetected.length > 0 && (
                    <View style={[st.noneBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <Text style={[st.noneTitle, { color: colors.text }]}>No matches found</Text>
                      <Text style={[st.noneDesc, { color: colors.textSecondary }]}>
                        None of the {undetected.length} detected ingredient{undetected.length !== 1 ? "s" : ""} matched our database. They may be listed under different names — try entering them manually with alternate spellings.
                      </Text>
                      <TouchableOpacity
                        onPress={() => setShowUndetected((p) => !p)}
                        style={st.noneToggle}
                      >
                        <Text style={[st.noneToggleText, { color: colors.accent }]}>
                          {showUndetected ? "Hide" : "Show"} ingredients
                        </Text>
                        <Ionicons name={showUndetected ? "chevron-up" : "chevron-down"} size={14} color={colors.accent} />
                      </TouchableOpacity>
                      {showUndetected && (
                        <View style={st.noneList}>
                          {undetected.map((item: any, idx: number) => (
                            <Text key={idx} style={[st.noneItem, { color: colors.textSecondary, borderBottomColor: colors.border }]}>
                              {String(item.name)}
                            </Text>
                          ))}
                        </View>
                      )}
                    </View>
                  )}

                  {detected.length > 0 && (
                    <View style={st.section}>
                      <View style={st.sectionHead}>
                        <Text style={[st.sectionTitle, { color: colors.text }]}>Detected ingredients</Text>
                        <Text style={[st.count, { color: colors.textTertiary }]}>{detected.length}</Text>
                      </View>
                      {detected.map((item: any, idx: number) => renderCard(item, idx))}
                    </View>
                  )}

                  {detected.length > 0 && undetected.length > 0 && (
                    <View style={st.section}>
                      <TouchableOpacity
                        style={[st.collapseHead, { borderColor: colors.border }]}
                        onPress={() => setShowUndetected((p) => !p)}
                      >
                        <Text style={[st.sectionTitle, { color: colors.textSecondary }]}>
                          Not in database
                        </Text>
                        <View style={st.collapseRight}>
                          <Text style={[st.count, { color: colors.textTertiary }]}>{undetected.length}</Text>
                          <Ionicons name={showUndetected ? "chevron-up" : "chevron-down"} size={16} color={colors.textTertiary} />
                        </View>
                      </TouchableOpacity>
                      {showUndetected && undetected.map((item: any, idx: number) => (
                        <View key={idx} style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                          <Text style={[st.name, { color: colors.textSecondary }]}>{String(item.name)}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              );
            })()}

            {/* OCR edit */}
            {parsed.ocr_result && (
              <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={90}>
                <View style={st.section}>
                  <Text style={[st.sectionTitle, { color: colors.text, marginBottom: 8 }]}>OCR text</Text>
                  {reanalyzeError && <ErrorBanner message={reanalyzeError} onDismiss={() => setReanalyzeError(null)} />}
                  <View style={[st.ocrBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <TextInput
                      style={[st.ocrInput, { color: colors.text }]}
                      value={ocrText}
                      onChangeText={setOcrText}
                      multiline
                      textAlignVertical="top"
                      placeholderTextColor={colors.textTertiary}
                    />
                    <View style={[st.ocrFooter, { borderTopColor: colors.border }]}>
                      <TouchableOpacity
                        onPress={reanalyze}
                        disabled={submitting}
                        style={[st.reBtn, { backgroundColor: colors.accent }]}
                      >
                        {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={st.reBtnText}>Re-analyze</Text>}
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </KeyboardAvoidingView>
            )}
          </>
        ) : resultText ? (
          <View style={[st.rawBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[st.rawLabel, { color: colors.textSecondary }]}>Raw response</Text>
            <Text style={[st.rawText, { color: colors.textTertiary }]}>{resultText}</Text>
          </View>
        ) : (
          <View style={st.empty}>
            <Text style={[st.emptyText, { color: colors.textTertiary }]}>No results</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 17, fontWeight: "600" },
  scroll: { padding: 16, paddingBottom: 48 },

  // Summary
  summary: { borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLevel: { fontSize: 22, fontWeight: "700" },
  time: { fontSize: 14 },
  summaryDesc: { fontSize: 16, marginTop: 4 },
  advice: { fontSize: 15, marginTop: 8, lineHeight: 22 },

  // No results
  noneBox: {
    borderRadius: 12, borderWidth: 1, padding: 20, marginBottom: 20,
  },
  noneTitle: { fontSize: 18, fontWeight: "600", marginBottom: 6 },
  noneDesc: { fontSize: 15, lineHeight: 23 },
  noneToggle: {
    flexDirection: "row", alignItems: "center", gap: 4, marginTop: 14,
  },
  noneToggleText: { fontSize: 15, fontWeight: "600" },
  noneList: { marginTop: 10, gap: 0 },
  noneItem: {
    fontSize: 15, paddingVertical: 8,
    borderBottomWidth: 1,
  },

  // Sections
  section: { marginBottom: 20 },
  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "600" },
  count: { fontSize: 15 },
  collapseHead: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, marginBottom: 6,
  },
  collapseRight: { flexDirection: "row", alignItems: "center", gap: 6 },

  // Cards
  card: { borderRadius: 10, borderWidth: 1, marginBottom: 6, overflow: "hidden" },
  cardTop: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  name: { fontSize: 16, fontWeight: "500" },
  matched: { fontSize: 14 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  pillText: { fontSize: 13, fontWeight: "600" },
  details: { paddingHorizontal: 14, paddingBottom: 14, paddingTop: 10, borderTopWidth: 1, gap: 10 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailLabel: { fontSize: 14, width: 84, fontWeight: "600" },
  detailVal: { fontSize: 15, fontWeight: "600" },
  barTrack: { flex: 1, height: 4, borderRadius: 2, backgroundColor: "rgba(128,128,128,0.15)", overflow: "hidden" },
  barFill: { height: 4, borderRadius: 2 },

  // OCR
  ocrBox: { borderRadius: 10, borderWidth: 1, overflow: "hidden" },
  ocrInput: { fontSize: 15, lineHeight: 22, padding: 14, minHeight: 100 },
  ocrFooter: { flexDirection: "row", justifyContent: "flex-end", padding: 10, borderTopWidth: 1 },
  reBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  reBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },

  // Raw
  rawBox: { borderRadius: 10, borderWidth: 1, padding: 14 },
  rawLabel: { fontSize: 15, fontWeight: "600", marginBottom: 8 },
  rawText: { fontSize: 14, fontFamily: "monospace" },

  empty: { paddingVertical: 80, alignItems: "center" },
  emptyText: { fontSize: 16 },
});
