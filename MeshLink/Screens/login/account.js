import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  useWindowDimensions,
  Animated,
  Easing,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

// Reuse the MeshLines background
const MeshLines = () => {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.45)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.linesLayer} />
    </View>
  );
};

export default function Account({ navigation }) {
  const { width, height } = useWindowDimensions();
  
  const [nodeName, setNodeName] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [generatingKey, setGeneratingKey] = useState(false);

  // Responsive sizing
  const isWide = width >= 768;
  const spacing = isWide ? 28 : 20;
  const buttonHeight = isWide ? 58 : 52;
  const titleSize = isWide ? 36 : 28;
  const subtitleSize = isWide ? 16 : 14;

  // Animation for generating key
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let anim;
    if (generatingKey) {
      rotation.setValue(0);
      anim = Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      anim.start();
    } else {
      rotation.setValue(0);
    }
    return () => {
      if (anim) anim.stop();
    };
  }, [generatingKey, rotation]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '36deg']
  });

  const handleGenerateKey = () => {
    setGeneratingKey(true);
    setTimeout(() => {
      const randomWords = [
        'pulse', 'mesh', 'beacon', 'node', 'relay', 'crypto', 
        'secure', 'signal', 'link', 'quantum', 'matrix', 'vector'
      ];
      const generated = Array.from({ length: 4 }, () => 
        randomWords[Math.floor(Math.random() * randomWords.length)]
      ).join('-');
      setPassphrase(generated);
      setGeneratingKey(false);
      Alert.alert('Key Generated', 'Write down this secure passphrase. It is your only way to restore your mesh node.');
    }, 1500);
  };

  const handleCreateAccount = () => {
    if (!nodeName.trim()) {
      Alert.alert('Error', 'Please enter a Node Name.');
      return;
    }
    if (!passphrase.trim()) {
      Alert.alert('Error', 'Please enter or generate a Passphrase.');
      return;
    }
    Alert.alert(
      'Account Created', 
      `Node "${nodeName}" initialized on P2P Mesh Network.`,
      [{ text: 'Get Started', onPress: () => navigation.replace('Main') }]
    );
  };

  const dynamic = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: '#081122',
        },
        contentWrap: {
          flex: 1,
          paddingHorizontal: spacing,
          paddingTop: Platform.OS === 'ios' ? 60 : 40,
          paddingBottom: isWide ? 40 : 20,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: spacing * 1.5,
        },
        backBtn: {
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          alignItems: 'center',
          justifyContent: 'center',
        },
        headerTitleWrap: {
          marginLeft: 16,
        },
        title: {
          color: '#C9D4FF',
          fontSize: titleSize,
          fontWeight: '700',
          letterSpacing: 0.4,
        },
        subtitle: {
          color: '#9EB1FF',
          fontSize: subtitleSize,
          marginTop: 4,
        },
        form: {
          flex: 1,
          justifyContent: 'center',
          gap: 20,
          marginBottom: spacing,
        },
        inputGroup: {
          gap: 8,
        },
        label: {
          color: '#9EB1FF',
          fontSize: 14,
          fontWeight: '600',
          letterSpacing: 0.5,
          marginLeft: 4,
        },
        inputWrapper: {
          flexDirection: 'row',
          alignItems: 'center',
          height: buttonHeight,
          borderRadius: 14,
          backgroundColor: 'rgba(26, 36, 64, 0.5)',
          borderWidth: 1,
          borderColor: 'rgba(201, 212, 255, 0.15)',
          paddingHorizontal: 16,
        },
        inputIcon: {
          marginRight: 12,
        },
        input: {
          flex: 1,
          color: '#ffffff',
          fontSize: 16,
        },
        passwordToggle: {
          padding: 8,
        },
        generateBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 10,
          alignSelf: 'flex-start',
          marginLeft: 4,
        },
        generateText: {
          color: '#3F7FFF',
          fontWeight: '600',
          fontSize: 14,
          marginLeft: 6,
        },
        btn: {
          width: '100%',
          height: buttonHeight,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 20,
        },
        btnPrimary: {
          backgroundColor: '#3F7FFF',
        },
        btnPrimaryText: {
          color: '#fff',
          fontSize: isWide ? 18 : 17,
          fontWeight: '700',
          letterSpacing: 0.3,
        },
        footerText: {
          color: '#9EB1FF',
          textAlign: 'center',
          fontSize: 12,
          marginTop: 24,
          opacity: 0.6,
        }
      }),
    [spacing, isWide, buttonHeight, titleSize, subtitleSize]
  );

  return (
    <View style={dynamic.container}>
      <LinearGradient
        colors={['#060B1A', '#0A1630']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <MeshLines />

      <View style={dynamic.contentWrap}>
        {/* Header with Back button */}
        <View style={dynamic.header}>
          <TouchableOpacity 
            style={dynamic.backBtn} 
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={20} color="#C9D4FF" />
          </TouchableOpacity>
          <View style={dynamic.headerTitleWrap}>
            <Text style={dynamic.title}>Create Node</Text>
            <Text style={dynamic.subtitle}>Join the decentralized mesh</Text>
          </View>
        </View>

        {/* Setup Form */}
        <View style={dynamic.form}>
          <View style={dynamic.inputGroup}>
            <Text style={dynamic.label}>NODE NAME / CALLSIGN</Text>
            <View style={dynamic.inputWrapper}>
              <Feather name="user" size={18} color="#9EB1FF" style={dynamic.inputIcon} />
              <TextInput
                style={dynamic.input}
                placeholder="e.g. Alpha-Node"
                placeholderTextColor="rgba(201, 212, 255, 0.4)"
                value={nodeName}
                onChangeText={setNodeName}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={dynamic.inputGroup}>
            <Text style={dynamic.label}>SECURE PASSPHRASE</Text>
            <View style={dynamic.inputWrapper}>
              <MaterialCommunityIcons name="key-variant" size={18} color="#9EB1FF" style={dynamic.inputIcon} />
              <TextInput
                style={dynamic.input}
                placeholder="Enter passphrase or generate one"
                placeholderTextColor="rgba(201, 212, 255, 0.4)"
                value={passphrase}
                onChangeText={setPassphrase}
                secureTextEntry={!showPassphrase}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity 
                style={dynamic.passwordToggle} 
                onPress={() => setShowPassphrase(!showPassphrase)}
              >
                <Feather name={showPassphrase ? "eye-off" : "eye"} size={16} color="#9EB1FF" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={dynamic.generateBtn} 
              onPress={handleGenerateKey}
              disabled={generatingKey}
              activeOpacity={0.7}
            >
              <Animated.View style={generatingKey ? { transform: [{ rotate: spin }] } : null}>
                <Feather name="refresh-cw" size={14} color="#3F7FFF" />
              </Animated.View>
              <Text style={dynamic.generateText}>
                {generatingKey ? 'Generating Cryptographic Key...' : 'Generate Random Key'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleCreateAccount}
            style={[dynamic.btn, dynamic.btnPrimary]}
          >
            <Text style={dynamic.btnPrimaryText}>Create Account</Text>
          </TouchableOpacity>

          <Text style={dynamic.footerText}>
            All credentials are stored locally. MeshLink does not use centralized servers.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  linesLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.12,
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
});