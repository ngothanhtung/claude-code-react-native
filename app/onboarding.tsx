import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text, View } from '@/components/Themed';
import Purple from '@/constants/Purple';

export const ONBOARDING_STORAGE_KEY = 'hasCompletedOnboarding';

const COLORS = {
  background: '#F9F6FF',
  backgroundAccent: '#F3EDFF',
  ink: '#241038',
  muted: '#756B91',
  primary: Purple.amethystPurple,
  indicator: '#D8D0E8',
};

const SLIDES = [
  {
    title: 'Capture first.\nOrganize later.',
    description:
      'One tap from anywhere to drop a task in. Fieldnote sorts it into the right project when you’re ready.',
  },
  {
    title: 'Know what’s\nnext by 9am.',
    description:
      'Today pulls the work that’s due, blocked or waiting on you and puts it in order.',
  },
  {
    title: 'Hand off\nwithout a call.',
    description:
      'Assign, reassign and see who’s overloaded. Everyone on the team sees the same list.',
  },
];

async function completeOnboarding() {
  await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
  router.replace('/login');
}

function Brand() {
  return (
    <View style={styles.brand}>
      <View style={styles.brandMark}>
        <Text style={styles.checkmark}>✓</Text>
      </View>
      <Text style={styles.brandName}>Fieldnote</Text>
    </View>
  );
}

type SlideProps = {
  slide: (typeof SLIDES)[number];
  index: number;
  width: number;
  scrollX: Animated.Value;
};

function Slide({ slide, index, width, scrollX }: SlideProps) {
  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

  const opacity = scrollX.interpolate({
    inputRange,
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  });

  const translateY = scrollX.interpolate({
    inputRange,
    outputRange: [24, 0, -24],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.slide, { width }]}>
      <Animated.View
        style={[
          styles.content,
          { opacity, transform: [{ translateY }] },
        ]}
      >
        <Animated.Text style={styles.title}>{slide.title}</Animated.Text>
        <Animated.Text style={styles.description}>
          {slide.description}
        </Animated.Text>
      </Animated.View>
    </View>
  );
}

type DotProps = {
  index: number;
  width: number;
  dotProgress: Animated.Value;
};

function Dot({ index, width, dotProgress }: DotProps) {
  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

  const dotWidth = dotProgress.interpolate({
    inputRange,
    outputRange: [7, 28, 7],
    extrapolate: 'clamp',
  });

  const scale = dotProgress.interpolate({
    inputRange,
    outputRange: [1, 1.15, 1],
    extrapolate: 'clamp',
  });

  const backgroundColor = dotProgress.interpolate({
    inputRange,
    outputRange: [COLORS.indicator, COLORS.primary, COLORS.indicator],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          width: dotWidth,
          backgroundColor,
          transform: [{ scale }],
        },
      ]}
    />
  );
}

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  // Layout properties (width) are not supported by the native animated driver,
  // so we keep a separate JS-driven value for the dot indicators.
  const dotProgress = useRef(new Animated.Value(0)).current;
  const [index, setIndex] = useState(0);
  const isLastSlide = index === SLIDES.length - 1;

  function handleDotProgress(event: NativeSyntheticEvent<NativeScrollEvent>) {
    dotProgress.setValue(event.nativeEvent.contentOffset.x);
  }

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    if (newIndex !== index) setIndex(newIndex);
  }

  function goToNext() {
    if (isLastSlide) {
      void completeOnboarding();
      return;
    }

    const nextIndex = index + 1;
    scrollRef.current?.scrollTo({ x: width * nextIndex, animated: true });
    setIndex(nextIndex);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.backgroundOrb} />

      <Brand />

      <AnimatedScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          {
            useNativeDriver: true,
            listener: handleDotProgress,
          }
        )}
        onMomentumScrollEnd={handleScroll}
      >
        {SLIDES.map((slide, slideIndex) => (
          <Slide
            key={slide.title}
            slide={slide}
            index={slideIndex}
            width={width}
            scrollX={scrollX}
          />
        ))}
      </AnimatedScrollView>

      <View style={styles.footer}>
        <View
          style={styles.indicators}
          accessibilityLabel={`Trang ${index + 1} trên ${SLIDES.length}`}
        >
          {SLIDES.map((_, dotIndex) => (
            <Dot
              key={dotIndex}
              index={dotIndex}
              width={width}
              dotProgress={dotProgress}
            />
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
          onPress={goToNext}
        >
          <Text style={styles.buttonText}>
            {isLastSlide ? 'Get started' : 'Continue'}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => void completeOnboarding()}
          hitSlop={12}
        >
          <Text style={styles.skipText}>Skip intro</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    overflow: 'hidden',
  },
  backgroundOrb: {
    position: 'absolute',
    width: 410,
    height: 410,
    borderRadius: 205,
    top: -185,
    right: -155,
    backgroundColor: COLORS.backgroundAccent,
    pointerEvents: 'none',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 11,
    marginTop: 32,
    marginLeft: 32,
    backgroundColor: 'transparent',
  },
  brandMark: {
    width: 29,
    height: 29,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontFamily: 'BeVietnamPro_700Bold',
    fontSize: 20,
    lineHeight: 24,
  },
  brandName: {
    color: COLORS.ink,
    fontFamily: 'BeVietnamPro_700Bold',
    fontSize: 22,
    letterSpacing: -0.5,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: 'transparent',
  },
  content: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    marginTop: 8,
    backgroundColor: 'transparent',
  },
  title: {
    color: COLORS.ink,
    fontFamily: 'BeVietnamPro_700Bold',
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -1.8,
  },
  description: {
    color: COLORS.muted,
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 17,
    lineHeight: 27,
    marginTop: 22,
  },
  footer: {
    paddingHorizontal: 32,
    paddingTop: 6,
    backgroundColor: 'transparent',
  },
  indicators: {
    height: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 22,
    backgroundColor: 'transparent',
  },
  dot: {
    height: 7,
    borderRadius: 99,
  },
  button: {
    minHeight: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 6,
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  buttonText: {
    color: '#FFFFFF',
    fontFamily: 'BeVietnamPro_700Bold',
    fontSize: 18,
  },
  skipText: {
    color: COLORS.muted,
    fontFamily: 'BeVietnamPro_500Medium',
    fontSize: 16,
    textAlign: 'center',
    paddingTop: 19,
    paddingBottom: 5,
  },
});
