import React, { useState } from 'react';
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
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// ─── Fake QR Code ─────────────────────────────────────────────────────────────
const QRCodePlaceholder = () => {
  const pattern = [
    [1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,1,1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,0,1,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0],
    [1,0,1,1,0,1,1,1,0,1,1,0,1,1,0,1,0],
    [0,1,0,0,1,0,0,0,1,0,0,1,0,0,1,0,1],
    [1,1,0,1,0,1,1,1,0,1,0,1,0,1,0,1,1],
    [0,0,0,0,0,0,0,0,1,0,1,1,0,0,1,0,1],
    [1,1,1,1,1,1,1,0,0,1,1,0,1,0,1,1,0],
    [1,0,0,0,0,0,1,0,1,0,0,1,0,1,0,0,1],
    [1,0,1,1,1,0,1,0,0,1,1,0,1,1,0,1,1],
    [1,0,0,0,0,0,1,0,1,0,0,1,0,0,1,0,0],
    [1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,0,1],
  ];
  return (
    <View style={qrStyles.wrap}>
      {pattern.map((row, r) => (
        <View key={r} style={qrStyles.row}>
          {row.map((cell, c) => (
            <View key={c} style={[qrStyles.cell, cell === 1 ? qrStyles.dark : qrStyles.light]} />
          ))}
        </View>
      ))}
    </View>
  );
};

const qrStyles = StyleSheet.create({
  wrap: { backgroundColor: '#ffffff', padding: 10, borderRadius: 8 },
  row: { flexDirection: 'row' },
  cell: { width: 10, height: 10 },
  dark: { backgroundColor: '#0f172a' },
  light: { backgroundColor: '#ffffff' },
});

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
const PIN_KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
const PinKeypad = ({ pin, onKey }) => (
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
export default function ProfileScreen({ peers = [], onNavigateToNetwork }) {
  const [displayName, setDisplayName] = useState('Alex Rivera');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const meshNodesCount = 12;
  const syncHealth = 98;

  // ── Pick photo from library ──
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
      setProfilePhoto(result.assets[0].uri);
    }
  };

  // ── Change Name modal ──
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [nameInput, setNameInput] = useState('');

  const openNameModal = () => {
    setNameInput(displayName);
    setNameModalVisible(true);
  };
  const saveName = () => {
    if (!nameInput.trim()) {
      Alert.alert('Invalid Name', 'Display name cannot be empty.');
      return;
    }
    setDisplayName(nameInput.trim());
    setNameModalVisible(false);
  };

  // ── Change PIN modal ──
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinStep, setPinStep] = useState('current'); // 'current' | 'new' | 'confirm'
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');

  const openPinModal = () => {
    setPinStep('current');
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
    setPinModalVisible(true);
  };

  const handlePinKey = (k) => {
    const setter = pinStep === 'current' ? setCurrentPinInput
      : pinStep === 'new' ? setNewPinInput : setConfirmPinInput;
    const getter = pinStep === 'current' ? currentPinInput
      : pinStep === 'new' ? newPinInput : confirmPinInput;

    if (k === '⌫') {
      setter(getter.slice(0, -1));
      return;
    }
    if (getter.length >= 4) return;
    const next = getter + k;
    setter(next);

    if (next.length === 4) {
      setTimeout(() => {
        if (pinStep === 'current') {
          setPinStep('new');
          setCurrentPinInput('');
        } else if (pinStep === 'new') {
          setPinStep('confirm');
          setNewPinInput(next);
        } else {
          if (next === newPinInput) {
            setPinModalVisible(false);
            Alert.alert('PIN Changed', 'Your new PIN has been saved successfully.');
          } else {
            Alert.alert('Mismatch', 'PINs do not match. Please try again.');
            setPinStep('new');
            setNewPinInput('');
            setConfirmPinInput('');
          }
        }
      }, 150);
    }
  };

  const pinStepLabel = pinStep === 'current' ? 'Enter Current PIN'
    : pinStep === 'new' ? 'Enter New PIN' : 'Confirm New PIN';
  const pinActive = pinStep === 'current' ? currentPinInput
    : pinStep === 'new' ? newPinInput : confirmPinInput;

  // ── About modal ──
  const [aboutModalVisible, setAboutModalVisible] = useState(false);

  // ── Regenerate ──
  const handleRegenerateIdentity = () => {
    Alert.alert(
      '⚠️ Regenerate Identity',
      'This will permanently destroy your current node identity and cryptographic keys. All verified peer connections will be invalidated.\n\nThis action is IRREVERSIBLE.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate',
          style: 'destructive',
          onPress: () => Alert.alert('Identity Regenerated', 'Your new mesh identity has been created.'),
        },
      ]
    );
  };

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
          <Text style={styles.userName}>{displayName}</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>RELAY ACTIVE</Text>
          </View>
        </View>

        {/* QR / Identity Key */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>IDENTITY KEY</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <MaterialCommunityIcons name="cog-outline" size={20} color="#475569" />
            </TouchableOpacity>
          </View>
          <View style={styles.qrContainer}>
            <QRCodePlaceholder />
          </View>
          <Text style={styles.qrHint}>
            Scan this code with another MeshLink device to establish a verified peer-to-peer connection.
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
            subLabel="WARNING: IRREVERSIBLE ACTION"
            onPress={handleRegenerateIdentity}
            danger
            rightIcon="alert-outline"
          />
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Mesh Nodes</Text>
            <Text style={styles.statValue}>{meshNodesCount}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Sync Health</Text>
            <Text style={[styles.statValue, { color: '#10b981' }]}>{syncHealth}%</Text>
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

      {/* ══ Change PIN Modal ══ */}
      <Modal visible={pinModalVisible} transparent animationType="slide" onRequestClose={() => setPinModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: 32 }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{pinStepLabel}</Text>

            {/* PIN dots */}
            <View style={styles.pinDotsRow}>
              {[0, 1, 2, 3].map(i => (
                <View key={i} style={[styles.pinDot, i < pinActive.length && styles.pinDotFilled]} />
              ))}
            </View>

            <PinKeypad pin={pinActive} onKey={handlePinKey} />

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
              {/* Header */}
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
                Built by Team UniVerse as part of a collaborative open-source initiative. MeshLink is designed to empower communities with resilient, privacy-first communication tools.{'\n\n'}
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
  },
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

  card: {
    marginHorizontal: 16, backgroundColor: '#0f1829',
    borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', marginBottom: 24,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardLabel: { color: '#9EB1FF', fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
  qrContainer: {
    alignItems: 'center', marginBottom: 16,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10, padding: 10,
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
  statBox: { flex: 1, paddingVertical: 18, paddingHorizontal: 20 },
  statLabel: { color: '#9EB1FF', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  statValue: { color: '#C9D4FF', fontSize: 26, fontWeight: '700' },
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
  pinDotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginVertical: 24 },
  pinDot: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: 'rgba(158,177,255,0.45)',
    backgroundColor: 'transparent',
  },
  pinDotFilled: { backgroundColor: '#4A78FF', borderColor: '#4A78FF' },

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
