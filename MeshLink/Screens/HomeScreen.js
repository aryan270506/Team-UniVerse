import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  Animated,
  Easing,
  TouchableOpacity,
  StatusBar,
  Platform,
  StatusBar as RNStatusBar
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import {SafeAreaView}from 'react-native-safe-area-context';
// Component to render signal strength indicators matching the mockup
const SignalIndicator = ({ level }) => {
  if (level === 'STRONG') {
    return (
      <View style={styles.signalContainer}>
        <View style={styles.signalBars}>
          <View style={[styles.bar, { height: 6, backgroundColor: '#818cf8' }]} />
          <View style={[styles.bar, { height: 10, backgroundColor: '#818cf8' }]} />
          <View style={[styles.bar, { height: 14, backgroundColor: '#818cf8' }]} />
        </View>
        <Text style={[styles.signalText, { color: '#94a3b8' }]}>STRONG</Text>
      </View>
    );
  }
  if (level === 'FAIR') {
    return (
      <View style={styles.signalContainer}>
        <View style={styles.signalBars}>
          <View style={[styles.bar, { height: 6, backgroundColor: '#fbbf24' }]} />
          <View style={[styles.bar, { height: 10, backgroundColor: '#fbbf24' }]} />
          <View style={[styles.bar, { height: 14, backgroundColor: '#374151' }]} />
        </View>
        <Text style={[styles.signalText, { color: '#94a3b8' }]}>FAIR</Text>
      </View>
    );
  }
  // POOR: represented by an empty right-angled triangle outline in the mockup
  return (
    <View style={styles.signalContainer}>
      <View style={styles.signalBars}>
        <MaterialCommunityIcons name="signal-cellular-outline" size={16} color="#4b5563" />
      </View>
      <Text style={[styles.signalText, { color: '#94a3b8' }]}>POOR</Text>
    </View>
  );
};

