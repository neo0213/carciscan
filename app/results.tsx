import { Ionicons } from "@expo/vector-icons";
import Entypo from '@expo/vector-icons/Entypo';
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Linking, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function ResultsScreen() {
  const { apiResult, resultText } = useLocalSearchParams<{ 
    apiResult?: string; 
    resultText?: string; 
  }>();
  const router = useRouter();
  const [expandedIngredients, setExpandedIngredients] = useState<Set<number>>(new Set());

  const parsedApiResult = apiResult ? JSON.parse(apiResult) : null;
  const [ocrTextEditable, setOcrTextEditable] = useState<string>(parsedApiResult?.ocr_result?.text ?? '');
  const [isSubmittingText, setIsSubmittingText] = useState(false);

  const toggleIngredient = (index: number) => {
    const newExpanded = new Set(expandedIngredients);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedIngredients(newExpanded);
  };

  const getPredictionColor = (prediction: string) => {
    switch (prediction.toLowerCase()) {
      case 'carcinogenic': return '#EF4444';
      case 'non-carcinogenic': return '#10B981';
      case 'unknown': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getGroupBadgeColor = (group: string) => {
    const g = String(group).toLowerCase();
    if (g.includes('1')) return '#EF4444';
    if (g.includes('2b') || g.includes('2b'.toLowerCase()) || g.includes('2')) return '#F59E0B';
    if (g.includes('3')) return '#10B981';
    return '#6B7280';
  };

  const renderIngredientCard = (ingredient: any, index: number) => {
    const isExpanded = expandedIngredients.has(index);
    // New API returns prediction details under `prediction_details`
    const group = ingredient?.prediction_details?.carcinogenicity_group ?? ingredient?.status ?? 'Unknown';
    const prediction = String(group);
    const predictionColor = getGroupBadgeColor(prediction);
    
    return (
      <TouchableOpacity
        key={index}
        style={styles.ingredientCard}
        onPress={() => toggleIngredient(index)}
        activeOpacity={0.7}
      >
        <View style={styles.ingredientHeader}>
          <View style={styles.ingredientNameContainer}>
            <View style={{flex:1}}>
              <Text style={styles.ingredientName}>{String(ingredient.name).toUpperCase()}</Text>
              {ingredient.matched_name ? (
                <Text style={styles.matchedName}>({ingredient.matched_name})</Text>
              ) : null}
            </View>
            <View style={[styles.predictionBadge, { backgroundColor: predictionColor }]}>
              <Text style={styles.predictionText}>{String(prediction).toUpperCase()}</Text>
            </View>
          </View>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#9CA3AF" 
          />
        </View>
        
        {isExpanded && (
          <View style={styles.ingredientDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Confidence:</Text>
              {
                (() => {
                  const raw = ingredient?.prediction_details?.confidence ?? ingredient?.confidence ?? null;
                  if (raw === null || raw === undefined) return <Text style={styles.detailValue}>N/A</Text>;
                  const num = Number(raw);
                  const percent = num <= 1 ? (num * 100) : num; // support 0-1 or 0-100
                  return <Text style={styles.detailValue}>{percent.toFixed(1)}%</Text>;
                })()
              }
            </View>

            {ingredient?.prediction_details?.evidence && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Evidence:</Text>
                <Text style={styles.detailValue}>{ingredient.prediction_details.evidence}</Text>
              </View>
            )}

            {ingredient?.matched_name && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Matched name:</Text>
                <Text style={styles.detailValue}>{ingredient.matched_name}</Text>
              </View>
            )}

            {ingredient?.pubchem_url && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>PubChem:</Text>
                <TouchableOpacity onPress={() => openLink(ingredient.pubchem_url)} accessibilityRole="link" style={{flex: 1}}>
                  <Text
                    style={[styles.detailValue, styles.linkText]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {ingredient.pubchem_url}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  async function submitEditedText() {
    if (!ocrTextEditable || ocrTextEditable.trim().length === 0) {
      Alert.alert('Validation', 'Please enter text to analyze.');
      return;
    }

    try {
      setIsSubmittingText(true);
      const rawEnv = process.env.EXPO_PUBLIC_API_URL || 'https://carciscan-api-production.up.railway.app/';
      const endpoint = normalizePredictTextUrl(rawEnv);
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 60_000);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: ocrTextEditable }),
        signal: controller.signal
      });
      clearTimeout(id);

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || 'Request failed');
        router.replace({ pathname: '/results', params: { apiResult: JSON.stringify(json), resultText: JSON.stringify(json, null, 2) } });
      } else {
        const text = await res.text();
        if (!res.ok) throw new Error(text || 'Request failed');
        router.replace({ pathname: '/results', params: { resultText: text } });
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Please try again.');
    } finally {
      setIsSubmittingText(false);
    }
  }

  const openLink = async (url?: string) => {
    if (!url) return;
    try {
      const u = String(url).startsWith('http') ? url : `https://${url}`;
      await Linking.openURL(u);
    } catch (e) {
      Alert.alert('Unable to open link');
    }
  };

  function normalizePredictTextUrl(input: string) {
    try {
      const url = new URL(translateLocalhostForEmulator(input));
      if (!/\/api\/v1\/predict\/predict-text\/?$/.test(url.pathname)) {
        url.pathname = url.pathname.replace(/\/?$/, '/api/v1/predict/predict-text');
      }
      return url.toString();
    } catch {
      return input;
    }
  }

  function translateLocalhostForEmulator(input: string) {
    if (Platform.OS === 'android') {
      return input.replace('http://localhost', 'http://10.0.2.2').replace('http://127.0.0.1', 'http://10.0.2.2');
    }
    return input;
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
        <Text style={styles.headerTitle}>Analysis Results</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {parsedApiResult ? (
          <View>
            {parsedApiResult.practical_advice && (
              <View style={styles.adviceCard}>
                <Text style={styles.adviceTitle}>Practical Advice</Text>
                {Array.isArray(parsedApiResult.practical_advice?.route_advice) ? (
                  parsedApiResult.practical_advice.route_advice.map((line: string, i: number) => (
                    <Text key={i} style={styles.adviceLine}>{line}</Text>
                  ))
                ) : (
                  <Text style={styles.adviceLine}>{parsedApiResult.practical_advice?.iarc_definition ?? ''}</Text>
                )}
              </View>
            )}

            <Text style={styles.analysisComplete}>Analysis complete.</Text>
            {parsedApiResult.processing_time && (
              <Text style={styles.processingTime}>Processed in {parsedApiResult.processing_time.toFixed(2)}s</Text>
            )}

            {parsedApiResult.ingredients && parsedApiResult.ingredients.length > 0 && (() => {
              const all = parsedApiResult.ingredients || [];
              const detected = all.filter((i: any) => !!i.matched_name);
              const undetected = all.filter((i: any) => !i.matched_name);

              return (
                <>
                  {detected.length > 0 && (
                    <View style={styles.ingredientsSection}>
                      <Text style={styles.sectionTitle}>Detected Ingredients</Text>
                      {detected.map((ingredient: any, index: number) => renderIngredientCard(ingredient, index))}
                    </View>
                  )}

                  {undetected.length > 0 && (
                    <View style={styles.ingredientsSection}>
                      <Text style={styles.sectionTitle}>Undetected Ingredients</Text>
                      {undetected.map((ingredient: any, index: number) => (
                        <View key={index} style={styles.ingredientCard}>
                          <View style={styles.ingredientHeader}>
                            <View style={styles.ingredientNameContainer}>
                              <View style={{flex:1}}>
                                <Text style={styles.ingredientName}>{String(ingredient.name).toUpperCase()}</Text>
                                {ingredient.matched_name ? <Text style={styles.matchedName}>({ingredient.matched_name})</Text> : null}
                              </View>
                              <View style={styles.undetectedBadge}>
                                <Text style={styles.undetectedBadgeText}>SYNONYM NOT FOUND IN DATABASE</Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              );
            })()}

            {parsedApiResult.ocr_result && (
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}
                style={styles.ocrSection}
              >
                <Text style={styles.sectionTitle}>OCR Text</Text>
                <TextInput
                  style={styles.ocrTextInput}
                  value={ocrTextEditable}
                  onChangeText={setOcrTextEditable}
                  multiline
                  textAlignVertical="top"
                />

                <View style={{marginTop: 12, flexDirection: 'row', justifyContent: 'flex-end'}}>
                  <TouchableOpacity style={[styles.buttonSmall, styles.primarySmall]} onPress={submitEditedText} disabled={isSubmittingText}>
                    {isSubmittingText ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonSmallText}>Re-analyze text</Text>}
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            )}
          </View>
        ) : resultText ? (
          <View style={styles.rawResultBox}>
            <Text style={styles.rawResultTitle}>Raw API Response</Text>
            <Text style={styles.rawResultText}>{resultText}</Text>
          </View>
        ) : (
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>No analysis results available</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#0B1220" 
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#1F2937",
    backgroundColor: "#0B1220"
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
  content: {
    flex: 1,
    padding: 16
  },
  resultMessage: { 
    color: "#D1D5DB", 
    fontSize: 16,
    marginBottom: 8,
    textAlign: "center"
  },
  processingTime: { 
    color: "#9CA3AF", 
    fontSize: 14, 
    marginBottom: 24,
    textAlign: "center"
  },
  ingredientsSection: { 
    marginBottom: 24 
  },
  sectionTitle: { 
    color: "#E5E7EB", 
    fontWeight: "600", 
    fontSize: 20, 
    marginBottom: 16 
  },
  adviceCard: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#0F1724'
  },
  adviceTitle: {
    color: '#F3F4F6',
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 8
  },
  adviceLine: {
    color: '#D1D5DB',
    fontSize: 14,
    marginBottom: 8
  },
  analysisComplete: {
    color: '#E5E7EB',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 4
  },
  buttonSmall: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  primarySmall: { backgroundColor: '#0EA5E9' },
  buttonSmallText: { color: '#fff', fontWeight: '600' },
  ingredientCard: { 
    backgroundColor: "#1F2937", 
    borderRadius: 12, 
    marginBottom: 12, 
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  ingredientHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center" 
  },
  ingredientNameContainer: { 
    flex: 1, 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 12 
  },
  ingredientName: { 
    color: "#F3F4F6", 
    fontWeight: "600", 
    fontSize: 16, 
    flex: 1 
  },
  matchedName: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 4
  },
  predictionBadge: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 16,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center'
  },
  predictionText: { 
    color: "#FFFFFF", 
    fontSize: 12, 
    fontWeight: "700" 
  },
  ingredientDetails: { 
    marginTop: 12, 
    paddingTop: 12, 
    borderTopWidth: StyleSheet.hairlineWidth, 
    borderTopColor: "#374151" 
  },
  detailRow: { 
    flexDirection: "row", 
    marginBottom: 8 
  },
  detailLabel: { 
    color: "#9CA3AF", 
    fontSize: 14, 
    fontWeight: "600", 
    minWidth: 100 
  },
  detailValue: { 
    color: "#D1D5DB", 
    fontSize: 14, 
    flex: 1,
    flexShrink: 1,
    flexWrap: 'wrap'
  },
  linkText: {
    color: '#60A5FA',
    textDecorationLine: 'underline',
    flexShrink: 1,
    flexWrap: 'wrap'
  },
  ocrSection: { 
    marginBottom: 24 
  },
  ocrTextInput: {
    color: "#D1D5DB",
    fontSize: 14,
    backgroundColor: "#1F2937",
    padding: 12,
    borderRadius: 8,
    fontFamily: "monospace",
    lineHeight: 20,
    minHeight: 120
  },
  undetectedBadge: {
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 140
  },
  undetectedBadgeText: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '700'
  },
  rawResultBox: {
    backgroundColor: "#1F2937",
    borderRadius: 8,
    padding: 16
  },
  rawResultTitle: {
    color: "#E5E7EB",
    fontWeight: "600",
    fontSize: 16,
    marginBottom: 8
  },
  rawResultText: {
    color: "#D1D5DB",
    fontSize: 12,
    fontFamily: "monospace"
  },
  noResults: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 48
  },
  noResultsText: {
    color: "#9CA3AF",
    fontSize: 16
  }
});
