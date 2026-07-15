import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';

export default function ProfileScreen({ peers = [] }) {
  const contactsCount = peers.filter(p => p.added).length;

  const handleConfigureTransceiver = () => {
    Alert.alert(
      "Configure Transceiver",
      "Frequency: 915.0 MHz\nBandwidth: 125 kHz\nSpreading Factor: SF7\nCoding Rate: 4/5",
      [{ text: "OK" }]
    );
  };

  const handleExportLogs = () => {
    Alert.alert(
      "Export Message Logs",
      "Mesh database exported to local storage: /MeshLink/exports/logs_latest.json",
      [{ text: "Done" }]
    );
  };

  const handlePairBluetooth = () => {
    Alert.alert(
      "Bluetooth Module",
      "Scanning for ESP32/RFM95 mesh transceiver...",
      [{ text: "Cancel", style: "cancel" }]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="account" size={24} color="#a5b4fc" style={{ marginRight: 8 }} />
          <Text style={styles.headerTitle}>My Profile</Text>
        </View>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.profileAvatarLarge}>
          <Feather name="user" size={48} color="#818cf8" />
        </View>
        <Text style={styles.profileName}>Mesh Operator</Text>
        <Text style={styles.profileIpText}>Node IP: 10.42.0.1</Text>
        
        <View style={styles.separator} />
        
        <View style={styles.profileStatsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{contactsCount}</Text>
            <Text style={styles.statLabel}>Contacts</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>14.2 MB</Text>
            <Text style={styles.statLabel}>Routed</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>84%</Text>
            <Text style={styles.statLabel}>Battery</Text>
          </View>
        </View>
      </View>

      <View style={{ marginTop: 12 }}>
        <TouchableOpacity 
          style={styles.profileOptionButton} 
          activeOpacity={0.7}
          onPress={handleConfigureTransceiver}
        >
          <Feather name="sliders" size={18} color="#a5b4fc" style={{ marginRight: 12 }} />
          <Text style={styles.profileOptionText}>Configure Transceiver</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.profileOptionButton} 
          activeOpacity={0.7}
          onPress={handleExportLogs}
        >
          <Feather name="file-text" size={18} color="#a5b4fc" style={{ marginRight: 12 }} />
          <Text style={styles.profileOptionText}>Export Message Logs</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.profileOptionButton} 
          activeOpacity={0.7}
          onPress={handlePairBluetooth}
        >
          <Feather name="bluetooth" size={18} color="#a5b4fc" style={{ marginRight: 12 }} />
          <Text style={styles.profileOptionText}>Pair with Bluetooth Module</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100, 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  profileCard: {
    backgroundColor: '#121d33',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  profileAvatarLarge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#1c2843',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  profileIpText: {
    fontSize: 14,
    color: '#a5b4fc',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  separator: {
    width: '100%',
    height: 1,
    backgroundColor: '#1e293b',
    marginVertical: 20,
  },
  profileStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statBox: {
    alignItems: 'center',
  },
  statVal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  profileOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121d33',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  profileOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});
