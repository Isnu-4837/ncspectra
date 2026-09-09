import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, StatusBar } from 'react-native';

interface IntroScreenProps {
  /** Called once the intro has finished its hold + fade-out. */
  onFinish: () => void;
  /** How long to hold the splash before fading out (ms). */
  durationMs?: number;
}

/**
 * Full-bleed branded splash, rendered as a real JS screen instead of relying
 * on the native OS splash-screen API.
 *
 * WHY THIS EXISTS:
 * On Android 12+, the platform's native splash-screen API only supports a
 * small centered icon on a solid background — it will not render a full
 * custom image with text/rings/texture edge-to-edge, no matter how
 * expo-splash-screen is configured. That's an OS restriction, not something
 * fixable from config. This screen renders the *actual* splash.png as a
 * normal <Image>, so it's pixel-perfect and fully your design.
 *
 * FLOW:
 * 1. Native splash shows briefly (now just the small icon — see app.json).
 * 2. JS boots, App.tsx renders <IntroScreen> first.
 * 3. This component displays splash.png full-screen for `durationMs`,
 *    then fades to transparent and calls onFinish().
 * 4. App.tsx swaps IntroScreen out for the LoginScreen.
 */
export const IntroScreen: React.FC<IntroScreenProps> = ({ onFinish, durationMs = 1800 }) => {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const holdTimer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onFinish();
      });
    }, durationMs);

    return () => clearTimeout(holdTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity }]} pointerEvents="none">
      <StatusBar hidden />
      <Image
        // Full 1536x2752 branded artwork — same file used for the native
        // splash reference in app.json, but rendered here without any of
        // the OS-imposed size/content restrictions.
        source={require('../../assets/splash.png')}
        style={styles.image}
        // "cover" fills every pixel of every phone's screen. The only
        // thing it can crop is the far left/right binary-code texture on
        // unusually narrow/tall screens — the logo, rings, and title stay
        // centered and fully visible since they sit in the vertical core
        // of the image.
        resizeMode="cover"
        fadeDuration={0}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#050B14',
    zIndex: 999,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});