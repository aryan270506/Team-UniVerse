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
  Platform,
  Modal,
  Alert,
  StatusBar as RNStatusBar
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

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

  return (
    <View style={styles.signalContainer}>
      <View style={styles.signalBars}>
        <MaterialCommunityIcons name="signal-cellular-outline" size={16} color="#4b5563" />
      </View>
      <Text style={[styles.signalText, { color: '#94a3b8' }]}>POOR</Text>
    </View>
  );
};

export default function HomeScreen({
  peers = [],
  onStartChat,
  onTriggerSOS,
  onAddPeer,
  onToggleContactStatus,
  onDeleteChat
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeer, setSelectedPeer] = useState(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showAddNodeModal, setShowAddNodeModal] = useState(false);

  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeIp, setNewNodeIp] = useState('');

  // Radar Animation
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 5000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

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

  const rotateSpin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleLongPress = (peer) => {
    setSelectedPeer(peer);
    setShowOptionsModal(true);
  };

  const handleAddMeshNode = () => {
    if (!newNodeName.trim() || !newNodeIp.trim()) {
      Alert.alert("Error", "Please provide both name and IP address.");
      return;
    }

    const newPeer = {
      name: newNodeName,
      status: 'Connected • Just now',
      level: 'STRONG',
      avatarStatusColor: '#10b981',
      added: true
    };

    onAddPeer(newPeer);
    setShowAddNodeModal(false);
    setNewNodeName('');
    setNewNodeIp('');
    Alert.alert("Success", `${newPeer.name} added to your Mesh network.`);
  };

  const filteredPeers = peers.filter(peer =>
    peer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.contentWrapper}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Peer List */}
        <View style={styles.peerList}>
          {filteredPeers.map((peer, index) => (
            <TouchableOpacity 
              key={index}
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => onStartChat(peer.name)} 
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
          {filteredPeers.length === 0 && (
            <Text style={styles.emptyText}>No peers found matching "{searchQuery}"</Text>
          )}
        </View>

        {/* Radar scanning visualization */}
        <View style={styles.radarContainer}>
          <TouchableOpacity 
            style={styles.radarBackgroundCircle} 
            activeOpacity={0.85}
            onPress={onTriggerSOS}
          >
            <View style={styles.radarRingOuter}>
              <View style={styles.radarRingMiddle}>
                <View style={styles.radarRingInner}>
                  <View style={styles.radarCenterCore}>
                    <View style={styles.radarCoreHighlight} />
                    <View style={styles.radarCorePulse} />
                  </View>
                </View>
              </View>
            </View>

            <Animated.View style={[styles.radarSweepWrapper, { transform: [{ rotate: rotateSpin }] }]}>
              <View style={styles.radarSweepQuadrant} />
            </Animated.View>
          </TouchableOpacity>

          <Animated.Text style={[styles.scanningText, { opacity: pulseAnim }]}>
            Looking for nearby devices...
          </Animated.Text>
        </View>
      </ScrollView>

      {/* Options Modal */}
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
              <TouchableOpacity 
                style={styles.optionItem}
                activeOpacity={0.7}
                onPress={() => {
                  setShowOptionsModal(false);
                  onToggleContactStatus(selectedPeer.name);
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
                        onPress: () => {
                          onDeleteChat(selectedPeer.name);
                          Alert.alert("Deleted", `Chat history with ${selectedPeer ? selectedPeer.name : ''} has been deleted.`);
                        } 
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

      {/* Add Mesh Node Modal */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  contentWrapper: {
    flex: 1,
    position: 'relative',
  },
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
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 20,
  },
  optionsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 10, 18, 0.6)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  glassOptionsCard: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(23, 34, 59, 0.4)', 
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
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  modalCancelButton: {
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
  modalCancelText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '650',
  },
  modalConfirmButton: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
