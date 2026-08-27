import { Pressable, StyleSheet } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';

const TRACK_WIDTH = 32;
const TRACK_HEIGHT = 16;
const TRACK_BORDER_WIDTH = 1;
const THUMB_SIZE = 10;
const THUMB_MARGIN = 2;
// The track's content box (where the thumb is laid out) is inset by the border on both sides.
const THUMB_TRAVEL = TRACK_WIDTH - TRACK_BORDER_WIDTH * 2 - THUMB_SIZE - THUMB_MARGIN * 2;

const COLORS = {
  primary: '#F4693F',
  gray: '#8891A5',
};

type SaveMeToggleProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label: string;
};

export default function SaveMeToggle({ value, onValueChange, label }: SaveMeToggleProps) {
  const progress = useDerivedValue(() => withTiming(value ? 1 : 0, { duration: 300 }));

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], ['transparent', COLORS.primary]),
    borderColor: interpolateColor(progress.value, [0, 1], [COLORS.gray, COLORS.primary]),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * THUMB_TRAVEL }],
    backgroundColor: interpolateColor(progress.value, [0, 1], [COLORS.gray, '#fff']),
  }));

  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [COLORS.gray, COLORS.primary]),
  }));

  return (
    <Pressable style={styles.row} onPress={() => onValueChange(!value)} hitSlop={8}>
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </Animated.View>
      <Animated.Text style={[styles.label, textStyle]}>{label}</Animated.Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    borderWidth: TRACK_BORDER_WIDTH,
    justifyContent: 'center',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    marginLeft: THUMB_MARGIN,
  },
  label: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 14,
  },
});
