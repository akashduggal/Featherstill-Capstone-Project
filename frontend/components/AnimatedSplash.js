import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';

const { width, height } = Dimensions.get('window');

/**
 * A custom animated splash screen that seamlessly takes over from the native splash screen,
 * plays a pulsing animation, and beautifully fades out once the app is fully ready.
 */
export default function AnimatedSplash({ isAppReady, onFinish }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeOutAnim = useRef(new Animated.Value(1)).current;
  const [isHiding, setIsHiding] = useState(false);

  useEffect(() => {
    // Hide the native static splash screen immediately so this animated one takes over
    SplashScreen.hideAsync().catch(() => {});

    // Start a continuous gentle pulse animation on the logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    // When the app is fully ready (database initialized, routing determined), fade out
    if (isAppReady && !isHiding) {
      setIsHiding(true);
      Animated.timing(fadeOutAnim, {
        toValue: 0,
        duration: 600, // Smooth fade out over 600ms
        useNativeDriver: true,
      }).start(() => {
        if (onFinish) onFinish();
      });
    }
  }, [isAppReady, isHiding, fadeOutAnim, onFinish]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeOutAnim }]}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }], alignItems: 'center' }}>
          <Image 
            source={require('../assets/fetherstill_official_logo.svg')} 
            style={{width: 125, height: 142, objectFit: "cover", borderRadius: 20, backgroundColor: "transparent"}} 
          />
        <Text style={styles.title}>Fetherstill</Text>
        <Text style={styles.subtitle}>BMS Monitor</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject, // Cover the entire screen
    backgroundColor: '#0F172A', // Must strictly match app.json splash background
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999, // Ensure it sits on top of all other navigation
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 16,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 6,
    letterSpacing: 4,
  },
});
