import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import * as Battery from 'expo-battery';
import QRCode from 'react-native-qrcode-svg';
import {
  getDisplayName,
  setDisplayName as saveDisplayName,
  getPin,
  setPin,
  getOrCreateDeviceId,
  getProfilePhoto,
  setProfilePhoto,
  resetIdentity,
} from '../Helper/UserIdentity';

// ─── Setting Row ──────────────────────────────────────────────────────────────
const SettingRow = ({ icon, label, onPress, danger = false, subLabel = null, rightIcon = 'chevron-right' }) => (
  <TouchableOpacity style={styles.settingRow} activeOpacity={0.7} onPress={onPress}>
    <View style={styles.settingLeft}>
      <View style={[styles.settingIconWrap, danger && styles.settingIconDanger]}>
        <MaterialCommunityIcons name={icon} size={18} color={danger ? '#ef4444' : '#a5b4fc'} />
      </View>
      <View>
        <Text style={[styles.settingLabel, danger && styles.settingLabelDanger]}>{label}</Text>
        {subLabel ? <Text style={styles.settingSubLabel}>{subLabel}</Text> : null}
      </View>
    </View>
    <MaterialCommunityIcons name={rightIcon} size={18} color={danger ? '#f59e0b' : '#475569'} />
  </TouchableOpacity>
);

// ─── PIN Keypad ───────────────────────────────────────────────────────────────
const PIN_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];
const PinKeypad = ({ onKey }) => (
  <View style={pinStyles.keypad}>
    {PIN_KEYS.map((k, i) => (
      <TouchableOpacity
        key={i}
        activeOpacity={k === '' ? 1 : 0.65}
        onPress={() => k !== '' && onKey(k)}
        style={[pinStyles.key, k === '' && pinStyles.keyEmpty]}
      >
        {k !== '' && (
          <Text style={k === '⌫' ? pinStyles.keyBackspace : pinStyles.keyText}>{k}</Text>
        )}
      </TouchableOpacity>
    ))}
  </View>
);

