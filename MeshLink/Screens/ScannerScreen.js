import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Easing,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Rect, Path, Circle } from 'react-native-svg';
import QRCode from 'react-native-qrcode-svg';

const { width } = Dimensions.get('window');
const SCAN_SIZE = width * 0.65;

export default function ScannerScreen({ navigation, onAddPeer, onBack }) {
  const [activeMode, setActiveMode] = useState('scan'); // 'scan' | 'mycode'

  // Animation value for the scanner sweep laser
  const laserAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (activeMode === 'scan') {
      // Loop laser animation up and down
      Animated.loop(
        Animated.sequence([
          Animated.timing(laserAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(laserAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ])
      ).start();
    }

    // Pulse for instructions text
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1000,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, [activeMode, laserAnim, pulseAnim]);

  const handleSimulateScan = () => {
    // Add a new peer to the network
    const simulatedPeer = {
      name: 'Liam Carter',
      status: 'Connected • Just now',
      added: true,
    };

    onAddPeer(simulatedPeer);

    Alert.alert(
      "Mesh Linked",
      "Successfully scanned and connected to Liam Carter's node.",
      [
        {
          text: "OK",
          onPress: () => navigation.navigate('Main')
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Feather name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mesh Link Scanner</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeMode === 'scan' && styles.activeTab]}
          onPress={() => setActiveMode('scan')}
          activeOpacity={0.7}
        >
          <Feather name="maximize" size={18} color={activeMode === 'scan' ? '#ffffff' : '#94a3b8'} />
          <Text style={[styles.tabText, activeMode === 'scan' && styles.activeTabText]}>Scan Code</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeMode === 'mycode' && styles.activeTab]}
          onPress={() => setActiveMode('mycode')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="qrcode" size={20} color={activeMode === 'mycode' ? '#ffffff' : '#94a3b8'} />
        <Text style={[styles.tabText, activeMode === 'mycode' && styles.activeTabText]}>My QR Code</Text>
      </TouchableOpacity>
    </View>

      {/* Scanner Screen Content */ }
  {
    activeMode === 'scan' ? (
      <View style={styles.scanContainer}>
        <Text style={styles.instructions}>Align QR Code inside the scanner frame to link peer</Text>

        {/* Viewfinder area */}
        <View style={styles.viewfinderContainer}>
          {/* Viewfinder background simulator (simulating camera with grid and nodes) */}
          <View style={styles.cameraSimulator}>
            <Svg width="100%" height="100%" viewBox="0 0 200 200">
              {/* Tactical grid background inside camera view */}
              <Path d="M 0 50 L 200 50 M 0 100 L 200 100 M 0 150 L 200 150 M 50 0 L 50 200 M 100 0 L 100 200 M 150 0 L 150 200" stroke="rgba(29, 78, 216, 0.1)" strokeWidth="1" />
              <Circle cx="100" cy="100" r="10" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1.5" fill="none" />
              <Circle cx="100" cy="100" r="40" stroke="rgba(29, 78, 216, 0.15)" strokeWidth="1" fill="none" />
            </Svg>
          </View>

          {/* Neon scanner brackets */}
          <View style={styles.viewfinderFrame}>
            {/* Top Left Bracket */}
            <View style={[styles.bracket, styles.topLeftBracket]} />
            {/* Top Right Bracket */}
            <View style={[styles.bracket, styles.topRightBracket]} />
            {/* Bottom Left Bracket */}
            <View style={[styles.bracket, styles.bottomLeftBracket]} />
            {/* Bottom Right Bracket */}
            <View style={[styles.bracket, styles.bottomRightBracket]} />

            {/* Laser sweep line */}
            <Animated.View
              style={[
                styles.laserLine,
                {
                  transform: [
                    {
                      translateY: laserAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, SCAN_SIZE - 2],
                      }),
                    },
                  ],
                },
              ]}
            />
          </View>
        </View>

        {/* Pulse scanning text */}
        <Animated.View style={{ opacity: pulseAnim, marginTop: 24, alignItems: 'center' }}>
          <View style={styles.statusBadge}>
            <View style={styles.greenDot} />
            <Text style={styles.statusText}>Searching for peer signal...</Text>
          </View>
        </Animated.View>

        {/* Simulation scan button */}
        <TouchableOpacity
          style={styles.simulateButton}
          onPress={handleSimulateScan}
          activeOpacity={0.8}
        >
          <Feather name="check-circle" size={18} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.simulateText}>Simulate Scan Connection</Text>
        </TouchableOpacity>
      </View>
    ) : (
      <View style={styles.codeContainer}>
        <Text style={styles.instructions}>Show this code to another user to share your Mesh credentials</Text>

        {/* QR Code Card */}
        <View style={styles.qrCard}>
          <Text style={styles.qrHeader}>MESH NETWORK ID</Text>

          {/* Real QR Code Generator */}
          <View style={styles.qrWrapper}>
            <QRCode
              value={JSON.stringify({
                name: 'My Device',
                id: 'NODE_MESH_V4.2',
                ip: '192.168.4.1'
              })}
              size={180}
              color="#080d19"
              backgroundColor="#ffffff"
            />
          </View>

          <Text style={styles.qrUser}>My Device (You)</Text>
          <Text style={styles.qrId}>NODE_MESH_V4.2</Text>
          <Text style={styles.qrIp}>192.168.4.1</Text>
        </View>
      </View>
    )
  }
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080d19',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#111827',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  headerRightPlaceholder: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginTop: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#1d4ed8',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#ffffff',
  },
  scanContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 32,
  },
  codeContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 32,
  },
  instructions: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 18,
    marginBottom: 32,
  },
  viewfinderContainer: {
    width: SCAN_SIZE,
    height: SCAN_SIZE,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cameraSimulator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#050a12',
  },
  viewfinderFrame: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bracket: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#1d4ed8',
  },
  topLeftBracket: {
    top: 12,
    left: 12,
    borderLeftWidth: 3,
    borderTopWidth: 3,
    borderTopLeftRadius: 6,
  },
  topRightBracket: {
    top: 12,
    right: 12,
    borderRightWidth: 3,
    borderTopWidth: 3,
    borderTopRightRadius: 6,
  },
  bottomLeftBracket: {
    bottom: 12,
    left: 12,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
    borderBottomLeftRadius: 6,
  },
  bottomRightBracket: {
    bottom: 12,
    right: 12,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderBottomRightRadius: 6,
  },
  laserLine: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 0,
    height: 2,
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginRight: 8,
  },
  statusText: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  simulateButton: {
    position: 'absolute',
    bottom: 40,
    height: 48,
    width: '80%',
    borderRadius: 24,
    backgroundColor: '#1d4ed8',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  simulateText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  qrCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 24,
    padding: 24,
    width: width * 0.75,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  qrHeader: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 20,
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  qrUser: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
  },
  qrId: {
    color: '#1d4ed8',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: 6,
  },
  qrIp: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
  },
});
