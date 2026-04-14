import React from 'react';
// Added Image to the imports
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Image, TouchableOpacity } from 'react-native';
import { useTheme } from "../context/ThemeContext"; 
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const infoData = [
  {
    group: '1',
    title: 'Carcinogenic',
    info: 'These substances are known to be carcinogenic to humans based on strong scientific evidence.',
    means: 'Frequent or prolonged exposure may increase cancer risk.',
    // Dynamically assign the image
    image: require("../assets/images/group1_logo.png"),
  },
  {
    group: '2',
    title: 'Possibly Carcinogenic',
    info: 'These substances are possibly or probably carcinogenic to humans. Group 2A and Group 2B classifications are combined into a single category.',
    means: 'Evidence is limited or not conclusive, but caution is advised.',

    image: require("../assets/images/group2_logo.png"),
  },
  {
    group: '3',
    title: 'Not Likely Carcinogenic',
    info: 'These substances are not classifiable as carcinogenic to humans due to insufficient or limited evidence.',
    means: 'There is not enough evidence to determine carcinogenic risk.',
    image: require("../assets/images/group3_logo.png"),
  },
];

export default function Information() {
  const { colors, isDark } = useTheme() as any;
    const router = useRouter();

  
  const themeColors = colors || {
    bg: '#F7F7F7',
    text: '#333',
    textSecondary: '#666',
    card: '#B0C5CC',
    border: '#CCC'
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
       {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
      
        <TouchableOpacity onPress={() => router.push("/")} hitSlop={12} style={{ position: 'absolute', left: 16 }}>
          <Ionicons
            name="chevron-back"
            size={24}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Informmation</Text>
        </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {infoData.map((item, index) => (
          <View key={index} style={[styles.infoCard, { backgroundColor: themeColors.card }]}>
            
            {/* --- LEFT SECTION (BADGE) --- */}
            <View style={styles.leftSection}>
              <View style={[styles.groupBadge, ]}>
                <Image 
                  source={item.image} 
                  style={styles.groupBadgeImage} 
                  resizeMode="contain" 
                />     
              </View>
            </View>

            {/* --- RIGHT SECTION (TEXT CONTENT) --- */}
            <View style={styles.rightSection}>
              <Text style={[styles.title, { color: themeColors.text }]}>{item.title}</Text>
              
              <Text style={[styles.bodyText, { color: themeColors.textSecondary }]}>
                <Text style={[styles.boldLabel, { color: themeColors.text }]}>Information: </Text>
                {item.info}
              </Text>

              <Text style={[styles.bodyText, { color: themeColors.textSecondary }]}>
                <Text style={[styles.boldLabel, { color: themeColors.text }]}>What it means: </Text>
                {item.means}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
   header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    marginBottom: 15,
    marginTop: 25,
  },
  headerTitle: { fontSize: 17, fontWeight: "600", textAlign: "center" },
  clearText: { fontSize: 15, fontWeight: "500" },
  list: { padding: 16, paddingBottom: 40 },
  card: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  
  
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  infoCard: {
    borderRadius: 25,
    padding: 20,
    flexDirection: 'row',
    marginBottom: 15,
    minHeight: 100,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  leftSection: {
    width: '30%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightSection: {
    width: '70%',
    paddingLeft: 12,
  },
  groupBadge: {
    width: 220,
    height: 190,

    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  // Style for the images inside the badge
  groupBadgeImage: {
    width: '65%',
    height: '65%',
  },
  title: { fontSize: 17, fontWeight: 'bold', marginBottom: 8 },
  bodyText: { fontSize: 13, marginBottom: 8, lineHeight: 18 },
  boldLabel: { fontWeight: '700' },
  scannedItems: { fontStyle: 'italic' },
});