export default function HomeScreen() {
  // Animation value for rotating the radar sweep quadrant
  const rotateAnim = useRef(new Animated.Value(0)).current;
  // Animation value for pulsing search text
  const pulseAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // Continuous 360 degree rotation loop for radar sweep
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 5000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Pulse animation loop for "Looking for nearby devices..." text
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1800,
          easing: Easing.ease,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, [rotateAnim, pulseAnim]);

  // Interpolation for 360 degree rotation
  const rotateSpin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#080e1b" />
      
      {/* Wrapper to handle ScrollView and absolute Floating Button relative to active space */}
      <View style={styles.contentWrapper}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Header Section */}
          <View style={styles.header}>
            <View>
              <View style={styles.titleRow}>
                <MaterialCommunityIcons name="sitemap" size={24} color="#a5b4fc" style={styles.logoIcon} />
                <Text style={styles.headerTitle}>MeshLink</Text>
              </View>
              <View style={styles.statusRow}>
                <View style={styles.statusDotActive} />
                <Text style={styles.statusText}>3 people nearby</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.iconButton}>
              <MaterialCommunityIcons name="connection" size={24} color="#a5b4fc" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Feather name="search" size={20} color="#4b5563" style={styles.searchIcon} />
            <TextInput
              placeholder="Search peers..."
              placeholderTextColor="#4b5563"
              style={styles.searchInput}
            />
          </View>

          {/* Peer List */}
          <View style={styles.peerList}>
            
            {/* Sarah Chen Card */}
            <View style={styles.card}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Feather name="image" size={18} color="#4f46e5" />
                </View>
                <View style={[styles.avatarStatus, { backgroundColor: '#10b981' }]} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.peerName}>Sarah Chen</Text>
                <Text style={styles.peerStatus}>Connected • 12m</Text>
              </View>
              <SignalIndicator level="STRONG" />
            </View>

            {/* Marcus Thorne Card */}
            <View style={styles.card}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Feather name="image" size={18} color="#4f46e5" />
                </View>
                <View style={[styles.avatarStatus, { backgroundColor: '#fbbf24' }]} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.peerName}>Marcus Thorne</Text>
                <Text style={styles.peerStatus}>Relay Node • 45m</Text>
              </View>
              <SignalIndicator level="FAIR" />
            </View>

            {/* Elena Rodriguez Card */}
            <View style={styles.card}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Feather name="image" size={18} color="#4f46e5" />
                </View>
                <View style={[styles.avatarStatus, { backgroundColor: '#6b7280' }]} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.peerName}>Elena Rodriguez</Text>
                <Text style={styles.peerStatus}>Offline • 150m</Text>
              </View>
              <SignalIndicator level="POOR" />
            </View>
            
          </View>

          {/* Device Finding Radar Container */}
          <View style={styles.radarContainer}>
            <View style={styles.radarBackgroundCircle}>
              {/* Concentric Circles */}
              <View style={styles.radarRingOuter}>
                <View style={styles.radarRingMiddle}>
                  <View style={styles.radarRingInner}>
                    {/* Glowing core node */}
                    <View style={styles.radarCenterCore} />
                  </View>
                </View>
              </View>

              {/* Rotating radar sweep blade */}
              <Animated.View style={[styles.radarSweepWrapper, { transform: [{ rotate: rotateSpin }] }]}>
                <View style={styles.radarSweepQuadrant} />
              </Animated.View>
            </View>

            <Animated.Text style={[styles.scanningText, { opacity: pulseAnim }]}>
              Looking for nearby devices...
            </Animated.Text>
          </View>

        </ScrollView>

        {/* Floating Alert Beacon Button (positioned relative to container, above bottom tab bar) */}
        <TouchableOpacity style={styles.floatingBeaconButton} activeOpacity={0.8}>
          <MaterialCommunityIcons name="map-marker-radius" size={28} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Bottom Tab Navigation Bar (sits naturally inside SafeAreaView to avoid screen edge collision) */}
      <View style={styles.bottomTabBar}>
        {/* Peers Tab (Active) */}
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7}>
          <View style={styles.activeTabHighlight}>
            <MaterialCommunityIcons name="account-group" size={22} color="#ffffff" />
          </View>
          <Text style={[styles.tabLabel, styles.activeTabLabel]}>Peers</Text>
        </TouchableOpacity>

        {/* Chat Tab */}
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7}>
          <MaterialCommunityIcons name="chat-outline" size={24} color="#94a3b8" style={styles.inactiveIcon} />
          <Text style={styles.tabLabel}>Chat</Text>
        </TouchableOpacity>

        {/* SOS Tab */}
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7}>
          <MaterialCommunityIcons name="signal-variant" size={24} color="#94a3b8" style={styles.inactiveIcon} />
          <Text style={styles.tabLabel}>SOS</Text>
        </TouchableOpacity>

        {/* Network Tab */}
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7}>
          <MaterialCommunityIcons name="earth" size={24} color="#94a3b8" style={styles.inactiveIcon} />
          <Text style={styles.tabLabel}>Network</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080d19',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  contentWrapper: {
    flex: 1,
    position: 'relative',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100, // Padding to ensure scroll list clears the floating beacon button
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
  logoIcon: {
    marginRight: 8,
    transform: [{ rotate: '45deg' }] // rotate slightly to match custom node network logo
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDotActive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(23, 34, 59, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
  },
  peerList: {
    marginBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121d33',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#1c2843',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarStatus: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#121d33',
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  peerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 3,
  },
  peerStatus: {
    fontSize: 13,
    color: '#94a3b8',
  },
  signalContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 54,
  },
  signalBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 16,
    marginBottom: 6,
  },
  bar: {
    width: 3.5,
    marginHorizontal: 1.5,
    borderRadius: 1,
  },
  signalText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  radarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  radarBackgroundCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarRingOuter: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1.5,
    borderColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarRingMiddle: {
    width: 154,
    height: 154,
    borderRadius: 77,
    borderWidth: 1.5,
    borderColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarRingInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1.5,
    borderColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarCenterCore: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#c7d2fe',
    shadowColor: '#a5b4fc',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 6,
  },
  radarSweepWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 220,
    height: 220,
  },
  radarSweepQuadrant: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 110,
    height: 110,
    borderTopRightRadius: 110,
    backgroundColor: 'rgba(165, 180, 252, 0.12)',
    borderLeftWidth: 1.5,
    borderLeftColor: 'rgba(165, 180, 252, 0.35)',
  },
  scanningText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 18,
    letterSpacing: 0.5,
  },
  floatingBeaconButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#b91c1c',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
  bottomTabBar: {
    height: 68,
    backgroundColor: '#050a12',
    borderTopWidth: 1,
    borderTopColor: '#111827',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 4 : 0, // minor offset adjustments
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
  },
  activeTabHighlight: {
    width: 58,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1d4ed8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  inactiveIcon: {
    marginBottom: 6,
  },
  tabLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  activeTabLabel: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});

