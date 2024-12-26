import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const STICK_SIZE = 50;
const BASE_SIZE = 150;

export const Joystick = ({ onMove, size = 150 }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx) => {
      let newX = ctx.startX + event.translationX;
      let newY = ctx.startY + event.translationY;
      
      // Calculate distance from center
      const distance = Math.sqrt(newX * newX + newY * newY);
      const maxDistance = (BASE_SIZE - STICK_SIZE) / 2;
      
      if (distance > maxDistance) {
        const angle = Math.atan2(newY, newX);
        newX = Math.cos(angle) * maxDistance;
        newY = Math.sin(angle) * maxDistance;
      }
      
      translateX.value = newX;
      translateY.value = newY;
    },
    onEnd: () => {
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    },
  });

  const stickStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
    };
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const maxDistance = (BASE_SIZE - STICK_SIZE) / 2;
      const x = (translateX.value / maxDistance).toFixed(3);
      const y = (-translateY.value / maxDistance).toFixed(3);
      onMove({ x: parseFloat(x), y: parseFloat(y) });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.stick, stickStyle]} />
      </PanGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BASE_SIZE / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  stick: {
    width: STICK_SIZE,
    height: STICK_SIZE,
    borderRadius: STICK_SIZE / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
}); 