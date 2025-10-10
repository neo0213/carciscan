import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, SafeAreaView } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import Entypo from '@expo/vector-icons/Entypo';

export default function ResultsScreen() {
  const { apiResult, resultText } = useLocalSearchParams<{ 
    apiResult?: string; 
    resultText?: string; 
  }>();
  const router = useRouter();
  const [expandedIngredients, setExpandedIngredients] = useState<Set<number>>(new Set());

  const parsedApiResult = apiResult ? JSON.parse(apiResult) : null;

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

  const renderIngredientCard = (ingredient: any, index: number) => {
    const isExpanded = expandedIngredients.has(index);
    const predictionColor = getPredictionColor(ingredient.prediction);
    
    return (
      <TouchableOpacity
        key={index}
        style={styles.ingredientCard}
        onPress={() => toggleIngredient(index)}
        activeOpacity={0.7}
      >
        <View style={styles.ingredientHeader}>
          <View style={styles.ingredientNameContainer}>
            <Text style={styles.ingredientName}>{ingredient.name}</Text>
            <View style={[styles.predictionBadge, { backgroundColor: predictionColor }]}>
              <Text style={styles.predictionText}>{ingredient.prediction}</Text>
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
              <Text style={styles.detailValue}>{(ingredient.confidence * 100).toFixed(1)}%</Text>
            </View>
            {ingredient.properties && Object.keys(ingredient.properties).length > 0 && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Properties:</Text>
                <Text style={styles.detailValue}>{JSON.stringify(ingredient.properties, null, 2)}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

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

      <ScrollView style={styles.content}>
        {parsedApiResult ? (
          <View>
            {parsedApiResult.message && (
              <Text style={styles.resultMessage}>{parsedApiResult.message}</Text>
            )}
            {parsedApiResult.processing_time && (
              <Text style={styles.processingTime}>Processed in {parsedApiResult.processing_time.toFixed(2)}s</Text>
            )}
            
            {parsedApiResult.ingredients && parsedApiResult.ingredients.length > 0 && (
              <View style={styles.ingredientsSection}>
                <Text style={styles.sectionTitle}>Ingredients Analysis</Text>
                {parsedApiResult.ingredients.map((ingredient: any, index: number) => 
                  renderIngredientCard(ingredient, index)
                )}
              </View>
            )}
            
            {parsedApiResult.ocr_result && (
              <View style={styles.ocrSection}>
                <Text style={styles.sectionTitle}>OCR Text</Text>
                <Text style={styles.ocrText}>{parsedApiResult.ocr_result.text}</Text>
              </View>
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
  predictionBadge: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 16 
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
    flex: 1 
  },
  ocrSection: { 
    marginBottom: 24 
  },
  ocrText: { 
    color: "#D1D5DB", 
    fontSize: 14, 
    backgroundColor: "#1F2937", 
    padding: 16, 
    borderRadius: 8, 
    fontFamily: "monospace",
    lineHeight: 20
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
