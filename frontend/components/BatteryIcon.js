import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolateColor } from 'react-native-reanimated';

export const BatteryIcon = ({ percentage, size = 48, colors }) => {
  const w = size * 2;
  const h = size;
  const borderW = 2;
  const tipW = size * 0.1;
  const tipH = h * 0.4;
  const innerW = w - borderW * 2 - 4;
  const innerH = h - borderW * 2 - 4;

  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const progress = useSharedValue(clampedPercentage);

  useEffect(() => {
    progress.value = withTiming(clampedPercentage, { duration: 500 });
  }, [clampedPercentage, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const fillW = (innerW * progress.value) / 100;
    const color = interpolateColor(
      progress.value,
      [0, 50, 100],
      ['rgb(255,0,0)', 'rgb(255,200,0)', 'rgb(0,200,0)']
    );

    return {
      width: fillW,
      backgroundColor: color,
    };
  });

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View
        style={{
          width: w,
          height: h,
          borderWidth: borderW,
          borderColor: colors.text,
          borderRadius: 6,
          justifyContent: 'center',
          padding: 2,
        }}
      >
        <Animated.View
          style={[
            {
              height: innerH,
              borderRadius: 3,
            },
            animatedStyle,
          ]}
        />
      </View>
      <View
        style={{
          width: tipW,
          height: tipH,
          backgroundColor: colors.text,
          borderTopRightRadius: 3,
          borderBottomRightRadius: 3,
        }}
      />
    </View>
  );
};
