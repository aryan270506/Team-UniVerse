import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Modal,
  Platform,
  Linking,
  Alert,
  ActivityIndicator,
  Animated,
  StatusBar as RNStatusBar
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { NavigationContainer, createNavigationContainerRef, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { isSignedUp, getDisplayName, getOrCreateDeviceId, getProfilePhoto } from './Helper/UserIdentity';
import { requestNearbyPermissions, isNearbyPermissionResultGranted, checkLocationServicesEnabled } from './Helper/Permission';
import { initDb, getAllPeers, saveMessage, upsertPeer, setPeerConnected, getMessagesWithPeer, deletePeerAndMessages } from './storage/db';
import { normalizePeer } from './services/mesh/peerRegistry';
import { createHandshakeEnvelope, createMessageEnvelope, parseEnvelope } from './services/mesh/messageEnvelope';
import {
  startTransport,
  stopTransport,
  requestConnection,
  acceptConnection,
  rejectConnection,
  disconnectConnection,
  sendMessage,
  onPeerDiscovered,
  onConnectionRequest,
  onPeerConnected,
  onPeerDisconnected,
  onConnectionRejected,
  onPayloadReceived,
  onTransportStatus,
  onTransportError,
} from './services/mesh/meshTransport';

const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();

// Dynamic wrappers to resolve screen components on demand without static top-level imports
const LoginScreen = (props) => {
  const Screen = require('./Screens/login/login').default;
  return <Screen {...props} />;
};
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
const ScannerScreen = (props) => {
  const Screen = require('./Screens/ScannerScreen').default;
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
  setShowConfirmModal,
  onStartChat,
  isSosBroadcastActive
}) {
  return (
    <View style={styles.contentWrapper}>
      {activeTab === 'Peers' && (
        <HomeScreen
          peers={peers}
          onStartChat={onStartChat}
          onTriggerSOS={() => setShowConfirmModal(true)}
          onAddPeer={handleAddPeer}
          onToggleContactStatus={handleToggleContactStatus}
          onDeleteChat={handleDeleteChat}
          onPressRadar={() => navigation.navigate('Map')}
          onPressConnect={() => navigation.navigate('Scanner')}
          isSosBroadcastActive={isSosBroadcastActive}
        />
      )}

      {activeTab === 'Network' && (
        <NetworkScreen
          peers={peers}
          onStartChat={onStartChat}
          isSosBroadcastActive={isSosBroadcastActive}
        />
      )}

      {activeTab === 'Profile' && (
        <ProfileScreen
          peers={peers}
          navigation={navigation}
          onNavigateToNetwork={() => setActiveTab('Network')}
          onNavigateToProfile={() => setActiveTab('Profile')}
        />
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

  const [myDisplayName, setMyDisplayName] = useState('');
  const [myDeviceId, setMyDeviceId] = useState('');
  const [peers, setPeers] = useState([]);
  const [chatSessions, setChatSessions] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSOSOptionsModal, setShowSOSOptionsModal] = useState(false);
  const [selectedPeerOptions, setSelectedPeerOptions] = useState(null);
  const [isSosBroadcastActive, setIsSosBroadcastActive] = useState(false);

  const isAnySosActive = isSosBroadcastActive || peers.some((p) => p.isSosAlertActive);

  const startSosBroadcast = () => {
    setIsSosBroadcastActive(true);
    peers.forEach((peer) => {
      if (peer.connected && peer.endpointId) {
        const envelope = createMessageEnvelope({
          senderId: myDeviceId || 'LOCAL',
          senderName: myDisplayName || 'Me',
          recipientId: peer.deviceId || peer.endpointId,
          type: 'sos',
          payload: { active: true },
          ttl: 5,
        });
        sendMessage(peer.endpointId, envelope);
      }
    });
  };

  const stopSosBroadcast = () => {
    setIsSosBroadcastActive(false);
    peers.forEach((peer) => {
      if (peer.connected && peer.endpointId) {
        const envelope = createMessageEnvelope({
          senderId: myDeviceId || 'LOCAL',
          senderName: myDisplayName || 'Me',
          recipientId: peer.deviceId || peer.endpointId,
          type: 'sos',
          payload: { active: false },
          ttl: 5,
        });
        sendMessage(peer.endpointId, envelope);
      }
    });
  };

  const sosBlinkAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let anim;
    const isOtherSosActive = peers.some(p => p.isSosAlertActive);
    if (isOtherSosActive) {
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(sosBlinkAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(sosBlinkAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          })
        ])
      );
      anim.start();
    } else {
      sosBlinkAnim.setValue(0);
    }
    return () => {
      if (anim) anim.stop();
    };
  }, [peers, sosBlinkAnim]);

  // Bootstrap initial signup verification and database setup
  useEffect(() => {
    async function checkUserSignup() {
      try {
        initDb();
        const signedUp = await isSignedUp();
        if (signedUp) {
          // Request Location/Bluetooth permissions on startup to ensure P2P works
          try {
            await requestNearbyPermissions();
          } catch (pe) {
            console.warn('Failed to request startup permissions:', pe);
          }

          const [displayName, deviceId] = await Promise.all([
            getDisplayName(),
            getOrCreateDeviceId(),
          ]);

          setMyDisplayName(displayName);
          setMyDeviceId(deviceId);

          // Read known peers from local database
          const storedPeers = getAllPeers().map((peer) => normalizePeer({
            id: peer.deviceId || peer.endpointId,
            deviceId: peer.deviceId || peer.endpointId,
            endpointId: peer.endpointId || peer.deviceId,
            displayName: peer.displayName,
            name: peer.displayName,
            connected: false,
            status: 'Offline',
            connectionState: 'offline',
            avatarStatusColor: '#6b7280',
            added: true,
            lastSeen: peer.lastSeen,
          }));

          setPeers(storedPeers);
        }
        setIsUserSignedUp(signedUp);
      } catch (e) {
        console.error('[MeshLink App] Failed to bootstrap app state:', e);
      } finally {
        setLoading(false);
      }
    }
    checkUserSignup();
  }, [isUserSignedUp]);

  // Navigation route listener to automatically activate the mesh nodes once registration completes
  useEffect(() => {
    const unsubscribe = navigationRef.addListener('state', async () => {
      if (navigationRef.isReady() && !isUserSignedUp) {
        const route = navigationRef.getCurrentRoute();
        if (route?.name === 'Main') {
          const signedUp = await isSignedUp();
          if (signedUp) {
            setIsUserSignedUp(true);
          }
        }
      }
    });
    return unsubscribe;
  }, [isUserSignedUp]);

  // Subscribe to Native/Simulated P2P Events when user is authenticated
  useEffect(() => {
    if (!isUserSignedUp) return;

    let subDiscovered, subRequest, subConnected, subDisconnected, subRejected, subPayload, subTransportStatus, subTransportError;

    async function initMesh() {
      try {
        const name = await getDisplayName();
        const id = await getOrCreateDeviceId();
        setMyDisplayName(name);
        setMyDeviceId(id);

        const locationServicesEnabled = await checkLocationServicesEnabled();
        if (!locationServicesEnabled) {
          console.warn('[MeshLink P2P] Location services (GPS) are disabled; not starting transport.');
          Alert.alert(
            'Location Services Required',
            'MeshLink uses peer-to-peer Wi-Fi and Bluetooth to connect offline, which requires Location services (GPS) to be turned ON. Please enable GPS and try again.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
          return;
        }

        const nearbyPermissionResult = await requestNearbyPermissions();
        if (!isNearbyPermissionResultGranted(nearbyPermissionResult)) {
          console.warn('[MeshLink P2P] Nearby permissions are blocked; not starting transport.', nearbyPermissionResult);
          Alert.alert(
            'Nearby permission blocked',
            'MeshLink needs Nearby devices permission to discover phones around you. Open app settings, allow Nearby devices, then reopen MeshLink on both phones.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
          return;
        }

        const updatePeer = (endpointId, nextState) => {
          setPeers((currentPeers) => {
            const index = currentPeers.findIndex((peer) => peer.endpointId === endpointId || peer.id === endpointId || peer.deviceId === endpointId);
            if (index === -1) {
              return currentPeers;
            }

            const updated = normalizePeer({
              ...currentPeers[index],
              ...nextState,
            });

            const nextPeers = [...currentPeers];
            nextPeers[index] = updated;
            return nextPeers;
          });
        };

        const ensurePeer = (endpointId, displayNameValue, extra = {}) => {
          setPeers((currentPeers) => {
            const index = currentPeers.findIndex((peer) => peer.endpointId === endpointId || peer.id === endpointId || peer.deviceId === endpointId || peer.displayName === displayNameValue || peer.name === displayNameValue);
            const nextPeer = normalizePeer({
              id: endpointId,
              deviceId: endpointId,
              endpointId,
              displayName: displayNameValue || 'Nearby Device',
              name: displayNameValue || 'Nearby Device',
              status: extra.status || 'Nearby • Tap to connect',
              connectionState: extra.connectionState || 'discovered',
              connected: !!extra.connected,
              avatarStatusColor: extra.avatarStatusColor || '#fbbf24',
              added: extra.added ?? false,
              lastSeen: Date.now(),
            });

            if (index === -1) {
              return [...currentPeers, nextPeer];
            }

            const merged = normalizePeer({
              ...currentPeers[index],
              ...nextPeer,
              ...extra,
            });

            const nextPeers = [...currentPeers];
            nextPeers[index] = merged;
            return nextPeers;
          });
        };

        // 1. Peer Discovered
        subDiscovered = onPeerDiscovered((event) => {
          let { endpointId, displayName: discoveredName } = event || {};
          if (!endpointId) return;

          let isPeerSos = false;
          if (discoveredName && discoveredName.endsWith('__SOS__')) {
            isPeerSos = true;
            discoveredName = discoveredName.replace('__SOS__', '');
          }

          ensurePeer(endpointId, discoveredName, {
            status: isPeerSos ? '⚠️ SOS ALERT ACTIVE' : 'Nearby • Tap to connect',
            connectionState: 'discovered',
            avatarStatusColor: isPeerSos ? '#ef4444' : '#fbbf24',
            isSosAlertActive: isPeerSos,
          });
        });

        // 2. Incoming Connection Request
        subRequest = onConnectionRequest((event) => {
          let { endpointId, displayName: requestName } = event || {};
          if (!endpointId) return;

          let isPeerSos = false;
          if (requestName && requestName.endsWith('__SOS__')) {
            isPeerSos = true;
            requestName = requestName.replace('__SOS__', '');
          }

          ensurePeer(endpointId, requestName, {
            status: isPeerSos ? '⚠️ SOS ALERT ACTIVE' : 'Connection request',
            connectionState: 'requesting',
            avatarStatusColor: isPeerSos ? '#ef4444' : '#f59e0b',
            isSosAlertActive: isPeerSos,
          });

          Alert.alert(
            'Nearby Connection Request',
            `${requestName || 'Nearby device'} wants to connect to MeshLink.`,
            [
              {
                text: 'Reject',
                style: 'cancel',
                onPress: () => rejectConnection(endpointId),
              },
              {
                text: 'Accept',
                onPress: () => acceptConnection(endpointId),
              },
            ]
          );
        });

        // 3. Connection Established Successfully
        subConnected = onPeerConnected(async (event) => {
          const { endpointId, displayName: connectedName } = event || {};
          if (!endpointId) return;

          let isPeerSos = false;
          if (connectedName && connectedName.endsWith('__SOS__')) {
            isPeerSos = true;
            connectedName = connectedName.replace('__SOS__', '');
          }

          ensurePeer(endpointId, connectedName, {
            status: isPeerSos ? '⚠️ SOS ALERT ACTIVE' : 'Connected • Just now',
            connectionState: 'connected',
            connected: true,
            avatarStatusColor: isPeerSos ? '#ef4444' : '#10b981',
            added: true,
            isSosAlertActive: isPeerSos,
          });

          const currentPhoto = await getProfilePhoto();

          // Send handshake envelope to exchange permanent device IDs
          const handshake = createHandshakeEnvelope({
            senderId: id,
            senderName: name,
            recipientId: endpointId,
            profilePhoto: currentPhoto,
          });
          sendMessage(endpointId, handshake);
        });

        // 4. Peer Disconnected
        subDisconnected = onPeerDisconnected((event) => {
          const { endpointId } = event || {};
          if (!endpointId) return;

          updatePeer(endpointId, {
            status: 'Offline',
            connectionState: 'offline',
            connected: false,
            avatarStatusColor: '#6b7280',
          });
        });

        // 5. Connection Request Rejected
        subRejected = onConnectionRejected((event) => {
          const { endpointId } = event || {};
          if (!endpointId) return;

          updatePeer(endpointId, {
            status: 'Rejected',
            connectionState: 'rejected',
            connected: false,
            avatarStatusColor: '#ef4444',
          });
        });

        // 6. Message Payload Received
        subPayload = onPayloadReceived((event) => {
          const { endpointId, payload } = event || {};
          if (!endpointId || !payload) return;

          const parsed = parseEnvelope(payload);

          if (parsed?.type === 'sos') {
            let active = false;
            if (parsed.payload) {
              try {
                const parsedPayload = typeof parsed.payload === 'string' ? JSON.parse(parsed.payload) : parsed.payload;
                active = !!parsedPayload.active;
              } catch (e) {
                active = !!parsed.active;
              }
            } else {
              active = !!parsed.active;
            }

            setPeers((currentPeers) => {
              return currentPeers.map((p) => {
                if (p.endpointId === endpointId || p.deviceId === parsed.senderId || p.id === endpointId) {
                  return {
                    ...p,
                    isSosAlertActive: active,
                    avatarStatusColor: active ? '#ef4444' : '#10b981',
                    status: active ? '⚠️ SOS ALERT ACTIVE' : 'Connected • Active',
                  };
                }
                return p;
              });
            });
            return;
          }

          const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          setPeers((currentPeers) => {
            const peerIndex = currentPeers.findIndex((peer) => peer.endpointId === endpointId || peer.deviceId === endpointId || peer.id === endpointId);
            const peer = peerIndex >= 0 ? currentPeers[peerIndex] : null;
            const peerKey = peer?.id || endpointId;

            // Handle P2P Handshake Message (Identity Mapping)
            if (parsed?.type === 'handshake') {
              let parsedPayload = {};
              if (parsed?.payload) {
                try {
                  parsedPayload = typeof parsed.payload === 'string' ? JSON.parse(parsed.payload) : parsed.payload;
                } catch (e) {
                  parsedPayload = {};
                }
              }

              const nextDisplayName = parsedPayload?.displayName || parsed?.senderName || peer?.displayName || 'Nearby Device';
              const nextDeviceId = parsedPayload?.deviceId || parsed?.senderId || peer?.deviceId || endpointId;
              const nextProfilePhoto = parsedPayload?.profilePhoto || parsed?.profilePhoto || peer?.profilePhoto || null;

              // Find where the stored/permanent peer is
              const permIndex = currentPeers.findIndex((p) => p.deviceId === nextDeviceId || p.id === nextDeviceId);
              // Find where the temporary endpoint peer is
              const tempIndex = currentPeers.findIndex((p) => p.endpointId === endpointId && p.deviceId !== nextDeviceId);

              const basePeer = permIndex >= 0 ? currentPeers[permIndex] : (tempIndex >= 0 ? currentPeers[tempIndex] : {});

              const updatedPeer = normalizePeer({
                ...basePeer,
                id: nextDeviceId, // Use permanent deviceId as primary key
                deviceId: nextDeviceId,
                endpointId,
                displayName: nextDisplayName,
                name: nextDisplayName,
                connected: true,
                status: 'Online',
                connectionState: 'connected',
                avatarStatusColor: '#10b981',
                added: basePeer.added ?? true,
                profilePhoto: nextProfilePhoto,
              });

              // Save the peer to local SQLite DB
              upsertPeer({
                deviceId: nextDeviceId,
                displayName: nextDisplayName,
                endpointId,
                lastSeen: Date.now(),
                connected: true,
                profilePhoto: nextProfilePhoto,
              });

              let nextPeers = [...currentPeers];

              if (permIndex >= 0) {
                // Update the permanent peer
                nextPeers[permIndex] = updatedPeer;
                // If there's a temporary peer, remove it to prevent duplicates
                if (tempIndex >= 0) {
                  nextPeers = nextPeers.filter((_, idx) => idx !== tempIndex);
                }
              } else if (tempIndex >= 0) {
                // Upgrade temporary peer to permanent peer
                nextPeers[tempIndex] = updatedPeer;
              } else {
                // Add as new peer
                nextPeers.push(updatedPeer);
              }

              return nextPeers;
            }

            // Handle Normal Chat Message
            let msgText = '';
            let msgAttachment = null;
            if (parsed?.payload) {
              try {
                const parsedPayload = typeof parsed.payload === 'string' ? JSON.parse(parsed.payload) : parsed.payload;
                msgText = parsedPayload.text || '';
                msgAttachment = parsedPayload;
              } catch (e) {
                msgText = String(parsed.payload);
              }
            }

            const messageEnvelope = {
              id: parsed?.id || String(Date.now()),
              sender: 'peer',
              text: msgText || parsed?.text || '',
              time: nowTime,
              ...msgAttachment,
              ...parsed,
            };

            const resolvedPeerKey = peer?.id || endpointId;

            setChatSessions((prev) => ({
              ...prev,
              [resolvedPeerKey]: [...(prev[resolvedPeerKey] || []), messageEnvelope],
            }));

            // Save the incoming message to local SQLite DB using permanent senderId if resolved
            saveMessage({
              id: messageEnvelope.id,
              senderId: peer?.deviceId || endpointId,
              recipientId: myDeviceId || 'LOCAL',
              senderName: peer?.displayName || peer?.name || 'Nearby Device',
              type: parsed?.type || 'chat',
              payload: JSON.stringify({ text: messageEnvelope.text, ...msgAttachment }),
              timestamp: Date.now(),
              ttl: 5,
              delivered: true,
            });

            if (peerIndex >= 0) {
              const nextPeers = [...currentPeers];
              nextPeers[peerIndex] = normalizePeer({
                ...currentPeers[peerIndex],
                connected: true,
                status: 'Connected • Active',
                connectionState: 'connected',
                avatarStatusColor: '#10b981',
              });
              return nextPeers;
            }

            return currentPeers;
          });
        });

        subTransportStatus = onTransportStatus((event) => {
          console.log('[MeshLink P2P] Transport status:', event);
        });

        subTransportError = onTransportError((event) => {
          console.warn('[MeshLink P2P] Transport error:', event);
        });

        // Start scanning/advertising only after listeners are attached.
        const advertisingName = isSosBroadcastActive ? `${name}__SOS__` : name;
        startTransport(advertisingName);

      } catch (e) {
        console.error('[MeshLink P2P] Failed to initialize P2P mesh network:', e);
      }
    }

    initMesh();

    return () => {
      try {
        stopTransport();
        subDiscovered?.remove();
        subRequest?.remove();
        subConnected?.remove();
        subDisconnected?.remove();
        subRejected?.remove();
        subPayload?.remove();
        subTransportStatus?.remove();
        subTransportError?.remove();
      } catch (e) {
        console.warn('Failed to clean up mesh node listeners:', e);
      }
    };
  }, [isUserSignedUp, isSosBroadcastActive]);

  const handleAddPeer = (newPeer) => {
    setPeers((prev) => [...prev, normalizePeer(newPeer)]);
  };

  const handleToggleContactStatus = (peerName) => {
    setPeers((prev) => prev.map((p) => {
      if (p.name === peerName || p.displayName === peerName) {
        const updatedStatus = !p.added;
        Alert.alert("Mesh Contact", updatedStatus ? `${peerName} added to contacts.` : `${peerName} removed from contacts.`);
        return { ...p, added: updatedStatus };
      }
      return p;
    }));
  };

  const handleDeleteChat = (peerName) => {
    const resolvedPeer = typeof peerName === 'string' ? peers.find((peer) => peer.id === peerName || peer.name === peerName || peer.displayName === peerName) : peerName;
    const peerKey = resolvedPeer?.id || peerName;
    const deviceId = resolvedPeer?.deviceId || peerKey;

    setChatSessions((prev) => {
      const next = { ...prev };
      delete next[peerKey];
      if (deviceId) delete next[deviceId];
      return next;
    });

    setPeers((prev) => prev.filter((p) => p.id !== peerKey && p.deviceId !== deviceId && p.endpointId !== peerKey));

    if (deviceId) {
      deletePeerAndMessages(deviceId);
    }
  };

  const handleSendChatMessage = (peerKey, text, attachment = null) => {
    const peer = peers.find((item) => item.id === peerKey || item.endpointId === peerKey || item.displayName === peerKey || item.name === peerKey);
    if (!peer) {
      Alert.alert('Connection unavailable', 'That nearby device is not available right now.');
      return;
    }

    if (peer.connectionState !== 'connected' && peer.status !== 'Connected • Just now' && peer.status !== 'Connected • Active' && peer.status !== 'Connected • Handshake complete') {
      Alert.alert('Not connected', 'Connect to the nearby device before sending messages.');
      return;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg = {
      id: String(Date.now()),
      sender: 'me',
      text: text,
      time: timeStr,
      status: 'Delivered',
      ...attachment
    };

    setChatSessions((prev) => ({
      ...prev,
      [peerKey]: [...(prev[peerKey] || []), newMsg]
    }));

    const envelope = createMessageEnvelope({
      senderId: myDeviceId || 'LOCAL',
      senderName: myDisplayName || 'Me',
      recipientId: peer.deviceId || peer.endpointId || peerKey,
      type: 'chat',
      payload: {
        text,
        ...attachment,
      },
      ttl: 5,
    });

    saveMessage({
      ...envelope,
      payload: JSON.stringify({ text, ...attachment }),
      delivered: true,
      senderName: myDisplayName || 'Me',
    });

    sendMessage(peer.endpointId, envelope);
  };

  const handleOpenPeerChat = (peerInput) => {
    const peer = typeof peerInput === 'string'
      ? peers.find((item) => item.id === peerInput || item.endpointId === peerInput || item.displayName === peerInput || item.name === peerInput)
      : peerInput;

    if (!peer) {
      return;
    }

    // Attempt connection request if not already connected
    if (peer.endpointId && peer.connectionState !== 'connected') {
      requestConnection(peer.endpointId, myDisplayName || 'MeshLink');
      setPeers((currentPeers) => currentPeers.map((item) => item.id === peer.id ? {
        ...item,
        status: 'Connecting...',
        connectionState: 'connecting',
        avatarStatusColor: '#f59e0b',
      } : item));
    }

    // Load active chat logs from database
    if (peer.deviceId && myDeviceId) {
      const existingMessages = getMessagesWithPeer(myDeviceId, peer.deviceId).map((row) => {
        let payloadObj = {};
        try {
          payloadObj = JSON.parse(row.payload || '{}');
        } catch (e) {
          payloadObj = { text: row.payload || '' };
        }
        return {
          id: row.id,
          sender: row.senderId === myDeviceId ? 'me' : 'peer',
          text: payloadObj.text || '',
          time: new Date(row.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: row.delivered ? 'Delivered' : 'Pending',
          ...payloadObj,
        };
      });

      setChatSessions((prev) => ({
        ...prev,
        [peer.id]: prev[peer.id]?.length ? prev[peer.id] : existingMessages,
      }));
    }

    if (navigationRef.isReady()) {
      navigationRef.navigate('Chat', { peerName: peer.displayName || peer.name, peerKey: peer.id });
    }
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

  const otherPeers = peers.filter(
    (peer) =>
      peer.id !== myDeviceId &&
      peer.deviceId !== myDeviceId &&
      peer.endpointId !== myDeviceId &&
      peer.name !== myDisplayName &&
      peer.displayName !== myDisplayName
  );

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
                  peers={otherPeers}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  handleAddPeer={handleAddPeer}
                  handleToggleContactStatus={handleToggleContactStatus}
                  handleDeleteChat={handleDeleteChat}
                  setShowConfirmModal={setShowConfirmModal}
                  onStartChat={handleOpenPeerChat}
                  isSosBroadcastActive={isAnySosActive}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Chat">
              {(props) => {
                const peerKey = props.route.params?.peerKey || props.route.params?.peerName;
                const peerName = props.route.params?.peerName;
                const peer = peers.find((item) => item.id === peerKey || item.name === peerName || item.displayName === peerName || item.endpointId === peerKey);
                return (
                  <ChatScreen
                    {...props}
                    peerName={peerName || peer?.displayName || peer?.name || 'Nearby Device'}
                    peerKey={peer?.id || peerKey}
                    peerPhoto={peer?.profilePhoto}
                    connectionState={peer?.connectionState}
                    messages={chatSessions[peer?.id || peerKey] || []}
                    onSendMessage={(text, attachment) => handleSendChatMessage(peer?.id || peerKey, text, attachment)}
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
                  onStopBroadcasting={() => {
                    stopSosBroadcast();
                    props.navigation.goBack();
                  }}
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
                  isSosBroadcastActive={isAnySosActive}
                  onBack={() => props.navigation.goBack()}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Scanner">
              {(props) => (
                <ScannerScreen
                  {...props}
                  onAddPeer={handleAddPeer}
                  onBack={() => props.navigation.goBack()}
                />
              )}
            </Stack.Screen>
          </Stack.Navigator>
        </NavigationContainer>

        {/* SOS Confirmation Modal */}
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
                    startSosBroadcast();
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

        {/* SOS Responder Options Modal */}
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
        {/* Blinking Red Alert Overlay when another device is broadcasting SOS */}
        {peers.some(p => p.isSosAlertActive) && (
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: 'rgba(239, 68, 68, 0.25)',
                opacity: sosBlinkAnim,
                zIndex: 9999,
              }
            ]}
          />
        )}
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
