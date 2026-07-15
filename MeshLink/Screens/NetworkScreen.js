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
  onStartChat
}) {
  const [networkUptime, setNetworkUptime] = useState(18);


  useEffect(() => {
    const interval = setInterval(() => {
      setNetworkUptime(prev => prev + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

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
            <Text style={styles.metricValue}>12</Text>
            <Text style={styles.metricLabel}>PEERS REACHABLE</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>2.3</Text>
            <Text style={styles.metricLabel}>AVG HOP DIST</Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>4</Text>
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
          <View style={styles.meshActivePill}>
            <View style={styles.meshActiveDot} />
            <Text style={styles.meshActiveText}>Mesh Active</Text>
          </View>
        </View>

    
        <View style={styles.svgContainer}>
          <Svg width="100%" height="220" viewBox="0 0 340 220">
           
            <Rect x="20" y="55" width="80" height="120" rx="40" ry="40" fill="none" stroke="rgba(165, 180, 252, 0.12)" strokeWidth="1.5" />
            
            {/* Center Loop */}
            <Rect x="90" y="35" width="100" height="160" rx="50" ry="50" fill="none" stroke="rgba(165, 180, 252, 0.15)" strokeWidth="1.5" />
            
            {/* Right Loop */}
            <Rect x="185" y="40" width="120" height="150" rx="60" ry="60" fill="none" stroke="rgba(165, 180, 252, 0.18)" strokeWidth="1.5" />

           
            <Circle cx="70" cy="85" r="4.5" fill="rgba(165, 180, 252, 0.4)" />
            <Circle cx="90" cy="160" r="4.5" fill="rgba(165, 180, 252, 0.4)" />
            <Circle cx="100" cy="85" r="4.5" fill="rgba(165, 180, 252, 0.4)" />

            
            <Line x1="140" y1="120" x2="250" y2="70" stroke="#a5b4fc" strokeWidth="2" strokeDasharray="6, 4" />
            
      
            <Line x1="250" y1="70" x2="230" y2="175" stroke="#a5b4fc" strokeWidth="2" strokeDasharray="6, 4" strokeOpacity={0.8} />
          </Svg>

          <TouchableOpacity 
            style={[styles.nodeOperatorContainer, { left: 140 - 22, top: 120 - 22 }]}
            activeOpacity={0.85}
            onPress={() => Alert.alert("My Node", "Node IP: 10.42.0.1\nRole: Operator\nStatus: Active Router")}
          >
            <View style={styles.nodeOperatorCore}>
              <Feather name="user" size={16} color="#ffffff" />
            </View>
          </TouchableOpacity>

         
          <TouchableOpacity 
            style={[styles.nodeRelayContainer, { left: 250 - 30, top: 70 - 25 }]}
            activeOpacity={0.85}
            onPress={() => Alert.alert("Alex (Relay)", "Node IP: 10.42.0.8\nRole: Active Relay Node\nLatency: 18ms")}
          >
            <View style={styles.nodeRelayCore}>
              <View style={styles.nodeInnerTarget} />
            </View>
            <Text style={styles.nodeLabel}>Alex (Relay)</Text>
          </TouchableOpacity>

       
          <TouchableOpacity 
            style={[styles.nodeRelayContainer, { left: 230 - 30, top: 175 - 25 }]}
            activeOpacity={0.85}
            onPress={() => {
              Alert.alert(
                "Sam", 
                "Node IP: 10.42.0.3\nRole: Destination Peer\nLatency: 42ms",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Chat", onPress: () => onStartChat("Sam") }
                ]
              );
            }}
          >
            <View style={styles.nodeRelayCore}>
              <View style={styles.nodeInnerTarget} />
            </View>
            <Text style={styles.nodeLabel}>Sam</Text>
          </TouchableOpacity>
        </View>
      </View>


      <View style={styles.routingBanner}>
        <View style={styles.routingIconWrapper}>
          <MaterialCommunityIcons name="routes" size={24} color="#a5b4fc" />
        </View>
        <Text style={styles.routingText}>
          Your last message reached <Text style={{ fontWeight: 'bold', color: '#ffffff' }}>Sam</Text> through <Text style={{ fontWeight: 'bold', color: '#ffffff' }}>Alex</Text>
        </Text>
      </View>

     
      <View style={styles.bottomGrid}>
        
        <View style={styles.bottomGridBox}>
          <Text style={styles.bottomBoxTitle}>Signal Strength</Text>
          <View style={styles.signalBarsWrapper}>
            <View style={[styles.signalBarItem, { height: 6, backgroundColor: '#818cf8' }]} />
            <View style={[styles.signalBarItem, { height: 10, backgroundColor: '#818cf8' }]} />
            <View style={[styles.signalBarItem, { height: 14, backgroundColor: '#818cf8' }]} />
            <View style={[styles.signalBarItem, { height: 18, backgroundColor: '#1e293b' }]} />
          </View>
        </View>

       
        <View style={styles.bottomGridBox}>
          <Text style={styles.bottomBoxTitle}>Latency</Text>
          <Text style={styles.latencyValue}>42ms</Text>
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