const pinStyles = StyleSheet.create({
  keypad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 },
  key: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(30,42,70,0.75)',
    alignItems: 'center', justifyContent: 'center',
    margin: 8,
    borderWidth: 1, borderColor: 'rgba(201,212,255,0.08)',
  },
  keyEmpty: { backgroundColor: 'transparent', borderColor: 'transparent' },
  keyText: { color: '#C9D4FF', fontSize: 22, fontWeight: '500' },
  keyBackspace: { color: '#9EB1FF', fontSize: 20 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ProfileScreen({ peers = [], onNavigateToNetwork, navigation }) {
  const [displayName, setDisplayName] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [profilePhoto, setProfilePhotoState] = useState(null);
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Load all data on mount ──
  useEffect(() => {
    async function loadData() {
      try {
        const [name, id, photo, battery] = await Promise.all([
          getDisplayName(),
          getOrCreateDeviceId(),
          getProfilePhoto(),
          Battery.getBatteryLevelAsync(),
        ]);
        setDisplayName(name);
        setDeviceId(id);
        if (photo) setProfilePhotoState(photo);
        setBatteryLevel(battery);
      } catch (e) {
        console.error('ProfileScreen load error:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    // Subscribe to battery level changes
    const subscription = Battery.addBatteryLevelListener(({ batteryLevel: level }) => {
      setBatteryLevel(level);
    });
    return () => subscription.remove();
  }, []);

  const batteryPercent = batteryLevel !== null ? Math.round(batteryLevel * 100) : null;
  const batteryColor = batteryPercent === null ? '#9EB1FF'
    : batteryPercent > 50 ? '#10b981'
      : batteryPercent > 20 ? '#f59e0b'
        : '#ef4444';

  // ── Pick photo from library and persist ──
  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library in device settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      const uri = result.assets[0].uri;
      setProfilePhotoState(uri);
      try {
        await setProfilePhoto(uri);
      } catch (e) {
        console.error('Failed to save photo URI', e);
      }
    }
  };

  // ── Change Name modal ──
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [nameInput, setNameInput] = useState('');

  const openNameModal = () => {
    setNameInput(displayName);
    setNameModalVisible(true);
  };
  const saveName = async () => {
    if (!nameInput.trim()) {
      Alert.alert('Invalid Name', 'Display name cannot be empty.');
      return;
    }
    try {
      await saveDisplayName(nameInput.trim());
      setDisplayName(nameInput.trim());
      setNameModalVisible(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to save display name.');
    }
  };

  // ── Change PIN modal (6 digits) ──
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinStep, setPinStep] = useState('new'); // 'new' | 'confirm'
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const PIN_DIGIT_COUNT = 6;

  const openPinModal = () => {
    setPinStep('new');
    setNewPinInput('');
    setConfirmPinInput('');
    setPinModalVisible(true);
  };

  const handlePinKey = (k) => {
    const getter = pinStep === 'new' ? newPinInput : confirmPinInput;
    const setter = pinStep === 'new' ? setNewPinInput : setConfirmPinInput;

    if (k === '⌫') {
      setter(getter.slice(0, -1));
      return;
    }
    if (getter.length >= PIN_DIGIT_COUNT) return;
    const next = getter + k;
    setter(next);

    if (next.length === PIN_DIGIT_COUNT) {
      setTimeout(() => {
        if (pinStep === 'new') {
          setPinStep('confirm');
          setNewPinInput(next);
        } else {
          if (next !== newPinInput) {
            Alert.alert('Mismatch', 'PINs do not match. Please try again.');
            setConfirmPinInput('');
          }
        }
      }, 150);
    }
  };

  const handleSavePin = async () => {
    if (confirmPinInput !== newPinInput || confirmPinInput.length !== PIN_DIGIT_COUNT) {
      Alert.alert('Mismatch', 'PINs do not match. Please try again.');
      return;
    }
    try {
      await setPin(confirmPinInput);
      setPinModalVisible(false);
      Alert.alert('PIN Changed', 'Your new 6-digit PIN has been saved successfully.');
    } catch (e) {
      Alert.alert('Error', 'Failed to save PIN.');
    }
  };

  const pinActive = pinStep === 'new' ? newPinInput : confirmPinInput;
  const pinReadyToSave = pinStep === 'confirm' && confirmPinInput.length === PIN_DIGIT_COUNT && confirmPinInput === newPinInput;
  const pinStepLabel = pinStep === 'new' ? 'Enter New PIN' : 'Confirm New PIN';
  const pinStepSubtitle = pinStep === 'new'
    ? 'Choose a new 6-digit PIN.'
    : 'Re-enter the same PIN to verify before saving.';

  // ── About modal ──
  const [aboutModalVisible, setAboutModalVisible] = useState(false);

  // ── Regenerate identity ──
  const handleRegenerateIdentity = () => {
    Alert.alert(
      '⚠️ Regenerate Identity',
      'This will permanently delete your node name, PIN, device ID and profile photo.\n\nYou will be taken to the Sign Up screen to create a new identity.\n\nThis action is IRREVERSIBLE.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete & Regenerate',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetIdentity();
              await setProfilePhoto(null);
              Alert.alert(
                'Identity Deleted',
                'Your node identity has been permanently erased.',
                [{
                  text: 'OK',
                  onPress: () => {
                    if (navigation) {
                      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                    }
                  },
                }]
              );
            } catch (e) {
              Alert.alert('Error', 'Failed to delete identity. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3F7FFF" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <MaterialCommunityIcons name="hub" size={18} color="#4A78FF" style={{ marginRight: 6 }} />
            <Text style={styles.topBarBrand}>MeshLink</Text>
          </View>
          <MaterialCommunityIcons name="signal" size={20} color="#4A78FF" />
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            <TouchableOpacity style={styles.avatar} activeOpacity={0.8} onPress={pickPhoto}>
              {profilePhoto ? (
                <Image source={{ uri: profilePhoto }} style={styles.avatarImage} />
              ) : (
                <Feather name="user" size={44} color="#818cf8" />
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.editBadge} activeOpacity={0.8} onPress={pickPhoto}>
              <MaterialCommunityIcons name="camera" size={12} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{displayName || 'Unnamed Device'}</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>RELAY ACTIVE</Text>
          </View>
          {/* Device ID chip */}
          <View style={styles.deviceIdChip}>
            <MaterialCommunityIcons name="identifier" size={13} color="#9EB1FF" style={{ marginRight: 5 }} />
            <Text style={styles.deviceIdText} numberOfLines={1} ellipsizeMode="middle">
              {deviceId || '—'}
            </Text>
          </View>
        </View>

        {/* Notification */}
        <View style={styles.notificationWrap}>
          <BlurView intensity={30} tint="dark" style={styles.notificationGlass}>
            <View style={styles.notificationGlow} />
            <View style={styles.notificationContent}>
              <View style={styles.notificationIconWrap}>
                <MaterialCommunityIcons name="bell-ring-outline" size={18} color="#ffffff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.notificationTitle}>Notification</Text>
                <Text style={styles.notificationText}>Your mesh profile is active and ready to sync with nearby nodes.</Text>
              </View>
            </View>
          </BlurView>
        </View>

        {/* QR / Identity Key */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>IDENTITY KEY — SCAN TO ADD PEER</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <MaterialCommunityIcons name="cog-outline" size={20} color="#475569" />
            </TouchableOpacity>
          </View>
          <View style={styles.qrContainer}>
            {deviceId ? (
              <QRCode
                value={JSON.stringify({ meshlink: true, deviceId, displayName })}
                size={180}
                color="#0f172a"
                backgroundColor="#ffffff"
              />
            ) : (
              <ActivityIndicator color="#3F7FFF" size="small" />
            )}
          </View>
          <Text style={styles.qrHint}>
            Scan this QR code with another MeshLink device to establish a verified peer-to-peer connection.
          </Text>
        </View>

        {/* Account Settings */}
        <Text style={styles.sectionTitle}>ACCOUNT SETTINGS</Text>
        <View style={styles.settingsCard}>
          <SettingRow
            icon="account-edit-outline"
            label="Change Display Name"
            onPress={openNameModal}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="lock-reset"
            label="Change PIN"
            onPress={openPinModal}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="star-outline"
            label="Emergency Contact"
            onPress={() => onNavigateToNetwork && onNavigateToNetwork()}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="information-outline"
            label="About MeshLink"
            onPress={() => setAboutModalVisible(true)}
            rightIcon="open-in-new"
          />
          <View style={styles.divider} />
          <SettingRow
            icon="refresh"
            label="Regenerate Identity"
            onPress={handleRegenerateIdentity}
            danger
            subLabel="⚠ Irreversible"
          />
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Mesh Nodes</Text>
            <Text style={styles.statValue}>{peers.length}</Text>
          </View>
          <View style={styles.statDivider} />

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Battery</Text>
            <Text style={[styles.statValue, { color: batteryColor }]}>
              {batteryPercent !== null ? `${batteryPercent}%` : '—'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ══ Change Display Name Modal ══ */}
      <Modal visible={nameModalVisible} transparent animationType="slide" onRequestClose={() => setNameModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Change Display Name</Text>
            <Text style={styles.modalSubtitle}>This is the name other mesh nodes will see.</Text>
            <TextInput
              style={styles.textInput}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Enter display name"
              placeholderTextColor="rgba(201,212,255,0.35)"
              autoCapitalize="words"
              autoCorrect={false}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnSecondary} activeOpacity={0.7} onPress={() => setNameModalVisible(false)}>
                <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnPrimary} activeOpacity={0.7} onPress={saveName}>
                <Text style={styles.modalBtnPrimaryText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ══ Change PIN Modal (6-digit) ══ */}
      <Modal visible={pinModalVisible} transparent animationType="slide" onRequestClose={() => setPinModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: 32 }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{pinStepLabel}</Text>
            <Text style={styles.modalSubtitle}>{pinStepSubtitle}</Text>

            {/* PIN dots — 6 */}
            <View style={styles.pinDotsRow}>
              {Array.from({ length: PIN_DIGIT_COUNT }).map((_, i) => (
                <View key={i} style={[styles.pinDot, i < pinActive.length && styles.pinDotFilled]} />
              ))}
            </View>

            {pinStep === 'confirm' && (
              <View style={styles.pinMatchNote}>
                <MaterialCommunityIcons
                  name={pinReadyToSave ? 'check-circle' : 'shield-key-outline'}
                  size={18}
                  color={pinReadyToSave ? '#34d399' : '#9EB1FF'}
                  style={{ marginRight: 8 }}
                />
                <Text style={[styles.pinMatchText, pinReadyToSave && styles.pinMatchTextReady]}>
                  {pinReadyToSave ? 'PINs match. Ready to save.' : 'Enter the same PIN again.'}
                </Text>
              </View>
            )}

            <PinKeypad onKey={handlePinKey} />

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSavePin}
              disabled={!pinReadyToSave}
              style={[styles.modalBtnPrimary, { marginTop: 20, opacity: pinReadyToSave ? 1 : 0.45 }]}
            >
              <Text style={styles.modalBtnPrimaryText}>Confirm and Save</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ marginTop: 16, alignSelf: 'center' }} onPress={() => setPinModalVisible(false)}>
              <Text style={{ color: '#9EB1FF', fontSize: 14 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ══ About MeshLink Modal ══ */}
      <Modal visible={aboutModalVisible} transparent animationType="slide" onRequestClose={() => setAboutModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '85%' }]}>
            <View style={styles.modalHandle} />
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.aboutHeader}>
                <View style={styles.aboutLogo}>
                  <MaterialCommunityIcons name="hub" size={32} color="#4A78FF" />
                </View>
                <Text style={styles.aboutAppName}>MeshLink</Text>
                <Text style={styles.aboutVersion}>Version 1.0.0  •  P2P Encrypted Mesh Network</Text>
              </View>

              <Text style={styles.aboutSectionTitle}>WHAT IS MESHLINK?</Text>
              <Text style={styles.aboutBody}>
                MeshLink is an offline-first peer-to-peer communication platform built for scenarios where internet connectivity is unavailable — such as natural disasters, remote expeditions, or infrastructure outages.{'\n\n'}
                Using Bluetooth Low Energy and local Wi-Fi mesh protocols, MeshLink allows nearby devices to form a self-healing network and relay encrypted messages without any central server.
              </Text>

              <Text style={styles.aboutSectionTitle}>KEY FEATURES</Text>
              {[
                { icon: 'shield-lock-outline', text: 'End-to-end encrypted messaging' },
                { icon: 'access-point-network', text: 'Serverless P2P mesh networking' },
                { icon: 'map-marker-radius-outline', text: 'Real-time node radar & location sharing' },
                { icon: 'alarm-light-outline', text: 'Emergency SOS broadcasting' },
                { icon: 'fingerprint', text: 'Cryptographic node identity (QR pairing)' },
                { icon: 'wifi-off', text: 'Works completely offline' },
              ].map((f, i) => (
                <View key={i} style={styles.aboutFeatureRow}>
                  <MaterialCommunityIcons name={f.icon} size={18} color="#4A78FF" style={{ marginRight: 10 }} />
                  <Text style={styles.aboutFeatureText}>{f.text}</Text>
                </View>
              ))}

              <Text style={styles.aboutSectionTitle}>PROJECT INFO</Text>
              <Text style={styles.aboutBody}>
                Built by Team UniVerse as part of a collaborative open-source initiative.{'\n\n'}
                🔗 GitHub: github.com/aryan270506/Team-UniVerse{'\n'}
                📡 Protocol: Bluetooth LE + Wi-Fi Direct{'\n'}
                🔐 Encryption: AES-256 + ECDH Key Exchange
              </Text>

              <TouchableOpacity
                style={[styles.modalBtnPrimary, { marginTop: 20, marginBottom: 8 }]}
                activeOpacity={0.7}
                onPress={() => setAboutModalVisible(false)}
              >
                <Text style={styles.modalBtnPrimaryText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080d19' },
  scrollContent: { paddingBottom: 100 },

  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 16 : 20,
    paddingBottom: 12,
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center' },
  topBarBrand: { color: '#C9D4FF', fontWeight: '700', fontSize: 15, letterSpacing: 0.3 },

  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatarWrap: { position: 'relative', marginBottom: 14 },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(63,127,255,0.12)',
    borderWidth: 2, borderColor: 'rgba(63,127,255,0.35)',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: 88, height: 88, borderRadius: 44 },
  editBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#3F7FFF',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#080d19',
  },
  userName: { color: '#C9D4FF', fontSize: 24, fontWeight: '700', letterSpacing: 0.3, marginBottom: 6 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' },
  statusText: { color: '#10b981', fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
  deviceIdChip: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 10,
    backgroundColor: 'rgba(26,36,64,0.85)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(201,212,255,0.12)',
    maxWidth: 300,
  },
  deviceIdText: { color: '#9EB1FF', fontSize: 11, letterSpacing: 0.3, flex: 1 },

  notificationWrap: { marginHorizontal: 16, marginBottom: 18 },
  notificationGlass: {
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  notificationGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(63,127,255,0.10)',
  },
  notificationContent: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  notificationIconWrap: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(63,127,255,0.28)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)',
  },
  notificationTitle: { color: '#ffffff', fontSize: 14, fontWeight: '700', marginBottom: 2 },
  notificationText: { color: '#c9d4ff', fontSize: 12, lineHeight: 18 },

  card: {
    marginHorizontal: 16, backgroundColor: '#0f1829',
    borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', marginBottom: 24,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardLabel: { color: '#9EB1FF', fontSize: 11, fontWeight: '700', letterSpacing: 1.3, flex: 1 },
  qrContainer: {
    alignItems: 'center', marginBottom: 16,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10, padding: 14,
    backgroundColor: '#fff', alignSelf: 'center',
  },
  qrHint: { color: '#9EB1FF', fontSize: 13, textAlign: 'center', lineHeight: 20 },

  sectionTitle: {
    color: '#9EB1FF', fontSize: 11, fontWeight: '700',
    letterSpacing: 1.8, marginHorizontal: 20, marginBottom: 10,
  },

  settingsCard: {
    marginHorizontal: 16, backgroundColor: '#0f1829',
    borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)', marginBottom: 24, overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 16,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  settingIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(165,180,252,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  settingIconDanger: { backgroundColor: 'rgba(239,68,68,0.08)' },
  settingLabel: { color: '#C9D4FF', fontSize: 14, fontWeight: '600' },
  settingLabelDanger: { color: '#ef4444' },
  settingSubLabel: { color: '#f59e0b', fontSize: 10, fontWeight: '600', letterSpacing: 0.5, marginTop: 2 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: 18 },

  statsRow: {
    marginHorizontal: 16, flexDirection: 'row',
    backgroundColor: '#0f1829', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden', marginBottom: 12,
  },
  statBox: { flex: 1, paddingVertical: 18, paddingHorizontal: 14 },
  statLabel: { color: '#9EB1FF', fontSize: 11, fontWeight: '600', marginBottom: 4 },
  statValue: { color: '#C9D4FF', fontSize: 22, fontWeight: '700' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginVertical: 14 },

  // ── Modals ──
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#0f1829',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 12, paddingHorizontal: 24, paddingBottom: 40,
    borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center', marginBottom: 20,
  },
  modalTitle: { color: '#C9D4FF', fontSize: 20, fontWeight: '700', marginBottom: 6, textAlign: 'center' },
  modalSubtitle: { color: '#9EB1FF', fontSize: 13, textAlign: 'center', marginBottom: 20 },

  textInput: {
    backgroundColor: 'rgba(26,36,64,0.6)',
    borderWidth: 1, borderColor: 'rgba(201,212,255,0.18)',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    color: '#fff', fontSize: 16, marginBottom: 20,
  },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtnPrimary: {
    flex: 1, backgroundColor: '#3F7FFF',
    borderRadius: 14, paddingVertical: 14,
    alignItems: 'center',
  },
  modalBtnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  modalBtnSecondary: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14, paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  modalBtnSecondaryText: { color: '#9EB1FF', fontWeight: '700', fontSize: 15 },

  // PIN dots
  pinDotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginVertical: 24 },
  pinDot: {
    width: 16, height: 16, borderRadius: 8,
    borderWidth: 2, borderColor: 'rgba(158,177,255,0.45)',
    backgroundColor: 'transparent',
  },
  pinDotFilled: { backgroundColor: '#4A78FF', borderColor: '#4A78FF' },
  pinMatchNote: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', marginTop: -8, marginBottom: 10,
  },
  pinMatchText: { color: '#9EB1FF', fontSize: 13, fontWeight: '600' },
  pinMatchTextReady: { color: '#34d399' },

  // About
  aboutHeader: { alignItems: 'center', paddingVertical: 20 },
  aboutLogo: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(63,127,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(63,127,255,0.28)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  aboutAppName: { color: '#C9D4FF', fontSize: 24, fontWeight: '700', marginBottom: 4 },
  aboutVersion: { color: '#9EB1FF', fontSize: 12, textAlign: 'center' },
  aboutSectionTitle: {
    color: '#9EB1FF', fontSize: 11, fontWeight: '700',
    letterSpacing: 1.6, marginTop: 20, marginBottom: 10,
  },
  aboutBody: { color: '#C9D4FF', fontSize: 13, lineHeight: 21 },
  aboutFeatureRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  aboutFeatureText: { color: '#C9D4FF', fontSize: 13, flex: 1 },
});
