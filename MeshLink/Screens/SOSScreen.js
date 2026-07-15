import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Animated,
  Easing,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';

export default function SOSScreen({
  onStopBroadcasting,
  onSelectPeerOptions,
  peers = [],
}) {
  const [discoveredSOSPeers, setDiscoveredSOSPeers] = useState([]);

  // Animation hooks
  const pulseRing1 = useRef(new Animated.Value(0)).current;
  const pulseRing2 = useRef(new Animated.Value(0)).current;
  const pulseRing3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Reset values
    pulseRing1.setValue(0);
    pulseRing2.setValue(0);
    pulseRing3.setValue(0);

    const createRingAnimation = (animValue, delayTime) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delayTime),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 2400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          })
        ])
      );
    };

    const anim1 = createRingAnimation(pulseRing1, 0);
    const anim2 = createRingAnimation(pulseRing2, 800);
    const anim3 = createRingAnimation(pulseRing3, 1600);

    Animated.parallel([anim1, anim2, anim3]).start();

    // Timers for simulated node discovery
    const timer1 = setTimeout(() => {
      setDiscoveredSOSPeers(prev => [...prev, { name: 'Sarah Chen', ip: '10.42.0.14' }]);
    }, 2000);

    const timer2 = setTimeout(() => {
      setDiscoveredSOSPeers(prev => [...prev, { name: 'Marcus Thorne', ip: '10.42.0.8' }]);
    }, 4500);

    const timer3 = setTimeout(() => {
      setDiscoveredSOSPeers(prev => [...prev, { name: 'Elias Thorne', ip: '10.42.0.3' }]);
    }, 7000);

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [pulseRing1, pulseRing2, pulseRing3]);

  // Interpolations for radar style circles
  const scale1 = pulseRing1.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] });
  const scale2 = pulseRing2.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] });
  const scale3 = pulseRing3.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] });

  const opacity1 = pulseRing1.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.8, 0.4, 0] });
  const opacity2 = pulseRing2.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.8, 0.4, 0] });
  const opacity3 = pulseRing3.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.8, 0.4, 0] });

  return (
    <ScrollView contentContainerStyle={styles.sosScrollContentContainer} style={styles.sosScrollView}>
      <StatusBar barStyle="light-content" backgroundColor="#080d19" />
      <View style={styles.sosContent}>
        
        <View style={styles.sosConsoleWrapper}>
          
          <View style={styles.sosConsoleRingOuter}>
            <View style={styles.sosConsoleRingMiddle}>
              <View style={styles.sosConsoleCheckmarkOutline}>
                <View style={styles.sosCheckmarkHighlight} />
                <Feather name="check" size={28} color="#fca5a5" />
              </View>

              <View style={styles.sosConsoleInnerContent}>
                <Text style={styles.sosConsoleHeadline}>SOS BROADCAST ACTIVE</Text>
                <Text style={styles.sosConsoleSubheadline}>Sent to everyone nearby</Text>
                <Text style={styles.sosConsoleDescription}>Mesh network acknowledges receipt by 8 peers</Text>
                
                <TouchableOpacity 
                  style={styles.sosConsoleStopButton} 
                  activeOpacity={0.8}
                  onPress={onStopBroadcasting}
                >
                  <Text style={styles.sosConsoleStopText}>Stop Broadcasting</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <Animated.View style={[styles.sosConsolePulseWave, { transform: [{ scale: scale1 }], opacity: opacity1 }]} />
          <Animated.View style={[styles.sosConsolePulseWave, { transform: [{ scale: scale2 }], opacity: opacity2 }]} />
          <Animated.View style={[styles.sosConsolePulseWave, { transform: [{ scale: scale3 }], opacity: opacity3 }]} />
        </View>

        {discoveredSOSPeers.length > 0 && (
          <View style={styles.sosPeersList}>
            <Text style={styles.sosPeersHeader}>NEARBY RESPONDERS</Text>
            <View style={{ width: '100%' }}>
              {discoveredSOSPeers.map((peer, idx) => (
                <View key={idx} style={styles.sosPeerItem}>
                  <View style={styles.sosPeerInfo}>
                    <View style={styles.sosPeerNameRow}>
                      <Text style={styles.sosPeerName}>{peer.name}</Text>
                      <TouchableOpacity 
                        style={styles.sosPeerOptionsButton}
                        activeOpacity={0.7}
                        onPress={() => {
                          const matchedPeer = peers.find(p => p.name === peer.name) || {
                            name: peer.name,
                            status: 'Connected • SOS Active',
                            level: 'STRONG',
                            avatarStatusColor: '#10b981',
                            added: false
                          };
                          onSelectPeerOptions(matchedPeer);
                        }}
                      >
                        <Feather name="more-horizontal" size={16} color="#94a3b8" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.sosPeerIp}>{peer.ip}</Text>
                  </View>
                  <View style={styles.ackBadge}>
                    <Text style={styles.ackBadgeText}>ACK RECEIVED</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sosScrollView: {
    flex: 1,
    backgroundColor: '#050a12',
  },
  sosScrollContentContainer: {
    paddingBottom: 40,
    paddingTop: 40,
  },
  sosContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 24,
  },
  sosConsoleWrapper: {
    width: 380,
    height: 380,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginTop: 20,
    marginBottom: 20,
  },
  sosConsoleRingOuter: {
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    backgroundColor: 'rgba(5, 10, 18, 0.8)',
  },
  sosConsoleRingMiddle: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(5, 10, 18, 0.95)',
  },
  sosConsoleCheckmarkOutline: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    position: 'relative',
  },
  sosCheckmarkHighlight: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 27,
    borderWidth: 1,
    borderColor: '#fca5a5',
    opacity: 0.3,
  },
  sosConsoleInnerContent: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  sosConsoleHeadline: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fca5a5',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  sosConsoleSubheadline: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
  },
  sosConsoleDescription: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 15,
  },
  sosConsoleStopButton: {
    marginTop: 20,
    backgroundColor: '#ef4444',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  sosConsoleStopText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  sosConsolePulseWave: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 2,
    borderColor: '#ef4444',
    zIndex: 1,
  },
  sosPeersList: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  sosPeersHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#f87171',
    letterSpacing: 1.5,
    marginBottom: 14,
    paddingLeft: 4,
  },
  sosPeerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    width: '100%',
  },
  sosPeerInfo: {
    flex: 1,
  },
  sosPeerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sosPeerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  sosPeerOptionsButton: {
    padding: 4,
    marginLeft: 6,
  },
  sosPeerIp: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  ackBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  ackBadgeText: {
    color: '#34d399',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
