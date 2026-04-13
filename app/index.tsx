import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

// 1. Import your Theme Hook
import { useTheme } from "../context/ThemeContext"; 

import DashboardView from "./dashboard"; 
import HistoryView from "./history";
import InformationScreen from './information';
import TextEntryScreen from './text-entry';

export default function Index() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const router = useRouter();
  
  // 2. Access the dynamic colors
  const { colors, isDark } = useTheme();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView />;
      case 'text-entry': return <TextEntryScreen />;
      case 'history': return <HistoryView />;
      case 'info': return <InformationScreen />;
      default: return <DashboardView />;
    }
  };

  return (
    // 3. Apply dynamic background color to the main container
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* 4. Apply dynamic colors to the Navigation Bar */}
      <View style={[
        styles.navBar, 
        { 
          backgroundColor: colors.surface, 
          borderTopColor: colors.border 
        }
      ]}>
        
        {/* Dashboard Tab */}
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => setActiveTab('dashboard')}
        >
          <Ionicons 
            name="home-outline" 
            size={24} 
            color={activeTab === 'dashboard' ? colors.containerLight : colors.textSecondary} 
          />
        </TouchableOpacity>

        {/* Text Entry Tab */}
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => setActiveTab('text-entry')}
        >
          <Ionicons 
            name="create-outline"
            size={24} 
            color={activeTab === 'text-entry' ? colors.containerLight : colors.textSecondary} 
          />
        </TouchableOpacity>

        {/* Scan Button (Keep the purple theme or use colors.accent) */}
        <TouchableOpacity 
          style={styles.scanButton} 
          onPress={() => router.push("/scan")}
        >
          <View style={[
            styles.scanInner, 
            { backgroundColor: colors.containerLight ?? '#9B86BD' }
          ]}>
            <Ionicons name="scan-outline" size={28} color="white" />
          </View>
        </TouchableOpacity>

        {/* Information Tab */}
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => setActiveTab('info')}
        >
          <Ionicons 
            name="information-circle-outline" 
            size={26} 
            color={activeTab === 'info' ? colors.containerLight : colors.textSecondary} 
          />
        </TouchableOpacity>

        {/* History Tab */}
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => setActiveTab('history')}
        >
          <Ionicons 
            name="time-outline" 
            size={24} 
            color={activeTab === 'history' ? colors.containerLight : colors.textSecondary} 
          />
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  navBar: {
    flexDirection: 'row',
    height: 80,
    borderTopWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 15,
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scanButton: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scanInner: {
    width: 55,
    height: 55,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25, 
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
  }
});