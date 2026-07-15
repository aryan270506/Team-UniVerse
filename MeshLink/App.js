import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Modal,
  Platform,
  Alert,
  ActivityIndicator,
  StatusBar as RNStatusBar
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { NavigationContainer, createNavigationContainerRef, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { isSignedUp } from './Helper/UserIdentity';


const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();

// Dynamic wrappers to resolve screen components on demand without static top-level imports

const LoginScreen = (props) => {
  const Screen = require('./Screens/login/login').default;
  return <Screen {...props} />;
}
const AccountScreen = (props) => {
  const Screen = require('./Screens/login/account').default;
  return <Screen {...props} />;
};
const PinScreen = (props) => {
  const Screen = require('./Screens/login/pin').default;
  return <Screen {...props} />;
};
const HomeScreen = (props) => {
  const Screen = require('./Screens/HomeScreen').default;
  return <Screen {...props} />;
};
const ChatScreen = (props) => {
  const Screen = require('./Screens/ChatScreen').default;
  return <Screen {...props} />;
};
const NetworkScreen = (props) => {
  const Screen = require('./Screens/NetworkScreen').default;
  return <Screen {...props} />;
};
const ProfileScreen = (props) => {
  const Screen = require('./Screens/ProfileScreen').default;
  return <Screen {...props} />;
};
const SOSScreen = (props) => {
  const Screen = require('./Screens/SOSScreen').default;
  return <Screen {...props} />;
};
const MapScreen = (props) => {
  const Screen = require('./Screens/MapScreen').default;
  return <Screen {...props} />;
};

function MainTabsScreen({
  navigation,
  peers,
  activeTab,
  setActiveTab,
  handleAddPeer,
  handleToggleContactStatus,
  handleDeleteChat,
  setShowConfirmModal
}) {
  return (
    <View style={styles.contentWrapper}>
      {activeTab === 'Peers' && (
        <HomeScreen
          peers={peers}
          onStartChat={(peerName) => navigation.navigate('Chat', { peerName })}
          onTriggerSOS={() => setShowConfirmModal(true)}
          onAddPeer={handleAddPeer}
          onToggleContactStatus={handleToggleContactStatus}
          onDeleteChat={handleDeleteChat}
          onPressRadar={() => navigation.navigate('Map')}
        />
      )}

      {activeTab === 'Network' && (
        <NetworkScreen
          onStartChat={(peerName) => navigation.navigate('Chat', { peerName })}
        />
      )}

      {activeTab === 'Profile' && (
        <ProfileScreen peers={peers} />
      )}

      <View style={styles.bottomTabBar}>
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

        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7} onPress={() => setShowConfirmModal(true)}>
          <MaterialCommunityIcons name="signal-variant" size={24} color="#94a3b8" style={styles.inactiveIcon} />
          <Text style={styles.tabLabel}>SOS</Text>
        </TouchableOpacity>

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
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [isUserSignedUp, setIsUserSignedUp] = useState(false);
  const [activeTab, setActiveTab] = useState('Peers');

  useEffect(() => {
    async function checkUserSignup() {
      try {
        const signedUp = await isSignedUp();
        setIsUserSignedUp(signedUp);
      } catch (e) {
        console.error('Failed to check user signup state', e);
      } finally {
        setLoading(false);
      }
    }
    checkUserSignup();
  }, []);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSOSOptionsModal, setShowSOSOptionsModal] = useState(false);
  const [selectedPeerOptions, setSelectedPeerOptions] = useState(null);

  const [peers, setPeers] = useState([
    { name: 'Sarah Chen', status: 'Connected • 12m', level: 'STRONG', avatarStatusColor: '#10b981', added: true },
    { name: 'Marcus Thorne', status: 'Relay Node • 45m', level: 'FAIR', avatarStatusColor: '#fbbf24', added: true },
    { name: 'Elena Rodriguez', status: 'Offline • 150m', level: 'POOR', avatarStatusColor: '#6b7280', added: false }
  ]);

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

  const handleAddPeer = (newPeer) => {
    setPeers(prev => [...prev, newPeer]);
  };

  const handleToggleContactStatus = (peerName) => {
    setPeers(prev => prev.map(p => {
      if (p.name === peerName) {
        const updatedStatus = !p.added;
        Alert.alert("Mesh Contact", updatedStatus ? `${peerName} added to contacts.` : `${peerName} removed from contacts.`);
        return { ...p, added: updatedStatus };
      }
      return p;
    }));
  };

  const handleDeleteChat = (peerName) => {
    setChatSessions(prev => ({
      ...prev,
      [peerName]: []
    }));
  };

  const handleSendChatMessage = (peerName, text, attachment = null) => {
    if (!text.trim() && !attachment) return;

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

    setChatSessions(prev => ({
      ...prev,
      [peerName]: [...(prev[peerName] || []), newMsg]
    }));
  };

  const navTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: '#080d19',
      card: '#080d19',
      text: '#ffffff',
      border: 'transparent',
      notification: '#ef4444',
      primary: '#1d4ed8',
    },
  };

  if (loading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#3F7FFF" />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <NavigationContainer ref={navigationRef} theme={navTheme}>
          <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={isUserSignedUp ? "Pin" : "Login"}>
            <Stack.Screen name="Login">
              {(props) => (
                <LoginScreen
                  {...props}
                  onLoginSuccess={() => props.navigation.replace('Main')}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Pin">
              {(props) => <PinScreen {...props} />}
            </Stack.Screen>
            <Stack.Screen name="CreateAccount">
              {(props) => <AccountScreen {...props} />}
            </Stack.Screen>
            <Stack.Screen name="Main">
              {(props) => (
                <MainTabsScreen
                  {...props}
                  peers={peers}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  handleAddPeer={handleAddPeer}
                  handleToggleContactStatus={handleToggleContactStatus}
                  handleDeleteChat={handleDeleteChat}
                  setShowConfirmModal={setShowConfirmModal}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Chat">
              {(props) => {
                const peerName = props.route.params?.peerName;
                return (
                  <ChatScreen
                    {...props}
                    peerName={peerName}
                    messages={chatSessions[peerName] || []}
                    onSendMessage={(text, attachment) => handleSendChatMessage(peerName, text, attachment)}
                    onBack={() => props.navigation.goBack()}
                    onTabChange={(tab) => {
                      setActiveTab(tab);
                      props.navigation.goBack();
                    }}
                    triggerSOS={() => {
                      setShowConfirmModal(true);
                    }}
                  />
                );
              }}
            </Stack.Screen>
            <Stack.Screen name="SOS">
              {(props) => (
                <SOSScreen
                  {...props}
                  peers={peers}
                  onStopBroadcasting={() => props.navigation.goBack()}
                  onSelectPeerOptions={(peer) => {
                    setSelectedPeerOptions(peer);
                    setShowSOSOptionsModal(true);
                  }}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Map">
              {(props) => (
                <MapScreen
                  {...props}
                  peers={peers}
                  onBack={() => props.navigation.goBack()}
                />
              )}
            </Stack.Screen>
          </Stack.Navigator>
        </NavigationContainer>

        {/* SOS Confirmation */}
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
                    if (navigationRef.isReady()) {
                      navigationRef.navigate('SOS');
                    }
                  }}
                >
                  <Text style={styles.modalConfirmText}>Broadcast</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>
        </Modal>

        {/* SOS Responder */}
        <Modal
          visible={showSOSOptionsModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowSOSOptionsModal(false)}
        >
          <View style={styles.optionsModalOverlay}>
            <BlurView intensity={35} tint="dark" style={styles.glassOptionsCard}>
              <Text style={styles.optionsModalTitle}>{selectedPeerOptions ? selectedPeerOptions.name : ''}</Text>

              <View style={styles.optionsList}>
                <TouchableOpacity
                  style={styles.optionItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    setShowSOSOptionsModal(false);
                    handleToggleContactStatus(selectedPeerOptions.name);
                  }}
                >
                  <Feather
                    name={selectedPeerOptions && selectedPeerOptions.added ? "user-minus" : "user-plus"}
                    size={20}
                    color="#a5b4fc"
                    style={styles.optionIcon}
                  />
                  <Text style={styles.optionText}>
                    {selectedPeerOptions && selectedPeerOptions.added ? "Remove Contact" : "Add Contact"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.optionItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    setShowSOSOptionsModal(false);
                    if (navigationRef.isReady()) {
                      navigationRef.navigate('Main');
                      navigationRef.navigate('Chat', { peerName: selectedPeerOptions.name });
                    }
                  }}
                >
                  <Feather name="message-square" size={20} color="#a5b4fc" style={styles.optionIcon} />
                  <Text style={styles.optionText}>Open Chat</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.optionsCancelButton}
                activeOpacity={0.8}
                onPress={() => setShowSOSOptionsModal(false)}
              >
                <Text style={styles.optionsCancelText}>Cancel</Text>
              </TouchableOpacity>
            </BlurView>
          </View>
        </Modal>

      </SafeAreaView>
    </SafeAreaProvider>
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
  bottomTabBar: {
    height: 68,
    backgroundColor: '#050a12',
    borderTopWidth: 1,
    borderTopColor: '#111827',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 4 : 0,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 10, 18, 0.7)',
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
    backgroundColor: 'rgba(23, 34, 59, 0.35)',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    alignItems: 'center',
  },
  modalHeaderIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
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
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
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
  optionIcon: {
    marginRight: 12,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e2e8f0',
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
});