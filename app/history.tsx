import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, Modal, TextInput  } from "react-native";
import { clearHistory, deleteHistory, getHistory, updateScanName } from "../database/historyDatabase";

type Ingredient = {
  id: number;
  name: string; 
  matched_name?: string | null;
  prediction_details?: {
    carcinogenicity_group?: string;
    confidence?: number | null; 
  };
  confidence?: number | null; // optional top-level confidence
};

// type Scan = {
//   id: number;
//   scan_date: string;
//   ingredients: Ingredient[];
//   ocr_text?: string;
//   api_result?: any;
// };

type Scan = {
  id: number;
  scan_name?: string;
  scan_date: string;
  ingredients: Ingredient[];
  ocr_text?: string;
  api_result?: any;
};

export default function HistoryScreen() {
  const [history, setHistory] = useState<Scan[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const router = useRouter();

  const [editVisible, setEditVisible] = useState(false);
  const [editText, setEditText] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

 const getGroupLabel = (group: string) => {
  const g = String(group).toLowerCase();
  if (g.includes('1')) return 'CARCINOGENIC';
  if (g.includes('2a') || g.includes('2b') || g.includes('2')) return 'LIKELY CARCINOGENIC';
  if (g.includes('3')) return 'NOT LIKELY CARCINOGENIC';
  return 'UNKNOWN';
};


  const getPredictionColor = (prediction?: string) => {
    const safePrediction = String(prediction || "").toLowerCase();
    switch (safePrediction) {
    case 'carcinogenic':
      return '#EF4444'; // Red
    case 'likely carcinogenic':
      return '#F59E0B'; // Orange
    case 'not likely carcinogenic':
      return '#10B981'; // Green
    default:
      return '#6B7280'; // Gray for unknown
    }
  };

  const parseIngredients = (ingredients: string | null): Ingredient[] => {
    if (!ingredients) return [];
    try { return JSON.parse(ingredients); } catch { return []; }
  };

 const handleEditName = (id: number) => {
  setEditingId(id);
  setEditVisible(true);
};

  const loadHistory = () => {
    const data = getHistory();
    const parsed: Scan[] = data.map((item: any) => ({
      id: item.id,
      scan_name: item.scan_name,
      scan_date: item.scan_date,
      ingredients: parseIngredients(item.ingredients),
      ocr_text: item.ocr_text,
      api_result: item.api_result ? JSON.parse(item.api_result) : null
    }));
    setHistory(parsed);
  };

     useEffect(() => { loadHistory(); }, []);

    const saveScanName = () => {
      if (!editText || editingId === null) return;

      updateScanName(editingId, editText);
      setEditVisible(false);
      setEditText("");
      loadHistory();
    };

  const toggleItem = (id: number) => {
    const newSet = new Set(expandedItems);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setExpandedItems(newSet);
  };

  const handleDeleteOne = (id: number) => {
    Alert.alert("Delete Scan", "Delete this scan?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => { deleteHistory(id); loadHistory(); } },
    ]);
  };

  const handleClearAll = () => {
    Alert.alert("Clear History", "Delete all?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear All", style: "destructive", onPress: () => { clearHistory(); setHistory([]); } },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/")} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>History</Text>
        <TouchableOpacity onPress={handleClearAll}>
          <Text style={styles.clearAllText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {history.length > 0 ? (
        <ScrollView style={styles.list}>
          {history.map((scan) => {
            const isExpanded = expandedItems.has(scan.id);
            return (
              <TouchableOpacity
                key={scan.id}
                style={styles.historyCard}
                onPress={() => toggleItem(scan.id)}
                activeOpacity={0.8}
              >
             <View style={styles.scanHeader}>
                <Text style={styles.scanTitle}>
                  {scan.scan_name || `Scan on ${new Date(scan.scan_date).toLocaleString()}`}
                </Text>

                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => handleEditName(scan.id)}
                >
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.scanSubtitle}>
                {scan.ingredients.length} ingredients analyzed
              </Text>

                {isExpanded && scan.ingredients.map((item, idx) => {
                  const isUndetected = !item.matched_name;
                  const group = item.prediction_details?.carcinogenicity_group ?? 'unknown';
                  const label = isUndetected ? 'UNDETECTED' : getGroupLabel(String(group));
                  const color = isUndetected ? '#374151' : getPredictionColor(label);
                  
                  return (
                        <View key={idx} style={styles.ingredientRow}>

                          {/* TOP ROW */}
                          <View style={styles.ingredientTopRow}>
                            <Text style={styles.ingredientName}>
                              {(item.name || "Unknown").toUpperCase()}
                            </Text>
                              <Modal visible={editVisible} transparent animationType="fade">
                                <View style={styles.modalOverlay}>
                                  <View style={styles.modalBox}>
                                    <Text style={styles.modalTitle}>Rename Scan</Text>

                                    <TextInput
                                      style={styles.modalInput}
                                      placeholder="Enter scan name"
                                      placeholderTextColor="#9CA3AF"
                                      value={editText}
                                      onChangeText={setEditText}
                                    />

                                    <View style={styles.modalButtons}>
                                      <TouchableOpacity
                                        style={styles.cancelBtn}
                                        onPress={() => setEditVisible(false)}
                                      >
                                        <Text style={styles.cancelText}>Cancel</Text>
                                      </TouchableOpacity>

                                      <TouchableOpacity
                                        style={styles.saveBtn}
                                        onPress={saveScanName}
                                      >
                                        <Text style={styles.saveText}>Save</Text>
                                      </TouchableOpacity>
                                    </View>
                                  </View>
                                </View>
                              </Modal>
                            <View style={[styles.predictionBadge, { backgroundColor: color }]}>
                              <Text style={styles.predictionText}>{label}</Text>
                            </View>
                          </View>

                          {item.matched_name && (
                            <Text style={styles.matchedName}>Matched to: {item.matched_name}</Text>
                          )}
                        {!isUndetected && (() => {
                          const raw = item.prediction_details?.confidence ?? item.confidence ?? null;
                          if (raw === null || raw === undefined) return null;

                          const num = parseFloat(String(raw)); // convert string or number safely
                          if (isNaN(num)) return null; // skip if not a number

                          const percent = num <= 1 ? num * 100 : num;

                          return (
                            <Text style={styles.detail}>
                              Confidence: {percent.toFixed(1)}%
                            </Text>
                          );
                        })()}
                    </View>
                  );
                })}

                {isExpanded && (
                  <>
                    <TouchableOpacity onPress={() => handleDeleteOne(scan.id)} style={styles.deleteBtnContainer}>
                      <Text style={styles.deleteText}>Delete Scan</Text>
                    </TouchableOpacity>
                  </>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.empty}><Text style={styles.emptyText}>No history found.</Text></View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B1220" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: "#1F2937" },
  backButton: { padding: 8 },
  backText: { color: "#60A5FA", fontWeight: "600" },
  headerTitle: { color: "#F3F4F6", fontSize: 18, fontWeight: "700" },
  clearAllText: { color: "#EF4444", fontWeight: "700" },
  list: { padding: 16 },
  historyCard: { backgroundColor: "#1F2937", borderRadius: 12, padding: 16, marginBottom: 12 },
  scanTitle: { color: "#F3F4F6", fontSize: 15, fontWeight: "700" },
  scanSubtitle: { color: "#9CA3AF", fontSize: 12, marginTop: 2 },
  ingredientName: { color: "#F3F4F6", fontWeight: "600", fontSize: 14, marginBottom: 4 },
  predictionBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: "flex-start" },
  predictionText: { color: "#FFF", fontSize: 10, fontWeight: "800" },
  matchedName: { color: '#9CA3AF', fontSize: 13, fontStyle: 'italic', marginBottom: 4 },
  detail: { color: '#D1D5DB', fontSize: 12, marginTop: 4 },
  deleteBtnContainer: { marginTop: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#374151" },
  deleteText: { color: "#EF4444", fontWeight: "700", textAlign: "center" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#9CA3AF", fontSize: 16 },
  ingredientRow: { marginTop: 12, paddingBottom: 8, borderBottomWidth: 0.5, borderBottomColor: "#374151" },
  viewResultsBtn:{ marginTop:10, backgroundColor:"#0EA5E9", padding:10, borderRadius:8 },
  viewResultsText:{ color:"#fff", fontWeight:"700", textAlign:"center" },
  ingredientTopRow:{
  flexDirection:"row",
  justifyContent:"space-between",
  alignItems:"flex-start"
},
scanHeader:{
  flexDirection:"row",
  justifyContent:"space-between",
  alignItems:"center"
},

editBtn:{
  backgroundColor:"#126db7ff",
  paddingHorizontal:10,
  paddingVertical:4,
  borderRadius:6
},

editText:{
  color:"#fff",
  fontSize:12,
  fontWeight:"600"
},

modalOverlay:{
  flex:1,
  backgroundColor:"rgba(0,0,0,0.6)",
  justifyContent:"center",
  alignItems:"center"
},

modalBox:{
  backgroundColor:"#1F2937",
  padding:20,
  borderRadius:10,
  width:"80%"
},

modalTitle:{
  color:"#F3F4F6",
  fontSize:18,
  fontWeight:"700",
  marginBottom:15
},

modalInput:{
  borderWidth:1,
  borderColor:"#374151",
  borderRadius:8,
  padding:10,
  color:"#fff",
  marginBottom:15
},

modalButtons:{
  flexDirection:"row",
  justifyContent:"flex-end",
  gap:10
},

cancelBtn:{
  padding:8
},

cancelText:{
  color:"#9CA3AF"
},

saveBtn:{
  backgroundColor:"#126db7ff",
  paddingHorizontal:15,
  paddingVertical:8,
  borderRadius:6
},

saveText:{
  color:"#fff",
  fontWeight:"600"
}
});