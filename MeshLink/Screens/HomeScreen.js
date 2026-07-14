import React, { useState, useEffect, useRef } from 'react';
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
  Modal,
  Alert,
  StatusBar as RNStatusBar
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { SafeAreaView as ContextSafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import ChatScreen from './ChatScreen';
import NetworkScreen from './NetworkScreen';

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
  // Navigation / active tab states
  const [activeTab, setActiveTab] = useState('Peers'); // 'Peers', 'Profile', 'Network'
  const [activeChatPeer, setActiveChatPeer] = useState(null); // Displays ChatScreen when not null
  const [isBroadcasting, setIsBroadcasting] = useState(false); // Displays SOS broadcast active screen
  
  // Custom glassmorphic modals state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPeer, setSelectedPeer] = useState(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showAddNodeModal, setShowAddNodeModal] = useState(false);

  // Add Mesh Node Input States
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeIp, setNewNodeIp] = useState('');

  // Network Uptime State (ticking up!)
  const [networkUptime, setNetworkUptime] = useState(18);

  // Dynamic Peer List State
  const [peers, setPeers] = useState([
    { name: 'Sarah Chen', status: 'Connected • 12m', level: 'STRONG', avatarStatusColor: '#10b981', added: true },
    { name: 'Marcus Thorne', status: 'Relay Node • 45m', level: 'FAIR', avatarStatusColor: '#fbbf24', added: true },
    { name: 'Elena Rodriguez', status: 'Offline • 150m', level: 'POOR', avatarStatusColor: '#6b7280', added: false }
  ]);

  // List of nearby responders discovered during SOS broadcast simulation
  const [discoveredSOSPeers, setDiscoveredSOSPeers] = useState([]);

  // Chat History Sessions State
  const [chatSessions, setChatSessions] = useState({
    'Sarah Chen': [
      { id: '1', sender: 'peer', text: 'Hi! I am testing the local mesh node on this channel. Are you receiving?', time: '14:10' },
      { id: '2', sender: 'me', text: 'Acknowledged Sarah, signal is strong.', time: '14:12', status: 'Delivered' }
    ],
    'Marcus Thorne': [
      { id: '1', sender: 'peer', text: 'Standing by as a relay bridge in Old Mill Sector.', time: '13:45' }
    ],
    'Elena Rodriguez': [],
    'Elias Thorne': [
      { id: '1', sender: 'peer', text: 'Signal strength is dropping near the old bridge. Are you still seeing the relay active on your side?', time: '14:26' },
      { id: '2', sender: 'me', text: "Acknowledged. I've re-routed through Node 7. Signal should stabilize in the next 30 seconds.", time: '14:28', status: 'Delivered' },
      { id: '3', sender: 'peer', text: "I'm holding position here. The mesh pulse looks steady for now.", time: '14:30', isLocation: true, locationTitle: 'Shared Location', locationSub: 'Old Mill Sector' },
      { id: '4', sender: 'me', text: 'Copy that. I\'m moving to the north ridge to boost the signal. Keep your SOS on standby just in case.', time: '14:32', status: 'Delivered' }
    ]
  });

  // Animation values for the home screen radar sweep
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.5)).current;

  // Animation values for the active SOS beacon pulse waves
  const pulseRing1 = useRef(new Animated.Value(0)).current;
  const pulseRing2 = useRef(new Animated.Value(0)).current;
  const pulseRing3 = useRef(new Animated.Value(0)).current;

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

  // Handle active SOS broadcasting waves propagation and peer discovery simulation
  useEffect(() => {
    if (isBroadcasting) {
      setDiscoveredSOSPeers([]);

      // Trigger wave animations
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

      // Simulate discovery of nearby IP addresses
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
    } else {
      setDiscoveredSOSPeers([]);
    }
  }, [isBroadcasting, pulseRing1, pulseRing2, pulseRing3]);

  // Network uptime increment counter
  useEffect(() => {
    let interval;
    if (activeTab === 'Network') {
      interval = setInterval(() => {
        setNetworkUptime(prev => prev + 1);
      }, 60000);
    }
    return () => clearInterval(interval);
  }, [activeTab]);

  // Interpolation for 360 degree rotation
  const rotateSpin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Interpolations for propagating emergency signal waves
  const scale1 = pulseRing1.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] });
  const opacity1 = pulseRing1.interpolate({ inputRange: [0, 0.75, 1], outputRange: [0.8, 0.35, 0] });

  const scale2 = pulseRing2.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] });
  const opacity2 = pulseRing2.interpolate({ inputRange: [0, 0.75, 1], outputRange: [0.8, 0.35, 0] });

  const scale3 = pulseRing3.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] });
  const opacity3 = pulseRing3.interpolate({ inputRange: [0, 0.75, 1], outputRange: [0.8, 0.35, 0] });

  const triggerSOS = () => {
    setShowConfirmModal(true);
  };

  const handleLongPress = (peer) => {
    setSelectedPeer(peer);
    setShowOptionsModal(true);
  };

  const handleAddMeshNode = () => {
    if (!newNodeName.trim() || !newNodeIp.trim()) {
      Alert.alert("Error", "Please provide both name and IP address.");
      return;
    }

    // Add to peers state
    const newPeer = {
      name: newNodeName,
      status: 'Connected • Just now',
      level: 'STRONG',
      avatarStatusColor: '#10b981',
      added: true
    };

    setPeers(prev => [...prev, newPeer]);
    setShowAddNodeModal(false);
    setNewNodeName('');
    setNewNodeIp('');
    Alert.alert("Success", `${newPeer.name} added to your Mesh network.`);
  };

  const toggleContactStatus = (peerName) => {
    setPeers(prev => prev.map(p => {
      if (p.name === peerName) {
        const updatedStatus = !p.added;
        Alert.alert("Mesh Contact", updatedStatus ? `${peerName} added to contacts.` : `${peerName} removed from contacts.`);
        return { ...p, added: updatedStatus };
      }
      return p;
    }));
  };

  // Action to send a new chat message
  const handleSendChatMessage = (text, attachment = null) => {
    if ((!text.trim() && !attachment) || !activeChatPeer) return;

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    const newMsg = {
      id: String(Date.now()),
      sender: 'me',
      text: text,
      time: timeStr,
      status: 'Delivered',
      ...attachment
    };

    // Update active chat sessions history
    setChatSessions(prev => ({
      ...prev,
      [activeChatPeer]: [...(prev[activeChatPeer] || []), newMsg]
    }));
  };

  // Load chat messages list for current active chat peer node
  const activeMessages = activeChatPeer ? (chatSessions[activeChatPeer] || []) : [];

  return (
    <ContextSafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#080e1b" />
      
      {/* 1. SOS Broadcast Screen Overlay */}
      {isBroadcasting && (
        <ScrollView contentContainerStyle={styles.sosScrollContentContainer} style={styles.sosScrollView}>
          <StatusBar barStyle="light-content" backgroundColor="#080d19" />
          <View style={styles.sosContent}>
            
            {/* Unified Console Section matching reference screenshot layout */}
            <View style={styles.sosConsoleWrapper}>
              
              {/* Outer Ring */}
              <View style={styles.sosConsoleRingOuter}>
                {/* Middle Ring */}
                <View style={styles.sosConsoleRingMiddle}>
                  
                  {/* Checkmark circle overlapping top middle border */}
                  <View style={styles.sosConsoleCheckmarkOutline}>
                    <View style={styles.sosCheckmarkHighlight} />
                    <Feather name="check" size={28} color="#fca5a5" />
                  </View>

                  {/* Text contents framed inside the middle circle */}
                  <View style={styles.sosConsoleInnerContent}>
                    <Text style={styles.sosConsoleHeadline}>SOS BROADCAST ACTIVE</Text>
                    <Text style={styles.sosConsoleSubheadline}>Sent to everyone nearby</Text>
                    <Text style={styles.sosConsoleDescription}>Mesh network acknowledges receipt by 8 peers</Text>
                    
                    {/* Stop Button inside console */}
                    <TouchableOpacity 
                      style={styles.sosConsoleStopButton} 
                      activeOpacity={0.8}
                      onPress={() => setIsBroadcasting(false)}
                    >
                      <Text style={styles.sosConsoleStopText}>Stop Broadcasting</Text>
                    </TouchableOpacity>
                  </View>

                </View>
              </View>

              {/* Dynamic expanding wave pulses */}
              <Animated.View style={[styles.sosConsolePulseWave, { transform: [{ scale: scale1 }], opacity: opacity1 }]} />
              <Animated.View style={[styles.sosConsolePulseWave, { transform: [{ scale: scale2 }], opacity: opacity2 }]} />
              <Animated.View style={[styles.sosConsolePulseWave, { transform: [{ scale: scale3 }], opacity: opacity3 }]} />
            </View>

            {/* Dynamic Responders List rendering below the animated circular console */}
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
                              handleLongPress(matchedPeer);
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
      )}

      {/* 2. High-Fidelity Chat Screen */}
      {!isBroadcasting && activeChatPeer && (
        <ChatScreen
          peerName={activeChatPeer}
          messages={activeMessages}
          onSendMessage={handleSendChatMessage}
          onBack={() => setActiveChatPeer(null)}
          onTabChange={(tab) => {
            setActiveChatPeer(null);
            setActiveTab(tab);
          }}
          triggerSOS={triggerSOS}
        />
      )}

      {/* 3. Normal Dashboard View (Peers / Profile / Network) */}
      {!isBroadcasting && !activeChatPeer && (
        <View style={styles.contentWrapper}>
          {/* Conditionally Render tab content */}
          {activeTab === 'Peers' && (
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
                    <Text style={styles.statusText}>{peers.length} people nearby</Text>
                  </View>
                </View>

                <View style={styles.headerRightButtons}>
                  <TouchableOpacity 
                    style={[styles.iconButton, { marginRight: 10 }]}
                    activeOpacity={0.7}
                    onPress={() => setShowAddNodeModal(true)}
                  >
                    <Feather name="user-plus" size={18} color="#a5b4fc" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="connection" size={24} color="#a5b4fc" />
                  </TouchableOpacity>
                </View>
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
                {peers.map((peer, index) => (
                  <TouchableOpacity 
                    key={index}
                    style={styles.card}
                    activeOpacity={0.8}
                    onPress={() => setActiveChatPeer(peer.name)} // Single tap starts chat directly!
                    onLongPress={() => handleLongPress(peer)}
                  >
                    <View style={styles.avatarContainer}>
                      <View style={styles.avatar}>
                        <Feather name="image" size={18} color="#4f46e5" />
                      </View>
                      <View style={[styles.avatarStatus, { backgroundColor: peer.avatarStatusColor }]} />
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.peerName}>
                        {peer.name} {peer.added && <Feather name="user-check" size={12} color="#10b981" />}
                      </Text>
                      <Text style={styles.peerStatus}>{peer.status}</Text>
                    </View>
                    <SignalIndicator level={peer.level} />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Device Finding Radar Container */}
              <View style={styles.radarContainer}>
                {/* Wrap the background circle in a TouchableOpacity to trigger confirmation */}
                <TouchableOpacity 
                  style={styles.radarBackgroundCircle} 
                  activeOpacity={0.85}
                  onPress={triggerSOS}
                >
                  {/* Concentric Circles */}
                  <View style={styles.radarRingOuter}>
                    <View style={styles.radarRingMiddle}>
                      <View style={styles.radarRingInner}>
                        {/* Glowing core node with 3D water droplet effect */}
                        <View style={styles.radarCenterCore}>
                          <View style={styles.radarCoreHighlight} />
                          <View style={styles.radarCorePulse} />
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Rotating radar sweep blade */}
                  <Animated.View style={[styles.radarSweepWrapper, { transform: [{ rotate: rotateSpin }] }]}>
                    <View style={styles.radarSweepQuadrant} />
                  </Animated.View>
                </TouchableOpacity>

                <Animated.Text style={[styles.scanningText, { opacity: pulseAnim }]}>
                  Looking for nearby devices...
                </Animated.Text>
              </View>

            </ScrollView>
          )}

          {/* Profile Tab View */}
          {activeTab === 'Profile' && (
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {/* Header Section */}
              <View style={styles.header}>
                <View style={styles.titleRow}>
                  <MaterialCommunityIcons name="account" size={24} color="#a5b4fc" style={{ marginRight: 8 }} />
                  <Text style={styles.headerTitle}>My Profile</Text>
                </View>
              </View>

              {/* Profile Detail Card */}
              <View style={styles.profileCard}>
                <View style={styles.profileAvatarLarge}>
                  <Feather name="user" size={48} color="#818cf8" />
                </View>
                <Text style={styles.profileName}>Mesh Operator</Text>
                <Text style={styles.profileIpText}>Node IP: 10.42.0.1</Text>
                
                <View style={styles.separator} />
                
                {/* Stats Grid */}
                <View style={styles.profileStatsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>{peers.filter(p => p.added).length}</Text>
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

              {/* Profile Options */}
              <View style={{ marginTop: 12 }}>
                <TouchableOpacity style={styles.profileOptionButton}>
                  <Feather name="sliders" size={18} color="#a5b4fc" style={{ marginRight: 12 }} />
                  <Text style={styles.profileOptionText}>Configure Transceiver</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.profileOptionButton}>
                  <Feather name="file-text" size={18} color="#a5b4fc" style={{ marginRight: 12 }} />
                  <Text style={styles.profileOptionText}>Export Message Logs</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.profileOptionButton}>
                  <Feather name="bluetooth" size={18} color="#a5b4fc" style={{ marginRight: 12 }} />
                  <Text style={styles.profileOptionText}>Pair with Bluetooth Module</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

          {/* Network Tab View (matching mockup reference) */}
          {activeTab === 'Network' && (
            <NetworkScreen
              onStartChat={(peerName) => {
                setActiveChatPeer(peerName);
              }}
            />
          )}

          {/* Floating Alert Beacon Button (positioned relative to container, above bottom tab bar) */}
          <TouchableOpacity style={styles.floatingBeaconButton} activeOpacity={0.8} onPress={() => setActiveTab('Network')}>
            <MaterialCommunityIcons name="map-marker-radius" size={28} color="#ffffff" />
          </TouchableOpacity>

          {/* Bottom Tab Navigation Bar */}
          <View style={styles.bottomTabBar}>
            {/* Peers Tab */}
            <TouchableOpacity 
              style={styles.tabItem} 
              activeOpacity={0.7}
              onPress={() => setActiveTab('Peers')}
            >
              {activeTab === 'Peers' ? (
                <View style={styles.activeTabHighlight}>
                  <MaterialCommunityIcons name="account-group" size={22} color="#ffffff" />
                </View>
              ) : (
                <MaterialCommunityIcons name="account-group" size={24} color="#94a3b8" style={styles.inactiveIcon} />
              )}
              <Text style={[styles.tabLabel, activeTab === 'Peers' && styles.activeTabLabel]}>Peers</Text>
            </TouchableOpacity>

            {/* Profile Tab (Replaced Chat Tab) */}
            <TouchableOpacity 
              style={styles.tabItem} 
              activeOpacity={0.7}
              onPress={() => setActiveTab('Profile')}
            >
              {activeTab === 'Profile' ? (
                <View style={styles.activeTabHighlight}>
                  <MaterialCommunityIcons name="account" size={22} color="#ffffff" />
                </View>
              ) : (
                <MaterialCommunityIcons name="account-outline" size={24} color="#94a3b8" style={styles.inactiveIcon} />
              )}
              <Text style={[styles.tabLabel, activeTab === 'Profile' && styles.activeTabLabel]}>Profile</Text>
            </TouchableOpacity>

            {/* SOS Tab */}
            <TouchableOpacity style={styles.tabItem} activeOpacity={0.7} onPress={triggerSOS}>
              <MaterialCommunityIcons name="signal-variant" size={24} color="#94a3b8" style={styles.inactiveIcon} />
              <Text style={styles.tabLabel}>SOS</Text>
            </TouchableOpacity>

            {/* Network Tab */}
            <TouchableOpacity 
              style={styles.tabItem} 
              activeOpacity={0.7}
              onPress={() => setActiveTab('Network')}
            >
              {activeTab === 'Network' ? (
                <View style={styles.activeTabHighlight}>
                  <MaterialCommunityIcons name="earth" size={22} color="#ffffff" />
                </View>
              ) : (
                <MaterialCommunityIcons name="earth" size={24} color="#94a3b8" style={styles.inactiveIcon} />
              )}
              <Text style={[styles.tabLabel, activeTab === 'Network' && styles.activeTabLabel]}>Network</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Global Modals: always rendered and overlaying any screen in the stack */}
      
      {/* Custom Glassmorphic Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={30} tint="dark" style={styles.glassModalCard}>
            <View style={styles.modalHeaderIcon}>
              <MaterialCommunityIcons name="alert-decagram-outline" size={40} color="#fca5a5" />
            </View>
            <Text style={styles.modalTitle}>Start SOS Broadcast</Text>
            <Text style={styles.modalDescription}>
              Are you sure you want to start broadcasting an emergency SOS to everyone nearby?
            </Text>
            
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity 
                style={styles.modalCancelButton} 
                activeOpacity={0.8}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalConfirmButton} 
                activeOpacity={0.8}
                onPress={() => {
                  setShowConfirmModal(false);
                  setIsBroadcasting(true);
                }}
              >
                <Text style={styles.modalConfirmText}>Broadcast</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </Modal>

      {/* Custom Glassmorphic Peer Options Modal (on long press / three-dot tap) */}
      <Modal
        visible={showOptionsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <View style={styles.optionsModalOverlay}>
          <BlurView intensity={35} tint="dark" style={styles.glassOptionsCard}>
            <Text style={styles.optionsModalTitle}>{selectedPeer ? selectedPeer.name : ''}</Text>
            
            <View style={styles.optionsList}>
              {/* Option 1: Add/Remove Contact (Replaced Chat) */}
              <TouchableOpacity 
                style={styles.optionItem}
                activeOpacity={0.7}
                onPress={() => {
                  setShowOptionsModal(false);
                  toggleContactStatus(selectedPeer.name);
                }}
              >
                <Feather 
                  name={selectedPeer && selectedPeer.added ? "user-minus" : "user-plus"} 
                  size={20} 
                  color="#a5b4fc" 
                  style={styles.optionIcon} 
                />
                <Text style={styles.optionText}>
                  {selectedPeer && selectedPeer.added ? "Remove Contact" : "Add Contact"}
                </Text>
              </TouchableOpacity>
              
              {/* Option 2: Delete Chat */}
              <TouchableOpacity 
                style={[styles.optionItem, styles.deleteOptionItem]}
                activeOpacity={0.7}
                onPress={() => {
                  setShowOptionsModal(false);
                  Alert.alert(
                    "Delete Chat", 
                    `Are you sure you want to delete all chat history with ${selectedPeer ? selectedPeer.name : ''}?`,
                    [
                      { text: "Cancel", style: "cancel" },
                      { 
                        text: "Delete", 
                        style: "destructive", 
                        onPress: () => Alert.alert("Deleted", `Chat history with ${selectedPeer ? selectedPeer.name : ''} has been deleted.`) 
                      }
                    ]
                  );
                }}
              >
                <Feather name="trash-2" size={20} color="#f87171" style={styles.optionIcon} />
                <Text style={[styles.optionText, styles.deleteOptionText]}>Delete Chat</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.optionsCancelButton}
              activeOpacity={0.8}
              onPress={() => setShowOptionsModal(false)}
            >
              <Text style={styles.optionsCancelText}>Cancel</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>

      {/* Custom Glassmorphic Add Mesh Node Modal */}
      <Modal
        visible={showAddNodeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddNodeModal(false)}
      >
        <View style={styles.newNodeModalOverlay}>
          <BlurView intensity={30} tint="dark" style={styles.glassAddNodeCard}>
            <Text style={styles.addNodeTitle}>Add Mesh Node</Text>
            
            <Text style={styles.inputLabel}>NODE NAME</Text>
            <View style={styles.modalInputContainer}>
              <TextInput
                placeholder="e.g. Julian Vance"
                placeholderTextColor="#4b5563"
                style={styles.modalTextInput}
                value={newNodeName}
                onChangeText={setNewNodeName}
              />
            </View>

            <Text style={styles.inputLabel}>IP ADDRESS</Text>
            <View style={styles.modalInputContainer}>
              <TextInput
                placeholder="e.g. 10.42.0.25"
                placeholderTextColor="#4b5563"
                style={styles.modalTextInput}
                value={newNodeIp}
                onChangeText={setNewNodeIp}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity 
                style={styles.modalCancelButton} 
                activeOpacity={0.8}
                onPress={() => {
                  setShowAddNodeModal(false);
                  setNewNodeName('');
                  setNewNodeIp('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalConfirmButton} 
                activeOpacity={0.8}
                onPress={handleAddMeshNode}
              >
                <Text style={styles.modalConfirmText}>Add Node</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </Modal>

    </ContextSafeAreaView>
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
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(165, 180, 252, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#a5b4fc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
  },
  radarCoreHighlight: {
    position: 'absolute',
    top: 4,
    left: 6,
    width: 8,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    transform: [{ rotate: '-35deg' }],
  },
  radarCorePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#c7d2fe',
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
    backgroundColor: 'rgba(165, 180, 252, 0.08)',
    borderLeftWidth: 1.5,
    borderLeftColor: 'rgba(165, 180, 252, 0.25)',
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
  
  // SOS BROADCAST ACTIVE SCROLL CONTAINER
  sosScrollView: {
    flex: 1,
    backgroundColor: '#050a12',
  },
  sosScrollContentContainer: {
    paddingBottom: 40,
    paddingTop: 20,
  },
  sosContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 24,
  },
  
  // CONSOLE STYLING (matching screenshot)
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
    width: 380,
    height: 380,
    borderRadius: 190,
    borderWidth: 1.5,
    borderColor: 'rgba(248, 113, 113, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosConsoleRingMiddle: {
    width: 290,
    height: 290,
    borderRadius: 145,
    borderWidth: 1.5,
    borderColor: 'rgba(248, 113, 113, 0.28)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: 'rgba(5, 10, 18, 0.4)',
  },
  sosConsoleCheckmarkOutline: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: 'rgba(248, 113, 113, 0.45)',
    backgroundColor: '#050a12',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -29,
    alignSelf: 'center',
    shadowColor: '#fca5a5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 10,
  },
  sosCheckmarkHighlight: {
    position: 'absolute',
    top: 6,
    left: 8,
    width: 14,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    transform: [{ rotate: '-35deg' }],
  },
  sosConsolePulseWave: {
    position: 'absolute',
    width: 290,
    height: 290,
    borderRadius: 145,
    borderWidth: 1.5,
    borderColor: 'rgba(248, 113, 113, 0.4)',
  },
  sosConsoleInnerContent: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 36,
  },
  sosConsoleHeadline: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 0.6,
  },
  sosConsoleSubheadline: {
    fontSize: 14,
    color: '#fca5a5',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  sosConsoleDescription: {
    fontSize: 12.5,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  sosConsoleStopButton: {
    height: 42,
    paddingHorizontal: 24,
    borderRadius: 21,
    backgroundColor: 'rgba(27, 35, 51, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sosConsoleStopText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  
  // GLASSMORPHIC CONFIRMATION MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 10, 18, 0.7)', // dark tint overlay
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  glassModalCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(23, 34, 59, 0.35)', // frosted glass background color
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeaderIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.2)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalCancelText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#b91c1c',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  modalConfirmText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },

  // GLASSMORPHIC OPTIONS BOTTOM-SHEET MODAL STYLES
  optionsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 10, 18, 0.65)',
    justifyContent: 'flex-end', // slide up bottom sheet style!
    padding: 16,
  },
  glassOptionsCard: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(23, 34, 59, 0.4)', // frosted glass
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
    marginBottom: Platform.OS === 'ios' ? 24 : 8,
  },
  optionsModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  optionsList: {
    width: '100%',
    marginBottom: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  deleteOptionItem: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.15)',
  },
  optionIcon: {
    marginRight: 12,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  deleteOptionText: {
    color: '#f87171',
  },
  optionsCancelButton: {
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionsCancelText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },

  // PROFILE TAB SPECIFIC STYLES
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

  // DYNAMIC BROADCAST SCREEN RESPONDERS STYLES
  sosPeersList: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  sosPeersHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fca5a5',
    letterSpacing: 1.2,
    marginBottom: 12,
    textAlign: 'center',
  },
  sosPeerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
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
    fontWeight: 'bold',
    color: '#ffffff',
  },
  sosPeerOptionsButton: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 4,
  },
  sosPeerIp: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  ackBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  ackBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#10b981',
  },

  // ADD NEW MESH NODE MODAL STYLES
  newNodeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 10, 18, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  glassAddNodeCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(23, 34, 59, 0.35)',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  addNodeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 6,
    alignSelf: 'flex-start',
    letterSpacing: 0.5,
  },
  modalInputContainer: {
    width: '100%',
    height: 44,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  modalTextInput: {
    color: '#ffffff',
    fontSize: 14,
  },

  // NETWORK DIAGNOSTICS & TOPOLOGY STYLES
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
    borderWidth: 2,
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
