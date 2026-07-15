import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  StatusBar as RNStatusBar,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import Svg, { Circle, Line, Path } from 'react-native-svg';

export default function MapScreen({
  navigation,
  peers = [],
  onBack
}) {
  const [selectedPeer, setSelectedPeer] = useState(null);

  // Animations for glowing dots
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1500,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, [pulseAnim]);

  // Peer coordinates on the tactical coordinate map
  // Sarah Chen (Strong) - Near top right
  // Marcus Thorne (Fair) - Middle left
  // Elena Rodriguez (Offline) - Bottom right
  const peerPositions = {
    'Sarah Chen': { x: 260, y: 150, color: '#10b981', level: 'STRONG' },
    'Marcus Thorne': { x: 90, y: 220, color: '#fbbf24', level: 'FAIR' },
    'Elena Rodriguez': { x: 200, y: 380, color: '#6b7280', level: 'POOR' },
  };

  const handleSelectPeer = (peer) => {
    setSelectedPeer(peer);
  };

  const handleGoToList = () => {
    // Navigate back to the main tab screen (Peers/Home)
    navigation.navigate('Main');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Feather name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mesh Network Map</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <View style={styles.mapContainer}>
        <Svg width="100%" height="100%" viewBox="0 0 360 520" style={{ position: 'absolute', width: '100%', height: '100%' }}>
          {/* Tactical Background Coordinate Grid */}
          {/* Horizontal lines */}
          <Line x1="0" y1="50" x2="360" y2="50" stroke="rgba(59, 130, 246, 0.18)" strokeWidth="0.75" />
          <Line x1="0" y1="100" x2="360" y2="100" stroke="rgba(59, 130, 246, 0.18)" strokeWidth="0.75" />
          <Line x1="0" y1="150" x2="360" y2="150" stroke="rgba(59, 130, 246, 0.18)" strokeWidth="0.75" />
          <Line x1="0" y1="200" x2="360" y2="200" stroke="rgba(59, 130, 246, 0.18)" strokeWidth="0.75" />
          <Line x1="0" y1="250" x2="360" y2="250" stroke="rgba(59, 130, 246, 0.18)" strokeWidth="0.75" />
          <Line x1="0" y1="300" x2="360" y2="300" stroke="rgba(59, 130, 246, 0.18)" strokeWidth="0.75" />
          <Line x1="0" y1="350" x2="360" y2="350" stroke="rgba(59, 130, 246, 0.18)" strokeWidth="0.75" />
          <Line x1="0" y1="400" x2="360" y2="400" stroke="rgba(59, 130, 246, 0.18)" strokeWidth="0.75" />
          <Line x1="0" y1="450" x2="360" y2="450" stroke="rgba(59, 130, 246, 0.18)" strokeWidth="0.75" />
          
          {/* Vertical lines */}
          <Line x1="40" y1="0" x2="40" y2="520" stroke="rgba(59, 130, 246, 0.18)" strokeWidth="0.75" />
          <Line x1="80" y1="0" x2="80" y2="520" stroke="rgba(59, 130, 246, 0.18)" strokeWidth="0.75" />
          <Line x1="120" y1="0" x2="120" y2="520" stroke="rgba(59, 130, 246, 0.18)" strokeWidth="0.75" />
          <Line x1="160" y1="0" x2="160" y2="520" stroke="rgba(59, 130, 246, 0.18)" strokeWidth="0.75" />
          <Line x1="200" y1="0" x2="200" y2="520" stroke="rgba(59, 130, 246, 0.18)" strokeWidth="0.75" />
          <Line x1="240" y1="0" x2="240" y2="520" stroke="rgba(59, 130, 246, 0.18)" strokeWidth="0.75" />
          <Line x1="280" y1="0" x2="280" y2="520" stroke="rgba(59, 130, 246, 0.18)" strokeWidth="0.75" />
          <Line x1="320" y1="0" x2="320" y2="520" stroke="rgba(59, 130, 246, 0.18)" strokeWidth="0.75" />

          {/* Topographic Terrain contour lines (Curves) */}
          <Path d="M -20 180 Q 80 120 120 220 T 380 160" fill="none" stroke="rgba(59, 130, 246, 0.12)" strokeWidth="1.2" />
          <Path d="M -20 280 Q 90 220 150 320 T 380 260" fill="none" stroke="rgba(59, 130, 246, 0.12)" strokeWidth="1.2" />
          <Path d="M -20 380 Q 100 320 180 420 T 380 360" fill="none" stroke="rgba(59, 130, 246, 0.12)" strokeWidth="1.2" />
          
          <Path d="M 60 -20 Q 140 100 80 200 T 120 540" fill="none" stroke="rgba(59, 130, 246, 0.12)" strokeWidth="1.2" />
          <Path d="M 180 -20 Q 240 140 190 280 T 220 540" fill="none" stroke="rgba(59, 130, 246, 0.12)" strokeWidth="1.2" />
          <Path d="M 300 -20 Q 320 200 290 340 T 310 540" fill="none" stroke="rgba(59, 130, 246, 0.12)" strokeWidth="1.2" />

          {/* Core Radar reference lines */}
          <Circle cx="180" cy="260" r="160" stroke="rgba(29, 78, 216, 0.1)" strokeWidth="1" fill="none" />
          <Circle cx="180" cy="260" r="100" stroke="rgba(29, 78, 216, 0.1)" strokeWidth="1" fill="none" />
          <Circle cx="180" cy="260" r="40" stroke="rgba(29, 78, 216, 0.1)" strokeWidth="1" fill="none" />

          {/* Compass rose markings */}
          <Line x1="180" y1="90" x2="180" y2="105" stroke="rgba(29, 78, 216, 0.3)" strokeWidth="1.5" />
          <Line x1="180" y1="415" x2="180" y2="430" stroke="rgba(29, 78, 216, 0.3)" strokeWidth="1.5" />
          <Line x1="10" y1="260" x2="25" y2="260" stroke="rgba(29, 78, 216, 0.3)" strokeWidth="1.5" />
          <Line x1="335" y1="260" x2="350" y2="260" stroke="rgba(29, 78, 216, 0.3)" strokeWidth="1.5" />
        </Svg>

        {/* Floating Interactive Peer Dots */}
        {peers.map((peer) => {
          const pos = peerPositions[peer.name];
          if (!pos) return null;

          const isSelected = selectedPeer?.name === peer.name;

          return (
            <TouchableOpacity
              key={peer.name}
              style={[
                styles.nodeTouchable,
                { left: pos.x - 20, top: pos.y - 20 }
              ]}
              onPress={() => handleSelectPeer(peer)}
              activeOpacity={0.7}
            >
              <View style={styles.dotContainer}>
                {/* Glow ring */}
                <Animated.View
                  style={[
                    styles.glowRing,
                    {
                      borderColor: pos.color,
                      opacity: pulseAnim,
                      transform: [
                        {
                          scale: pulseAnim.interpolate({
                            inputRange: [0.4, 1],
                            outputRange: [1, 1.8],
                          }),
                        },
                      ],
                    },
                  ]}
                />
                {/* Active selection outer ring */}
                {isSelected && (
                  <View style={[styles.selectionRing, { borderColor: '#ffffff' }]} />
                )}
                {/* Center Core dot */}
                <View style={[styles.coreDot, { backgroundColor: pos.color }]} />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected Peer details card */}
      {selectedPeer ? (
        <View style={styles.cardContainer}>
          <View style={styles.peerCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.avatarContainer, { borderColor: peerPositions[selectedPeer.name]?.color }]}>
                <Feather name="user" size={24} color="#a5b4fc" />
              </View>
              <View style={styles.headerDetails}>
                <Text style={styles.peerName}>{selectedPeer.name}</Text>
                <Text style={styles.peerStatus}>{selectedPeer.status}</Text>
              </View>
              <View style={styles.signalTag}>
                <Text style={[styles.signalText, { color: peerPositions[selectedPeer.name]?.color }]}>
                  {peerPositions[selectedPeer.name]?.level}
                </Text>
              </View>
            </View>

            <Text style={styles.infoDescription}>
              Located at coordinate sector G-8. Signals are relayed dynamically through neighboring peers.
            </Text>

            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.closeCardButton}
                onPress={() => setSelectedPeer(null)}
                activeOpacity={0.7}
              >
                <Text style={styles.closeButtonText}>Close Map</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.viewListButton}
                onPress={handleGoToList}
                activeOpacity={0.8}
              >
                <Text style={styles.viewListText}>View in List</Text>
                <Feather name="arrow-right" size={16} color="#ffffff" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>
            Tap on any active ping dot to check signal status and navigate to the nearby list.
          </Text>
        </View>
      )}
    </View>
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
  mapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#050a12',
  },
  mapSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  nodeTouchable: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  dotContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  selectionRing: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  coreDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardContainer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    zIndex: 20,
  },
  peerCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginRight: 12,
  },
  headerDetails: {
    flex: 1,
  },
  peerName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  peerStatus: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  signalTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  signalText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  infoDescription: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 16,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  closeCardButton: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  closeButtonText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  viewListButton: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1d4ed8',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewListText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  instructionsContainer: {
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#050a12',
    borderTopWidth: 1,
    borderTopColor: '#111827',
    paddingHorizontal: 32,
  },
  instructionsText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
  },
});
