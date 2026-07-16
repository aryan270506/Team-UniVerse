import React, { useState, useEffect } from 'react';
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
import Svg, { Rect, Circle, Line } from 'react-native-svg';

export default function NetworkScreen({
  peers = [],
  onStartChat,
  isSosBroadcastActive = false
}) {
  const [networkUptime, setNetworkUptime] = useState(18);

  useEffect(() => {
    const interval = setInterval(() => {
      setNetworkUptime(prev => prev + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const activePeers = peers.filter(p => !p.status.toLowerCase().includes('offline'));
  const peersReachableCount = peers.length > 0 ? activePeers.length : 2;
  const avgHopDist = peers.length > 0 ? (activePeers.length > 0 ? '1.0' : '0.0') : '2.3';
  const inTransitCount = peers.length > 0 ? 0 : 4;

  const displayPeers = peers.length > 0 ? peers : [
    { id: 'alex', name: 'Alex (Relay)', ip: '10.42.0.8', role: 'Active Relay Node', status: 'Offline', latency: '18ms', isMock: true },
    { id: 'sam', name: 'Sam', ip: '10.42.0.3', role: 'Destination Peer', status: 'Offline', latency: '42ms', isMock: true }
  ];

  const getPeerCoords = (index, total) => {
    if (total === 1) {
      return { x: 260, y: 110 };
    }
    if (total === 2) {
      return index === 0 ? { x: 250, y: 70 } : { x: 230, y: 160 };
    }
    const angle = (index * 2 * Math.PI) / total - Math.PI / 4;
    const radius = 85;
    return {
      x: 170 + Math.cos(angle) * radius,
      y: 110 + Math.sin(angle) * radius,
    };
  };

  const positionedPeers = displayPeers.map((peer, index) => {
    const coords = getPeerCoords(index, displayPeers.length);
    return {
      ...peer,
      ...coords,
      color: isSosBroadcastActive ? '#ef4444' : (peer.avatarStatusColor || (peer.status.toLowerCase().includes('offline') ? '#6b7280' : '#818cf8')),
    };
  });

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="sitemap" size={24} color="#a5b4fc" style={styles.logoIcon} />
          <Text style={styles.headerTitle}>MeshLink</Text>
        </View>
        <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
          <MaterialCommunityIcons name="connection" size={20} color="#a5b4fc" />
        </TouchableOpacity>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>{peersReachableCount}</Text>
            <Text style={styles.metricLabel}>PEERS REACHABLE</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>{avgHopDist}</Text>
            <Text style={styles.metricLabel}>AVG HOP DIST</Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>{inTransitCount}</Text>
            <Text style={styles.metricLabel}>IN TRANSIT</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>{networkUptime} min</Text>
            <Text style={styles.metricLabel}>NETWORK UPTIME</Text>
          </View>
        </View>
      </View>

      <View style={styles.topologyCard}>
        <View style={styles.topologyCardHeader}>
          <View style={[styles.meshActivePill, isSosBroadcastActive && { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.25)' }]}>
            <View style={[styles.meshActiveDot, isSosBroadcastActive && { backgroundColor: '#ef4444' }]} />
            <Text style={[styles.meshActiveText, isSosBroadcastActive && { color: '#ef4444' }]}>{isSosBroadcastActive ? '⚠️ RED ALERT ACTIVE' : 'Mesh Active'}</Text>
          </View>
        </View>

        <View style={styles.svgContainer}>
          <Svg width="100%" height="220" viewBox="0 0 340 220">
            {/* Concentric radar reference circles */}
            <Circle cx="170" cy="110" r="45" fill="none" stroke={isSosBroadcastActive ? "rgba(239, 68, 68, 0.15)" : "rgba(165, 180, 252, 0.05)"} strokeWidth="1" />
            <Circle cx="170" cy="110" r="90" fill="none" stroke={isSosBroadcastActive ? "rgba(239, 68, 68, 0.2)" : "rgba(165, 180, 252, 0.08)"} strokeWidth="1" />

            {/* Mesh connection lines between adjacent peers */}
            {positionedPeers.map((peer, idx) => {
              const nextPeer = positionedPeers[(idx + 1) % positionedPeers.length];
              const isLinkActive = !peer.status.toLowerCase().includes('offline') && !nextPeer.status.toLowerCase().includes('offline');

              return (
                <Line
                  key={`link-${idx}`}
                  x1={peer.x}
                  y1={peer.y}
                  x2={nextPeer.x}
                  y2={nextPeer.y}
                  stroke={isSosBroadcastActive ? '#fca5a5' : (isLinkActive ? '#a5b4fc' : 'rgba(165, 180, 252, 0.12)')}
                  strokeWidth={isLinkActive || isSosBroadcastActive ? 1.5 : 1}
                  strokeDasharray={isLinkActive || isSosBroadcastActive ? undefined : "4, 4"}
                />
              );
            })}

            {/* Radial connection lines from My Node to peers */}
            {positionedPeers.map((peer, idx) => {
              const isLinkActive = !peer.status.toLowerCase().includes('offline');
              return (
                <Line
                  key={`radial-${idx}`}
                  x1={170}
                  y1={110}
                  x2={peer.x}
                  y2={peer.y}
                  stroke={isSosBroadcastActive ? '#ef4444' : (isLinkActive ? '#818cf8' : 'rgba(165, 180, 252, 0.1)')}
                  strokeWidth={isLinkActive || isSosBroadcastActive ? 2 : 1.2}
                  strokeDasharray={isLinkActive || isSosBroadcastActive ? undefined : "6, 4"}
                />
              );
            })}
          </Svg>

          {/* Center Operator Node (My Node) */}
          <TouchableOpacity 
            style={[styles.nodeOperatorContainer, { left: 170 - 22, top: 110 - 22 }]}
            activeOpacity={0.85}
            onPress={() => Alert.alert("My Node", "Node IP: 10.42.0.1\nRole: Operator\nStatus: Active Router")}
          >
            <View style={[styles.nodeOperatorCore, isSosBroadcastActive && { backgroundColor: '#ef4444', borderColor: '#fca5a5' }]}>
              <Feather name="user" size={16} color="#ffffff" />
            </View>
          </TouchableOpacity>

          {/* Dynamic / Discovered Peer Nodes */}
          {positionedPeers.map((peer, idx) => {
            return (
              <TouchableOpacity 
                key={`node-${idx}`}
                style={[styles.nodeRelayContainer, { left: peer.x - 40, top: peer.y - 30 }]}
                activeOpacity={0.85}
                onPress={() => {
                  if (peer.isMock) {
                    if (peer.id === 'sam') {
                      Alert.alert(
                        "Sam", 
                        "Node IP: 10.42.0.3\nRole: Destination Peer\nStatus: Offline",
                        [
                          { text: "Cancel", style: "cancel" },
                          { text: "Chat", onPress: () => onStartChat("Sam") }
                        ]
                      );
                    } else {
                      Alert.alert(peer.name, `Node IP: ${peer.ip}\nRole: ${peer.role}\nStatus: ${peer.status}`);
                    }
                  } else {
                    Alert.alert(
                      peer.displayName || peer.name, 
                      `Device ID: ${peer.deviceId || 'Unknown'}\nStatus: ${peer.status}\nConnection State: ${peer.connectionState}`,
                      [
                        { text: "Cancel", style: "cancel" },
                        { text: "Chat", onPress: () => onStartChat(peer.displayName || peer.name) }
                      ]
                    );
                  }
                }}
              >
                <View style={[styles.nodeRelayCore, { borderColor: peer.color }]}>
                  <View style={[styles.nodeInnerTarget, { backgroundColor: peer.color }]} />
                </View>
                <Text style={styles.nodeLabel}>{peer.displayName || peer.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.routingBanner}>
        <View style={styles.routingIconWrapper}>
          <MaterialCommunityIcons name="routes" size={24} color="#a5b4fc" />
        </View>
        <Text style={styles.routingText}>
          {activePeers.length > 0 
            ? `Direct mesh link established to ${activePeers[0].displayName || activePeers[0].name}`
            : "Waiting for nearby peers to connect to form a mesh route..."}
        </Text>
      </View>

      <View style={styles.bottomGrid}>
        <View style={styles.bottomGridBox}>
          <Text style={styles.bottomBoxTitle}>Signal Strength</Text>
          <View style={styles.signalBarsWrapper}>
            <View style={[styles.signalBarItem, { height: 6, backgroundColor: activePeers.length > 0 ? '#818cf8' : '#1e293b' }]} />
            <View style={[styles.signalBarItem, { height: 10, backgroundColor: activePeers.length > 0 ? '#818cf8' : '#1e293b' }]} />
            <View style={[styles.signalBarItem, { height: 14, backgroundColor: activePeers.length > 0 ? '#818cf8' : '#1e293b' }]} />
            <View style={[styles.signalBarItem, { height: 18, backgroundColor: '#1e293b' }]} />
          </View>
        </View>

        <View style={styles.bottomGridBox}>
          <Text style={styles.bottomBoxTitle}>Latency</Text>
          <Text style={styles.latencyValue}>{activePeers.length > 0 ? '15ms' : 'N/A'}</Text>
        </View>
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
  logoIcon: {
    marginRight: 8,
    transform: [{ rotate: '45deg' }]
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(23, 34, 59, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricsGrid: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: 1,
    textAlign: 'center',
  },
  topologyCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    position: 'relative',
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topologyCardHeader: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 15,
  },
  meshActivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(129, 140, 248, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.25)',
  },
  meshActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#a5b4fc',
    marginRight: 6,
  },
  meshActiveText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#a5b4fc',
  },
  svgContainer: {
    position: 'relative',
    width: '100%',
    height: 220,
  },
  nodeOperatorContainer: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0f172a',
    borderWidth: 2.5,
    borderColor: '#818cf8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#818cf8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 20,
  },
  nodeOperatorCore: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeRelayContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 60,
    zIndex: 20,
  },
  nodeRelayCore: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#a5b4fc',
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeInnerTarget: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#a5b4fc',
  },
  nodeLabel: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#cbd5e1',
    marginTop: 4,
    textAlign: 'center',
  },
  routingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(165, 180, 252, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(165, 180, 252, 0.08)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    marginHorizontal: 4,
  },
  routingIconWrapper: {
    marginRight: 14,
  },
  routingText: {
    fontSize: 13.5,
    color: '#94a3b8',
    lineHeight: 20,
    flex: 1,
  },
  bottomGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  bottomGridBox: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: '#1e293b',
    height: 76,
    justifyContent: 'center',
  },
  bottomBoxTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#cbd5e1',
    marginBottom: 10,
  },
  signalBarsWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 18,
  },
  signalBarItem: {
    width: 8,
    marginRight: 3,
    borderRadius: 1.5,
  },
  latencyValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
