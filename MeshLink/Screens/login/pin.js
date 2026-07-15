import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  useWindowDimensions,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ─── Constants ───────────────────────────────────────────────────────────────
const PIN_LENGTH = 4;

// ─── Keypad layout ────────────────────────────────────────────────────────────
const KEYS = [
  { label: '1', sub: '' },
  { label: '2', sub: 'ABC' },
  { label: '3', sub: 'DEF' },
  { label: '4', sub: 'GHI' },
  { label: '5', sub: 'JKL' },
  { label: '6', sub: 'MNO' },
  { label: '7', sub: 'PQRS' },
  { label: '8', sub: 'TUV' },
  { label: '9', sub: 'WXYZ' },
  { label: 'biometric', sub: '' },
  { label: '0', sub: '' },
  { label: 'backspace', sub: '' },
];

// ─── MeshLink mesh-line background ───────────────────────────────────────────
const MeshLines = () => (
  <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <LinearGradient
      colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.45)']}
      style={StyleSheet.absoluteFill}
    />
    <View style={styles.linesLayer} />
  </View>
);

// ─── Single PIN dot ───────────────────────────────────────────────────────────
const PinDot = ({ filled }) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (filled) {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.35, duration: 100, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();
    }
  }, [filled]);

  return (
    <Animated.View
      style={[
        styles.dot,
        filled && styles.dotFilled,
        { transform: [{ scale }] },
      ]}
    />
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PinScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const keySize = isWide ? 84 : 72;
  const keyFontSize = isWide ? 26 : 22;

  const [pin, setPin] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Shake animation on wrong PIN
  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  // Auto-submit when 4 digits entered — any PIN is accepted
  useEffect(() => {
    if (pin.length === PIN_LENGTH) {
      setTimeout(() => {
        navigation.replace('Main');
      }, 150);
    }
  }, [pin]);

  const handleKey = (key) => {
    if (key === 'biometric') {
      Alert.alert('Biometric', 'Biometric authentication not set up yet.');
      return;
    }
    if (key === 'backspace') {
      setPin((prev) => prev.slice(0, -1));
      return;
    }
    if (pin.length < PIN_LENGTH) {
      setPin((prev) => prev + key);
    }
  };

  const dynamic = useMemo(() =>
    StyleSheet.create({
      keyBtn: {
        width: keySize,
        height: keySize,
        borderRadius: keySize / 2,
        backgroundColor: 'rgba(30,42,70,0.75)',
        alignItems: 'center',
        justifyContent: 'center',
        margin: isWide ? 12 : 10,
        borderWidth: 1,
        borderColor: 'rgba(201,212,255,0.08)',
      },
      keyLabel: {
        color: '#C9D4FF',
        fontSize: keyFontSize,
        fontWeight: '500',
        lineHeight: keyFontSize + 4,
      },
      keySub: {
        color: 'rgba(158,177,255,0.55)',
        fontSize: isWide ? 10 : 9,
        letterSpacing: 1,
        marginTop: -2,
      },
    }), [keySize, isWide, keyFontSize]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#060B1A', '#0A1630']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <MeshLines />

      <View style={styles.inner}>
        {/* Logo */}
        <View style={styles.logoCircle}>
          <MaterialCommunityIcons name="hub" size={36} color="#4A78FF" />
        </View>

        {/* Title */}
        <Text style={styles.title}>MeshLink</Text>
        <Text style={styles.subtitle}>
          Enter your secure PIN to access your local node.
        </Text>

        {/* PIN Dots */}
        <Animated.View
          style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}
        >
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <PinDot key={i} filled={i < pin.length} />
          ))}
        </Animated.View>

        {/* Keypad */}
        <View style={styles.keypad}>
          {KEYS.map((key) => (
            <TouchableOpacity
              key={key.label}
              activeOpacity={0.65}
              onPress={() => handleKey(key.label)}
              style={[
                dynamic.keyBtn,
                (key.label === 'biometric' || key.label === 'backspace') && styles.iconKeyBtn,
              ]}
            >
              {key.label === 'biometric' ? (
                <MaterialCommunityIcons name="fingerprint" size={28} color="#9EB1FF" />
              ) : key.label === 'backspace' ? (
                <MaterialCommunityIcons name="backspace-outline" size={26} color="#9EB1FF" />
              ) : (
                <>
                  <Text style={dynamic.keyLabel}>{key.label}</Text>
                  {key.sub !== '' && (
                    <Text style={dynamic.keySub}>{key.sub}</Text>
                  )}
                </>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer Links */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() =>
            Alert.alert('Forgot PIN', 'Please contact your node administrator to reset your PIN.')
          }
          style={styles.forgotBtn}
        >
          <Text style={styles.forgotText}>Forgot PIN?</Text>
        </TouchableOpacity>

        <View style={styles.signupRow}>
          <Text style={styles.signupText}>New here? </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('CreateAccount')}
          >
            <Text style={styles.signupLink}>Create an account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#081122',
  },
  linesLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.12,
    backgroundColor: 'transparent',
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 32,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(63,127,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(63,127,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#C9D4FF',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  subtitle: {
    color: '#9EB1FF',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 36,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 40,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: 'rgba(158,177,255,0.45)',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: '#4A78FF',
    borderColor: '#4A78FF',
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 320,
  },
  iconKeyBtn: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  forgotBtn: {
    marginTop: 28,
    paddingVertical: 8,
  },
  forgotText: {
    color: '#9EB1FF',
    fontSize: 14,
  },
  signupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  signupText: {
    color: '#9EB1FF',
    fontSize: 14,
  },
  signupLink: {
    color: '#4A78FF',
    fontWeight: '700',
    fontSize: 14,
  },
});
