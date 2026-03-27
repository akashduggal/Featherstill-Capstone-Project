import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Colors } from '../constants/Colors';

const { width, height } = Dimensions.get('window');
const colors = Colors.dark;

// Placeholder slides — content will be added in the next task
const SLIDES = [
  { id: '1', title: 'Welcome', subtitle: 'Placeholder slide 1' },
  { id: '2', title: 'Connect', subtitle: 'Placeholder slide 2' },
  { id: '3', title: 'Monitor', subtitle: 'Placeholder slide 3' },
];

export default function OnboardingScreen() {
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }, []);

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const renderSlide = ({ item }) => (
    <View style={styles.slide}>
      {/* Icon placeholder — will be replaced with illustrations */}
      <View style={styles.iconCircle}>
        <Text style={styles.iconText}>{item.id}</Text>
      </View>
      <Text style={styles.slideTitle}>{item.title}</Text>
      <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          renderItem={renderSlide}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />

        {/* Dot Indicators */}
        <View style={styles.dotContainer}>
          {SLIDES.map((_, index) => {
            const inputRange = [
              (index - 1) * width,
              index * width,
              (index + 1) * width,
            ];

            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });

            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  { width: dotWidth, opacity: dotOpacity },
                ]}
              />
            );
          })}
        </View>

        {/* Navigation buttons will be added in Task 6 */}
        <View style={styles.buttonArea} />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  iconText: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.accent,
  },
  slideTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  slideSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.icon,
    textAlign: 'center',
    lineHeight: 24,
  },
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginHorizontal: 4,
  },
  buttonArea: {
    height: 80,
    paddingHorizontal: 24,
  },
});
