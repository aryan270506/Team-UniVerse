import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Simple mesh-lines background illustration (replace with your asset if you have one)
const MeshLines = () => {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.4)']}
        style={StyleSheet.absoluteFill}
      />
      {/* Decorative faint lines with opacity */}
      <View style={styles.linesLayer} />
    </View>
  );
};

export default function login({ navigation }) {
  const { width, height } = useWindowDimensions();

  // Responsive sizing
  const isWide = width >= 768; // tablet/laptop breakpoint
  const spacing = isWide ? 28 : 20;
  const buttonHeight = isWide ? 58 : 52;
  const logoSize = isWide ? 108 : 90;
  const titleSize = isWide ? 40 : 34;
  const subtitleSize = isWide ? 18 : 16;

  // Animation: pager dots pulsing
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const mk = (v, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, {
            toValue: 1,
            duration: 500,
            delay,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(v, {
            toValue: 0,
            duration: 500,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      ).start();

    mk(dot1, 0);
    mk(dot2, 200);
    mk(dot3, 400);

    return () => {
      dot1.stopAnimation();
      dot2.stopAnimation();
      dot3.stopAnimation();
    };
  }, [dot1, dot2, dot3]);

  // Animation: "typing" cursor blink at the end of the status line
  const cursorOpacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, {
          toValue: 0,
          duration: 450,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(cursorOpacity, {
          toValue: 1,
          duration: 450,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [cursorOpacity]);

  // Button handlers
  const onCreate = () => {
    navigation.navigate('CreateAccount');
  };

  // Style memoization for performance across re-renders
  const dynamic = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: '#081122',
        },
        contentWrap: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingHorizontal: spacing,
          paddingBottom: isWide ? 56 : 36,
        },
        logoWrap: {
          position: 'absolute',
          top: isWide ? height * 0.12 : height * 0.10,
          width: '100%',
          alignItems: 'center',
        },
        logoCircle: {
          width: logoSize,
          height: logoSize,
          borderRadius: logoSize / 2,
          backgroundColor: 'rgba(63,127,255,0.15)',
          borderWidth: 1,
          borderColor: 'rgba(63,127,255,0.35)',
          alignItems: 'center',
          justifyContent: 'center',
        },
        logoDot: {
          width: logoSize * 0.22,
          height: logoSize * 0.22,
          borderRadius: (logoSize * 0.22) / 2,
          backgroundColor: '#4A78FF',
        },
        title: {
          marginTop: spacing * 1.4,
          color: '#C9D4FF',
          fontSize: titleSize,
          fontWeight: '700',
          letterSpacing: 0.4,
        },
        divider: {
          width: isWide ? 380 : 280,
          height: StyleSheet.hairlineWidth,
          backgroundColor: 'rgba(201,212,255,0.25)',
          marginTop: spacing * 0.8,
          marginBottom: spacing * 0.8,
        },
        subtitle: {
          color: '#9EB1FF',
          fontSize: subtitleSize,
          textAlign: 'center',
          paddingHorizontal: spacing,
        },
        pagerWrap: {
          marginTop: spacing * 0.8,
          flexDirection: 'row',
          gap: 8,
        },
        dot: {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: '#9EB1FF',
          opacity: 0.35,
          marginHorizontal: 4,
        },
        statusWrap: {
          marginTop: spacing * 0.8,
        },
        statusText: {
          color: '#C9D4FF',
          letterSpacing: 2,
          fontSize: isWide ? 14 : 12,
        },
        cursor: {
          width: 8,
          marginLeft: 2,
          transform: [{ translateY: 2 }],
        },
        btn: {
          width: '100%',
          height: buttonHeight,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: spacing,
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
        btnSecondary: {
          backgroundColor: '#1A2440',
          borderWidth: 1,
          borderColor: 'rgba(201,212,255,0.18)',
        },
        btnSecondaryText: {
          color: '#C9D4FF',
          fontSize: isWide ? 18 : 17,
          fontWeight: '700',
          letterSpacing: 0.3,
        },
        chip: {
          marginTop: spacing,
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 16,
          backgroundColor: 'rgba(26,36,64,0.85)',
          borderWidth: 1,
          borderColor: 'rgba(201,212,255,0.16)',
        },
        chipText: {
          color: '#9EB1FF',
          fontSize: 12,
          letterSpacing: 0.3,
        },
      }),
    [height, isWide, logoSize, spacing, subtitleSize, titleSize, buttonHeight]
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

      {/* Top cluster: logo + title */}
      <View style={dynamic.logoWrap}>
        {/* Replace this with your true Mesh “M” mark if you have an SVG/PNG.
            Here we fake a minimal node graphic using circles. */}
        <View style={dynamic.logoCircle}>
          <View style={dynamic.logoDot} />
        </View>

        <Text style={dynamic.title}>MeshLink</Text>
        <View style={dynamic.divider} />
        <Text style={dynamic.subtitle}>Stay connected. No signal required.</Text>

        {/* Pager dots */}
        <View style={dynamic.pagerWrap}>
          <Animated.View
            style={[
              dynamic.dot,
              {
                opacity: dot1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.35, 1],
                }),
                transform: [
                  {
                    scale: dot1.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.25],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              dynamic.dot,
              {
                opacity: dot2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.35, 1],
                }),
                transform: [
                  {
                    scale: dot2.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.25],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              dynamic.dot,
              {
                opacity: dot3.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.35, 1],
                }),
                transform: [
                  {
                    scale: dot3.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.25],
                    }),
                  },
                ],
              },
            ]}
          />
        </View>

        {/* Status line with blinking cursor */}
        <View style={dynamic.statusWrap}>
          <Text style={dynamic.statusText}>
            INITIALIZING MESH PROTOCOL…
            <Animated.Text style={[dynamic.cursor, { opacity: cursorOpacity }]}>
              |
            </Animated.Text>
          </Text>
        </View>
      </View>

      {/* Bottom button + chip */}
      <View style={dynamic.contentWrap}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onCreate}
          style={[dynamic.btn, dynamic.btnPrimary]}
        >
          <Text style={dynamic.btnPrimaryText}>Sign Up</Text>
        </TouchableOpacity>

        <View style={dynamic.chip}>
          <Text style={dynamic.chipText}>P2P Encrypted Mesh Network</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  linesLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.18,
    // A lightweight "mesh" feel using repeating gradients.
    // For production, prefer an SVG/PNG background for fidelity.
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
});
