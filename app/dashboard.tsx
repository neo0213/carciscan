import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, StatusBar } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router'; 
import { getHistory } from '../database/historyDatabase';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext"; 

export default function Dashboard() {
  const { colors, isDark, toggle } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [stats, setStats] = useState({
    totalItems: 0,
    carcinogenicCount: 0,
    possiblyCount: 0,
    notCarcinogenicCount: 0,
    riskPercentage: 0,
    mostCommonGroup1: "None",
    mostCommonGroup2: "None",
    highRiskItem: { name: "None", count: 0 }
  });

  useFocusEffect(
    useCallback(() => {
      const data = getHistory();
      calculateStats(data);
    }, [])
  );

  const calculateStats = (data: any[]) => {
    if (!data || data.length === 0) {
      setStats({
        totalItems: 0,
        carcinogenicCount: 0,
        possiblyCount: 0,
        notCarcinogenicCount: 0,
        riskPercentage: 0,
        mostCommonGroup1: "None",
        mostCommonGroup2: "None",
        highRiskItem: { name: "None", count: 0 }
      });
      return;
    }

    let totalScans = data.length;
    let riskyScansCount = 0; 
    let group1Total = 0; 
    let group2Total = 0; 
    let group3Total = 0; 
    const group1Map: Record<string, number> = {};
    const group2Map: Record<string, number> = {};
    let highestRisk = { name: "N/A", count: 0 };

    data.forEach(item => {
      const fullResult = JSON.parse(item.api_result || '{}');
      const ingredients = fullResult.ingredients || [];
      const detectedIngredients = ingredients.filter((ing: any) => !!ing.matched_name);

      let itemRiskCount = 0;
      let isThisProductRisky = false;

      detectedIngredients.forEach((ing: any) => {
        const group = String(ing?.prediction_details?.carcinogenicity_group ?? "").toLowerCase();
        if (group.includes("1")) {
          group1Total++;
          itemRiskCount++;
          isThisProductRisky = true;
          group1Map[ing.name] = (group1Map[ing.name] || 0) + 1;
        } 
        else if (group.includes("2")) {
          group2Total++;
          itemRiskCount++;
          isThisProductRisky = true;
          group2Map[ing.name] = (group2Map[ing.name] || 0) + 1;
        }
        else if (group.includes("3")) {
          group3Total++;
        }
      });

      if (isThisProductRisky) riskyScansCount++;
      if (itemRiskCount > highestRisk.count) {
        highestRisk = { name: item.scan_name || "Unknown Product", count: itemRiskCount };
      }
    });

    const getMax = (map: Record<string, number>): string => {
      const keys = Object.keys(map);
      return keys.length === 0 ? "None" : keys.reduce((a, b) => (map[a] > map[b] ? a : b));
    };


  // IMPORTANT: Set state with values directly from your local variables
  // rather than relying on previous state references
  setStats({
    totalItems: totalScans,
    carcinogenicCount: group1Total,
    possiblyCount: group2Total,
    notCarcinogenicCount: group3Total,
    riskPercentage: totalScans > 0 ? Math.min(Math.round((riskyScansCount / totalScans) * 100), 100) : 0,
    mostCommonGroup1: getMax(group1Map),
    mostCommonGroup2: getMax(group2Map),
    highRiskItem: highestRisk
  });
};
  // SVG Logic
    const size = 120;
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    // Use stats.riskPercentage directly here
    const strokeDashoffset = circumference - (circumference * stats.riskPercentage) / 100;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* --- HEADER --- */}
      <View style={styles.nav}>
        <View style={styles.brand}>
          <Image source={require("../assets/images/logo.png")} style={styles.logoImg} resizeMode="contain" />
          <Text style={[styles.logoText, { color: colors.text }]}>CarciScan</Text>
        </View>
        <TouchableOpacity onPress={toggle} style={styles.themeBtn} hitSlop={12}>
          <Ionicons name={isDark ? "sunny-outline" : "moon-outline"} size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* --- HERO TEXT --- */}
        <View style={[styles.hero, {marginTop: 10}]}>
          <Text style={[styles.heading, { color: colors.text }]}>
            Scan Household Hazardous products for carcinogenicity prediction.
          </Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>
                      Capture or upload an ingredient label, or enter ingredients manually
                      to check for potential carcinogens.
          </Text>

        </View>

        {/* --- DETAILED BREAKDOWN --- */}
        <View style={[styles.breakdownContainer, { 
            backgroundColor: colors.surface, 
            shadowColor: isDark ? '#000' : '#888' 
        }]}>
          <View style={styles.breakdownItem}>
            <Text style={[styles.breakdownNumber, { color: colors.danger ?? '#B22222' }]}>{stats.carcinogenicCount}</Text>
            <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Carcinogenic</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text style={[styles.breakdownNumber, { color: colors.warning ?? '#FF8C00' }]}>{stats.possiblyCount}</Text>
            <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Possibly</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text style={[styles.breakdownNumber, { color: colors.safe ?? '#2E8B57' }]}>{stats.notCarcinogenicCount}</Text>
            <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Not likely</Text> 
          </View>
        </View>

        {/* --- DYNAMIC STATS CARD --- */}
        <View style={[styles.mainStatsCard, { backgroundColor: colors.containerLight1 ?? '#9B86BD' }]}>
          <View style={styles.statsLeft}>
            <Text style={[styles.percentageText, { color: colors.text }]}>{stats.riskPercentage}%</Text>
            <Text style={[styles.subLabel, { color: colors.textSecondary }]}>Contains Carcinogen Risk</Text>
          </View>

          <View style={styles.statsRight}>
            <Svg width={size} height={size}>
              {/* Background circle of the gauge */}
              <Circle cx={size/2} cy={size/2} r={radius} stroke="rgba(255,255,255,0.3)" strokeWidth={strokeWidth} fill="none" />
              <Circle 
                cx={size/2} cy={size/2} r={radius} 
                stroke={isDark ? '#FF4D4D' : '#B22222'} 
                strokeWidth={strokeWidth} 
                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                strokeLinecap="round" fill="none" 
              />
            </Svg>
            <View style={styles.innerCircleText}>
              <Text style={[styles.innerCount, { color: colors.text }]}>{stats.totalItems}</Text>
              <Text style={[styles.innerSub, { color: colors.textSecondary }]}>Total Items</Text>
            </View>
          </View>
        </View>

                {/* monitoring number card */}

          {stats.totalItems > 0 ? (
            /* --- 1. WHAT TO SHOW WHEN THERE ARE ITEMS --- */
            <View style={[styles.scannedItemsCard, { backgroundColor: colors.card?? '#9B86BD' }]}>
              <View style={styles.iconContainer}>
                <Ionicons name="heart" size={30} color="white" />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.itemTitle, { color: colors.text, textAlign: 'left' }]} numberOfLines={1}>
                  Wow! You made it
                </Text>
                <Text style={[styles.sub, { color: colors.textSecondary, textAlign: 'left' }]} numberOfLines={2}>
                  Monitoring {stats.totalItems} scanned items for safety.
                </Text>
              </View>
            </View>
          ) : (
            /* --- 2. WHAT TO SHOW WHEN LIST IS EMPTY --- */
            <View style={[styles.scannedItemsCard, { backgroundColor: isDark ? colors.card : '#F2F2F7' }]}>
              <View style={styles.iconContainer}>
                <Ionicons name="scan-outline" size={30} color={colors.textSecondary} />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.itemTitle, { color: colors.textSecondary, marginTop: 5 }]}>No Scans Yet</Text>
                <Text style={[styles.sub, { color: colors.textTertiary }]}>
                  Your safety journey starts here. Scan an item to see its risk level.
                </Text>
              </View>
            </View>
          )}

        {/* --- GRID ITEMS --- */}
        <View style={styles.gridContainer}>
          <View style={[styles.gridItem, { backgroundColor: colors.card }]}>
            <Image source={require("../assets/images/group1_logo.png")} 
                style={styles.groupBadgeImage} 
                resizeMode="contain" />      
            <Text style={[styles.itemTitle, { color: colors.text }]}>{stats.mostCommonGroup1}</Text>
            <Text style={[styles.itemSub, { color: colors.textSecondary }]}>Most Scanned Carcinogen</Text>
          </View>

          <View style={styles.gridRightColumn}>
            <View style={[styles.smallGridItem, { backgroundColor: colors.card }]}>
               <View style={styles.rowLayout}>
                  <Image source={require("../assets/images/group2_logo.png")} 
                      style={styles.groupBadgeImage1} 
                      resizeMode="contain" />   
                      <View style={{ flexShrink: 1, marginLeft: -10 }}>
                          <Text style={[styles.smallItemTitle, { color: colors.text}]}>{stats.mostCommonGroup2}</Text>
                          <Text style={[styles.itemSub, { color: colors.textSecondary , textAlign: 'left'}]}>Most Scanned Possibly Carcinogen</Text>
                      </View>
              </View>
            </View>

            <View style={[styles.smallGridItem, { backgroundColor: colors.containerLight1, marginTop: 10 }]}>
                <Image 
                    source={require("../assets/images/highRisk_logo.png")} 
                    style={styles.topRightLogo} 
                    resizeMode="contain" 
                  />
                  <View style={{ marginLeft: 10 }}>
                 <Text style={[styles.smallItemTitle, { color: colors.text, marginTop: 7 }]}>High Risk Item </Text>
                 <Text style={[styles.smallItemTitle, { color: colors.textSecondary }]}>Name: {stats.highRiskItem.name}</Text>
                 <Text style={[styles.itemSub, { color: colors.textSecondary, textAlign: 'left' }]}>Found: {stats.highRiskItem.count} Carcinogens</Text>
                </View>
            </View>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  nav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoImg: { height: 32, width: 32 },
  logoText: { fontSize: 18, fontWeight: "700", letterSpacing: -0.3 },
  themeBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  hero: { paddingVertical: 24, alignItems: 'center' },
  heading: { fontSize: 28, fontWeight: "700", letterSpacing: -0.8, lineHeight: 34, textAlign: 'center' },
  sub: { fontSize: 15, marginTop: 8, textAlign: 'center' },
  breakdownContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    borderRadius: 20,
    marginBottom: 20,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
  },
  breakdownItem: { alignItems: 'center' },
  breakdownNumber: { fontSize: 22, fontWeight: 'bold' },
  breakdownLabel: { fontSize: 12, marginTop: 4 },
  mainStatsCard: {
    borderRadius: 25,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  statsLeft: { flex: 1 },
  percentageText: { fontSize: 48, fontWeight: 'bold' },
  subLabel: { fontSize: 14 },
  statsRight: { justifyContent: 'center', alignItems: 'center' },
  innerCircleText: { position: 'absolute', alignItems: 'center' },
  innerCount: { fontSize: 19, fontWeight: '700' },
  innerSub: { fontSize: 12, fontWeight: '700' },
  gridContainer: { flexDirection: 'row', gap: 10 },
  gridItem: { flex: 1, borderRadius: 20, padding: 15, alignItems: 'center', elevation: 1, minHeight: 150 },
  gridRightColumn: { flex: 1.2 },
  smallGridItem: { borderRadius: 20, padding: 12, minHeight: 60, justifyContent: 'center', elevation: 1, position: 'relative' },
  
  topRightLogo: {
  position: 'absolute',  // Breaks the image out of the normal layout flow
  top: 10,               // Distance from the top edge
  right: 10,             // Distance from the right edge
  width: 35,             // Adjust size as needed
  height: 20,
  marginTop: 7,            // Remove vertical margin since it's now positioned absolutely
},
  rowLayout: {
    flexDirection: 'row',     // Horizontal layout
    alignItems: 'center',     // Vertically center image and text
    gap: 10,                  // Space between image and text
  },
  groupBadgeImage: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginVertical: 10,
  },
  groupBadgeImage1: {
    width: 70,
    height: 70,
    marginVertical: 10,
  },
  itemTitle: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginTop: 0 },
  smallItemTitle: { 
    fontSize: 13, 
    fontWeight: 'bold',
    flexShrink: 1,            // Prevents text from pushing image off screen
  },  
  itemSub: { fontSize: 12, marginTop: 4, textAlign: 'center', fontWeight: '500' },

scannedItemsCard: {
  flexDirection: 'row',
  alignItems: 'center',
  borderRadius: 20,
  padding: 16,
  marginBottom: 15,
  minHeight: 80,     // Added a minimum height to prevent collapse
  elevation: 1,
},
iconContainer: {
  marginRight: 15,             // Space between the heart and the text
  justifyContent: 'center',
  alignItems: 'center',
},
textContainer: {
  flex: 1,     
},

});