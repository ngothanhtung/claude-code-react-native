import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  BackHandler,
  NativeScrollEvent,
  NativeSyntheticEvent,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  FadeOut,
  SlideInLeft,
  SlideInRight,
  interpolate,
  interpolateColor,
  LinearTransition,
  SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useAnimatedRef,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

// iOS UISwitch dimensions.
const TRACK_WIDTH = 51;
const TRACK_HEIGHT = 31;
const THUMB_SIZE = 27;
const THUMB_MARGIN = 2;
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - THUMB_MARGIN * 2;
// While pressed, the iOS thumb stretches horizontally.
const THUMB_PRESS_STRETCH = 6;

const COLORS = {
  on: '#34C759',
  off: '#E9E9EB',
  background: '#F2F2F7',
  card: '#FFFFFF',
  text: '#000000',
  secondaryText: '#8E8E93',
  separator: '#C6C6C8',
};

type IOSSwitchProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  activeColor?: string;
};

function IOSSwitch({ value, onValueChange, disabled = false, activeColor = COLORS.on }: IOSSwitchProps) {
  const [pressed, setPressed] = useState(false);

  const progress = useDerivedValue(() => withSpring(value ? 1 : 0, { damping: 18, stiffness: 220 }));
  const stretch = useDerivedValue(() => withTiming(pressed ? THUMB_PRESS_STRETCH : 0, { duration: 150 }));

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [COLORS.off, activeColor]),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    width: THUMB_SIZE + stretch.value,
    // Stretch toward the center: when on, the thumb grows leftward.
    transform: [{ translateX: progress.value * (THUMB_TRAVEL - stretch.value) }],
  }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      hitSlop={8}
      style={disabled && styles.disabled}>
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
}

const CHECKBOX_SIZE = 22;

type CheckboxProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  // Shows a dash instead of a check, e.g. for a "select all" box when only some items are selected.
  indeterminate?: boolean;
  disabled?: boolean;
  shape?: 'square' | 'circle';
  activeColor?: string;
};

function Checkbox({
  value,
  onValueChange,
  indeterminate = false,
  disabled = false,
  shape = 'square',
  activeColor = COLORS.on,
}: CheckboxProps) {
  const filled = value || indeterminate;
  const progress = useDerivedValue(() => withTiming(filled ? 1 : 0, { duration: 180 }));
  const iconScale = useDerivedValue(() =>
    filled ? withSpring(1, { damping: 12, stiffness: 300 }) : withTiming(0, { duration: 120 }),
  );

  const boxStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [COLORS.card, activeColor]),
    borderColor: interpolateColor(progress.value, [0, 1], [COLORS.separator, activeColor]),
  }));

  const iconStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: iconScale.value }],
  }));

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: indeterminate ? 'mixed' : value, disabled }}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      hitSlop={8}
      style={disabled && styles.disabled}>
      <Animated.View
        style={[styles.checkbox, { borderRadius: shape === 'circle' ? CHECKBOX_SIZE / 2 : 6 }, boxStyle]}>
        <Animated.View style={iconStyle}>
          <FontAwesome name={indeterminate ? 'minus' : 'check'} size={13} color="#FFFFFF" />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

type CheckboxRowProps = {
  label: string;
  isLast?: boolean;
} & CheckboxProps;

function CheckboxRow({ label, isLast, ...checkboxProps }: CheckboxRowProps) {
  const { value, onValueChange, disabled } = checkboxProps;
  return (
    <Pressable
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={[styles.row, !isLast && styles.rowSeparator]}>
      <Checkbox {...checkboxProps} />
      <Text
        style={[
          styles.rowLabel,
          styles.checkboxLabel,
          checkboxProps.shape === 'circle' && value && styles.completedLabel,
          disabled && styles.disabled,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const TOPPINGS = ['Cheese', 'Mushrooms', 'Pepperoni', 'Olives'];

type SettingRowProps = {
  label: string;
  description?: string;
  isLast?: boolean;
} & IOSSwitchProps;

function SettingRow({ label, description, isLast, ...switchProps }: SettingRowProps) {
  return (
    <View style={[styles.row, !isLast && styles.rowSeparator]}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {description ? <Text style={styles.rowDescription}>{description}</Text> : null}
      </View>
      <IOSSwitch {...switchProps} />
    </View>
  );
}

type ToastType = 'success' | 'error' | 'warning' | 'info';
type ToastPosition = 'top' | 'bottom';

type ToastConfig = {
  type: ToastType;
  message: string;
  position?: ToastPosition;
  duration?: number;
  action?: { label: string; onPress: () => void };
};

const TOAST_DEFAULT_DURATION = 2500;

const TOAST_VARIANTS: Record<ToastType, { icon: React.ComponentProps<typeof FontAwesome>['name']; color: string }> = {
  success: { icon: 'check-circle', color: '#34C759' },
  error: { icon: 'times-circle', color: '#FF3B30' },
  warning: { icon: 'exclamation-triangle', color: '#FF9500' },
  info: { icon: 'info-circle', color: '#007AFF' },
};

function useToast() {
  // `id` changes on every show() so the countdown bar restarts even for an identical message.
  const [toast, setToast] = useState<(ToastConfig & { id: number }) | null>(null);
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setVisible(false);
  }, []);

  const show = useCallback(
    (config: ToastConfig) => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ ...config, id: Date.now() });
      setVisible(true);
      timer.current = setTimeout(hide, config.duration ?? TOAST_DEFAULT_DURATION);
    },
    [hide],
  );

  useEffect(() => hide, [hide]);

  return { toast, visible, show, hide };
}

type ToastProps = {
  toast: (ToastConfig & { id: number }) | null;
  visible: boolean;
  onHide: () => void;
};

function Toast({ toast, visible, onHide }: ToastProps) {
  const insets = useSafeAreaInsets();
  const position = toast?.position ?? 'top';
  const duration = toast?.duration ?? TOAST_DEFAULT_DURATION;

  const progress = useDerivedValue(() =>
    visible ? withSpring(1, { damping: 16, stiffness: 200 }) : withTiming(0, { duration: 200 }),
  );
  const countdown = useSharedValue(1);

  useEffect(() => {
    if (!toast) return;
    countdown.value = 1;
    countdown.value = withTiming(0, { duration, easing: Easing.linear });
  }, [toast, duration, countdown]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: (1 - progress.value) * (position === 'top' ? -40 : 40) },
      { scale: 0.95 + progress.value * 0.05 },
    ],
  }));

  const countdownStyle = useAnimatedStyle(() => ({
    width: `${countdown.value * 100}%`,
  }));

  if (!toast) return null;
  const variant = TOAST_VARIANTS[toast.type];

  return (
    <Animated.View
      pointerEvents={visible ? 'box-none' : 'none'}
      style={[
        styles.toastContainer,
        position === 'top' ? { top: insets.top + 8 } : { bottom: insets.bottom + 16 },
        containerStyle,
      ]}>
      <Pressable accessibilityRole="alert" onPress={onHide} style={styles.toast}>
        <FontAwesome name={variant.icon} size={20} color={variant.color} />
        <Text style={styles.toastMessage} numberOfLines={2}>
          {toast.message}
        </Text>
        {toast.action ? (
          <Pressable
            hitSlop={8}
            onPress={() => {
              toast.action?.onPress();
              onHide();
            }}>
            <Text style={[styles.toastAction, { color: variant.color }]}>{toast.action.label}</Text>
          </Pressable>
        ) : null}
        <Animated.View style={[styles.toastCountdown, { backgroundColor: variant.color }, countdownStyle]} />
      </Pressable>
    </Animated.View>
  );
}

const SEARCH_CANCEL_WIDTH = 64;

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

function SearchBar({ value, onChangeText, placeholder = 'Search' }: SearchBarProps) {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  // The iOS "Cancel" button slides in from the right while the field is focused.
  const progress = useDerivedValue(() => withTiming(focused ? 1 : 0, { duration: 220 }));
  const cancelStyle = useAnimatedStyle(() => ({
    width: progress.value * SEARCH_CANCEL_WIDTH,
    opacity: progress.value,
  }));

  const cancel = () => {
    onChangeText('');
    inputRef.current?.blur();
  };

  return (
    <View style={styles.searchRow}>
      <Pressable style={styles.searchField} onPress={() => inputRef.current?.focus()}>
        <FontAwesome name="search" size={15} color={COLORS.secondaryText} />
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.secondaryText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          style={styles.searchInput}
        />
        {value.length > 0 ? (
          <Pressable accessibilityLabel="Clear search" hitSlop={8} onPress={() => onChangeText('')}>
            <FontAwesome name="times-circle" size={16} color={COLORS.secondaryText} />
          </Pressable>
        ) : null}
      </Pressable>
      <Animated.View style={[styles.searchCancelContainer, cancelStyle]}>
        <Pressable onPress={cancel} hitSlop={8}>
          <Text style={styles.searchCancel} numberOfLines={1}>
            Cancel
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// Renders `text` with the parts matching `query` (case-insensitive) in bold.
function HighlightedText({ text, query, style = styles.rowLabel }: { text: string; query: string; style?: TextStyle }) {
  const q = query.trim();
  if (!q) return <Text style={style}>{text}</Text>;

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'i'));
  return (
    <Text style={style}>
      {parts.map((part, i) =>
        part.toLowerCase() === q.toLowerCase() ? (
          <Text key={i} style={styles.searchHighlight}>
            {part}
          </Text>
        ) : (
          part
        ),
      )}
    </Text>
  );
}

type IconName = React.ComponentProps<typeof FontAwesome>['name'];

type Segment = string | { icon: IconName; label?: string; accessibilityLabel?: string };

type SegmentedControlProps = {
  segments: Segment[];
  selectedIndex: number;
  onChange: (index: number) => void;
  disabled?: boolean;
  // Fills the sliding thumb with this color (and turns the selected label white) instead of iOS's white thumb.
  activeColor?: string;
};

const SEGMENT_PADDING = 2;

function SegmentedControl({ segments, selectedIndex, onChange, disabled = false, activeColor }: SegmentedControlProps) {
  const [width, setWidth] = useState(0);
  const segmentWidth = width > 0 ? (width - SEGMENT_PADDING * 2) / segments.length : 0;

  const thumbStyle = useAnimatedStyle(() => ({
    width: segmentWidth,
    transform: [{ translateX: withSpring(selectedIndex * segmentWidth, { damping: 20, stiffness: 250 }) }],
  }));

  return (
    <View
      accessibilityRole="tablist"
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={[styles.segmentedTrack, disabled && styles.disabled]}>
      {segmentWidth > 0 ? (
        <Animated.View
          style={[styles.segmentedThumb, activeColor ? { backgroundColor: activeColor } : null, thumbStyle]}
        />
      ) : null}
      {segments.map((segment, i) => {
        const selected = i === selectedIndex;
        const color = selected && activeColor ? '#FFFFFF' : COLORS.text;
        const { label, icon, accessibilityLabel } =
          typeof segment === 'string' ? { label: segment, icon: undefined, accessibilityLabel: segment } : segment;
        return (
          <Pressable
            key={i}
            accessibilityRole="tab"
            accessibilityLabel={accessibilityLabel ?? label}
            accessibilityState={{ selected, disabled }}
            disabled={disabled}
            onPress={() => onChange(i)}
            style={styles.segment}>
            {icon ? <FontAwesome name={icon} size={14} color={color} /> : null}
            {label ? (
              <Text
                numberOfLines={1}
                style={[styles.segmentLabel, selected && styles.segmentLabelSelected, { color }]}>
                {label}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const FAB_SIZE = 56;
const FAB_EXTENDED_WIDTH = 148;
const FAB_ICON_SIZE = 22;
const FAB_MINI_SIZE = 44;

type FabAction = {
  icon: IconName;
  label: string;
  color: string;
  onPress: () => void;
};

type SpeedDialItemProps = {
  action: FabAction;
  // 0 = closest to the main button; items animate in from nearest to farthest.
  order: number;
  open: boolean;
  onPress: () => void;
};

function SpeedDialItem({ action, order, open, onPress }: SpeedDialItemProps) {
  const progress = useDerivedValue(() =>
    open
      ? withDelay(order * 40, withSpring(1, { damping: 15, stiffness: 220 }))
      : withTiming(0, { duration: 150 }),
  );

  const itemStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 20 }, { scale: 0.8 + progress.value * 0.2 }],
  }));

  return (
    <Animated.View style={[styles.speedDialItem, itemStyle]}>
      <Pressable onPress={onPress} style={styles.speedDialLabel}>
        <Text style={styles.speedDialLabelText}>{action.label}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={action.label}
        onPress={onPress}
        style={({ pressed }) => [styles.speedDialButton, pressed && styles.demoButtonPressed]}>
        <FontAwesome name={action.icon} size={18} color={action.color} />
      </Pressable>
    </Animated.View>
  );
}

type FloatingActionButtonProps = {
  label: string;
  // Shows the label next to the icon; collapses to a circle when false.
  extended: boolean;
  // With actions, tapping the FAB opens a speed dial; without, it calls onPress.
  actions?: FabAction[];
  onPress?: () => void;
};

function FloatingActionButton({ label, extended, actions = [], onPress }: FloatingActionButtonProps) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const hasSpeedDial = actions.length > 0;

  const openProgress = useDerivedValue(() => withSpring(open ? 1 : 0, { damping: 18, stiffness: 220 }));
  const extendProgress = useDerivedValue(() => withTiming(extended && !open ? 1 : 0, { duration: 220 }));

  const fabStyle = useAnimatedStyle(() => ({
    width: FAB_SIZE + extendProgress.value * (FAB_EXTENDED_WIDTH - FAB_SIZE),
  }));
  const labelStyle = useAnimatedStyle(() => ({ opacity: extendProgress.value }));
  // "+" rotates into "×" while the speed dial is open.
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${openProgress.value * 45}deg` }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: openProgress.value }));

  const runAction = (action: FabAction) => {
    setOpen(false);
    action.onPress();
  };

  return (
    <>
      <Animated.View
        pointerEvents={open ? 'auto' : 'none'}
        style={[StyleSheet.absoluteFill, styles.fabBackdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
      </Animated.View>

      <View pointerEvents="box-none" style={[styles.fabContainer, { bottom: insets.bottom + 20 }]}>
        <View pointerEvents={open ? 'box-none' : 'none'} style={styles.speedDial}>
          {actions.map((action, i) => (
            <SpeedDialItem
              key={action.label}
              action={action}
              order={actions.length - 1 - i}
              open={open}
              onPress={() => runAction(action)}
            />
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityState={hasSpeedDial ? { expanded: open } : undefined}
          onPress={() => (hasSpeedDial ? setOpen((o) => !o) : onPress?.())}
          style={({ pressed }) => pressed && styles.fabPressed}>
          <Animated.View style={[styles.fab, fabStyle]}>
            <Animated.View style={[styles.fabIcon, iconStyle]}>
              <FontAwesome name="plus" size={FAB_ICON_SIZE} color="#FFFFFF" />
            </Animated.View>
            <Animated.Text numberOfLines={1} style={[styles.fabLabel, labelStyle]}>
              {label}
            </Animated.Text>
          </Animated.View>
        </Pressable>
      </View>
    </>
  );
}

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  // Visible heights as fractions of the window height, ascending. Opens at the first one.
  snapPoints?: number[];
  title?: string;
  children: ReactNode;
};

function BottomSheet({ visible, onClose, snapPoints = [0.5], title, children }: BottomSheetProps) {
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const sheetHeight = windowHeight * snapPoints[snapPoints.length - 1];
  // translateY for each snap point: 0 = fully expanded, sheetHeight (+ shadow room) = hidden.
  const snapOffsets = snapPoints.map((p) => sheetHeight - windowHeight * p);
  const closedOffset = sheetHeight + 24;

  const translateY = useSharedValue(windowHeight);
  const dragStart = useRef(0);

  const animateTo = useCallback(
    (y: number) => {
      translateY.value = withSpring(y, { damping: 24, stiffness: 240, overshootClamping: true });
    },
    [translateY],
  );

  useEffect(() => {
    if (visible) animateTo(snapOffsets[0]);
    else translateY.value = withTiming(closedOffset, { duration: 220 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, sheetHeight]);

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  // PanResponder is created once, so it reads the latest layout and callbacks through a ref.
  const latest = useRef({ snapOffsets, closedOffset, onClose, animateTo });
  latest.current = { snapOffsets, closedOffset, onClose, animateTo };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
      onPanResponderGrant: () => {
        dragStart.current = translateY.value;
      },
      onPanResponderMove: (_, g) => {
        const y = dragStart.current + g.dy;
        // Rubber-band when dragging above the tallest snap point.
        translateY.value = y < 0 ? y / 4 : y;
      },
      onPanResponderRelease: (_, g) => {
        const { snapOffsets, closedOffset, onClose, animateTo } = latest.current;
        // Project the release velocity forward so a quick flick moves to the next stop.
        const projected = dragStart.current + g.dy + g.vy * 150;
        const stops = [...snapOffsets, closedOffset];
        const target = stops.reduce((best, stop) =>
          Math.abs(stop - projected) < Math.abs(best - projected) ? stop : best,
        );
        if (target === closedOffset) onClose();
        else animateTo(target);
      },
      onPanResponderTerminate: () => {
        const { snapOffsets, animateTo } = latest.current;
        animateTo(snapOffsets[0]);
      },
    }),
  ).current;

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [closedOffset, snapOffsets[0]], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <View pointerEvents={visible ? 'box-none' : 'none'} style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.fabBackdrop, backdropStyle]}>
        <Pressable accessibilityLabel="Close sheet" style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View
        accessibilityViewIsModal
        style={[styles.sheet, { height: sheetHeight + windowHeight * 0.1, paddingBottom: windowHeight * 0.1 }, sheetStyle]}>
        <View {...panResponder.panHandlers} style={styles.sheetHeader}>
          <View style={styles.sheetHandle} />
          {title ? <Text style={styles.sheetTitle}>{title}</Text> : null}
        </View>
        <View style={[styles.sheetBody, { paddingBottom: insets.bottom }]}>{children}</View>
      </Animated.View>
    </View>
  );
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const isSameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime();

const formatDate = (d: Date) =>
  d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
const formatTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

type CalendarProps = {
  value: Date;
  // Called with the picked day; the time of day from `value` is preserved.
  onChange: (date: Date) => void;
  minimumDate?: Date;
  accentColor?: string;
};

function Calendar({ value, onChange, minimumDate, accentColor = '#007AFF' }: CalendarProps) {
  const [viewMonth, setViewMonth] = useState(() => new Date(value.getFullYear(), value.getMonth(), 1));
  const today = new Date();

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const leadingBlanks = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const canGoBack = !minimumDate || new Date(year, month, 1) > startOfDay(minimumDate);
  const shiftMonth = (delta: number) => setViewMonth(new Date(year, month + delta, 1));

  return (
    <View style={styles.calendar}>
      <View style={styles.calendarHeader}>
        <Text style={styles.calendarMonth}>
          {viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Text>
        <View style={styles.calendarNav}>
          <Pressable
            accessibilityLabel="Previous month"
            disabled={!canGoBack}
            hitSlop={8}
            onPress={() => shiftMonth(-1)}
            style={!canGoBack && styles.disabled}>
            <FontAwesome name="chevron-left" size={16} color={accentColor} />
          </Pressable>
          <Pressable accessibilityLabel="Next month" hitSlop={8} onPress={() => shiftMonth(1)}>
            <FontAwesome name="chevron-right" size={16} color={accentColor} />
          </Pressable>
        </View>
      </View>

      <View style={styles.calendarGrid}>
        {WEEKDAYS.map((day, i) => (
          <Text key={i} style={[styles.calendarCell, styles.calendarWeekday]}>
            {day}
          </Text>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <View key={`blank-${i}`} style={styles.calendarCell} />;
          const date = new Date(year, month, day, value.getHours(), value.getMinutes());
          const selected = isSameDay(date, value);
          const isToday = isSameDay(date, today);
          const disabled = !!minimumDate && startOfDay(date) < startOfDay(minimumDate);
          return (
            <Pressable
              key={day}
              accessibilityRole="button"
              accessibilityLabel={formatDate(date)}
              accessibilityState={{ selected, disabled }}
              disabled={disabled}
              onPress={() => onChange(date)}
              style={styles.calendarCell}>
              <View style={[styles.calendarDay, selected && { backgroundColor: accentColor }]}>
                <Text
                  style={[
                    styles.calendarDayText,
                    isToday && { color: accentColor, fontFamily: 'BeVietnamPro_600SemiBold' },
                    selected && styles.calendarDayTextSelected,
                    disabled && styles.calendarDayTextDisabled,
                  ]}>
                  {day}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const WHEEL_ITEM_HEIGHT = 36;
const WHEEL_VISIBLE_ITEMS = 5;
const WHEEL_PADDING = WHEEL_ITEM_HEIGHT * Math.floor(WHEEL_VISIBLE_ITEMS / 2);
const IS_WEB = Platform.OS === 'web';

type WheelItemProps = {
  label: string;
  index: number;
  scrollY: SharedValue<number>;
  onPress: () => void;
};

function WheelItem({ label, index, scrollY, onPress }: WheelItemProps) {
  // Items fade, shrink and tilt as they move away from the center row, like a UIPickerView drum.
  const itemStyle = useAnimatedStyle(() => {
    const distance = (index * WHEEL_ITEM_HEIGHT - scrollY.value) / WHEEL_ITEM_HEIGHT;
    const abs = Math.abs(distance);
    return {
      opacity: interpolate(abs, [0, 2.5], [1, 0.25], Extrapolation.CLAMP),
      transform: [
        { perspective: 400 },
        { rotateX: `${interpolate(distance, [-3, 3], [60, -60], Extrapolation.CLAMP)}deg` },
        { scale: interpolate(abs, [0, 2.5], [1, 0.85], Extrapolation.CLAMP) },
      ],
    };
  });

  return (
    <Pressable onPress={onPress} style={styles.wheelItem}>
      <Animated.Text style={[styles.wheelItemText, itemStyle]}>{label}</Animated.Text>
    </Pressable>
  );
}

type WheelPickerProps = {
  items: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  width?: number;
};

function WheelPicker({ items, selectedIndex, onChange, width = 64 }: WheelPickerProps) {
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollY = useSharedValue(selectedIndex * WHEEL_ITEM_HEIGHT);
  const lastIndex = useSharedValue(selectedIndex);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const notifyChange = (index: number) => onChangeRef.current(index);

  const scrollToIndex = (index: number, animated = true) =>
    scrollRef.current?.scrollTo({ y: index * WHEEL_ITEM_HEIGHT, animated });

  // Web has no reliable snapToInterval/momentum-end, so snap to the nearest row once scrolling pauses.
  const settleSoon = (y: number) => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      const index = Math.round(y / WHEEL_ITEM_HEIGHT);
      if (Math.abs(y - index * WHEEL_ITEM_HEIGHT) > 1) scrollToIndex(index);
    }, 120);
  };

  useEffect(() => () => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
  }, []);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
      const index = Math.min(items.length - 1, Math.max(0, Math.round(e.contentOffset.y / WHEEL_ITEM_HEIGHT)));
      if (index !== lastIndex.value) {
        lastIndex.value = index;
        scheduleOnRN(notifyChange, index);
      }
      if (IS_WEB) scheduleOnRN(settleSoon, e.contentOffset.y);
    },
  });

  // Follow external changes to selectedIndex (e.g. the value was set elsewhere).
  useEffect(() => {
    if (selectedIndex !== lastIndex.value) {
      lastIndex.value = selectedIndex;
      scrollToIndex(selectedIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex]);

  return (
    <Animated.ScrollView
      ref={scrollRef}
      style={[styles.wheel, { width }]}
      contentContainerStyle={styles.wheelContent}
      showsVerticalScrollIndicator={false}
      snapToInterval={WHEEL_ITEM_HEIGHT}
      decelerationRate="fast"
      nestedScrollEnabled
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      onLayout={() => scrollToIndex(selectedIndex, false)}>
      {items.map((label, i) => (
        <WheelItem key={`${label}-${i}`} label={label} index={i} scrollY={scrollY} onPress={() => scrollToIndex(i)} />
      ))}
    </Animated.ScrollView>
  );
}

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const PERIODS_AM_PM = ['AM', 'PM'];

type TimePickerProps = {
  value: Date;
  onChange: (date: Date) => void;
  minuteInterval?: number;
};

function TimePicker({ value, onChange, minuteInterval = 5 }: TimePickerProps) {
  const minutes = Array.from({ length: 60 / minuteInterval }, (_, i) => String(i * minuteInterval).padStart(2, '0'));

  const hours24 = value.getHours();
  const hourIndex = (hours24 % 12 || 12) - 1;
  const minuteIndex = Math.min(minutes.length - 1, Math.round(value.getMinutes() / minuteInterval));
  const periodIndex = hours24 >= 12 ? 1 : 0;

  const update = (h: number, m: number, p: number) => {
    const next = new Date(value);
    next.setHours(((h + 1) % 12) + (p === 1 ? 12 : 0), m * minuteInterval, 0, 0);
    onChange(next);
  };

  return (
    <View style={styles.timePicker}>
      <View pointerEvents="none" style={styles.wheelHighlight} />
      <WheelPicker items={HOURS} selectedIndex={hourIndex} onChange={(i) => update(i, minuteIndex, periodIndex)} />
      <Text style={styles.timeSeparator}>:</Text>
      <WheelPicker items={minutes} selectedIndex={minuteIndex} onChange={(i) => update(hourIndex, i, periodIndex)} />
      <WheelPicker
        items={PERIODS_AM_PM}
        selectedIndex={periodIndex}
        onChange={(i) => update(hourIndex, minuteIndex, i)}
      />
    </View>
  );
}

const SWIPE_ACTION_WIDTH = 76;

type SwipeAction = {
  icon: IconName;
  label: string;
  color: string;
  onPress: () => void;
};

type SwipeableRowProps = {
  id: string;
  // Only one row is open at a time: the parent tracks which one.
  openId: string | null;
  onOpenChange: (id: string | null) => void;
  // Revealed by swiping right.
  leftActions?: SwipeAction[];
  // Revealed by swiping left; the last one is the outermost.
  rightActions?: SwipeAction[];
  // Swiping far left triggers the last right action without tapping it (like Delete in iOS Mail).
  fullSwipe?: boolean;
  onPress?: () => void;
  isLast?: boolean;
  children: ReactNode;
};

function SwipeableRow({
  id,
  openId,
  onOpenChange,
  leftActions = [],
  rightActions = [],
  fullSwipe = false,
  onPress,
  isLast,
  children,
}: SwipeableRowProps) {
  const translateX = useSharedValue(0);
  const [width, setWidth] = useState(0);
  const dragStart = useRef(0);

  const leftWidth = leftActions.length * SWIPE_ACTION_WIDTH;
  const rightWidth = rightActions.length * SWIPE_ACTION_WIDTH;

  const latest = useRef({ id, leftWidth, rightWidth, width, fullSwipe, onOpenChange, rightActions });
  latest.current = { id, leftWidth, rightWidth, width, fullSwipe, onOpenChange, rightActions };

  const springTo = (x: number) => {
    translateX.value = withSpring(x, { damping: 22, stiffness: 260, overshootClamping: true });
  };

  // Close when another row opens (or the parent clears openId).
  useEffect(() => {
    if (openId !== id) springTo(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId, id]);

  const panResponder = useRef(
    PanResponder.create({
      // Claim only clearly horizontal drags so vertical scrolling keeps working.
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        dragStart.current = translateX.value;
        latest.current.onOpenChange(latest.current.id);
      },
      onPanResponderMove: (_, g) => {
        const { leftWidth, rightWidth, width, fullSwipe } = latest.current;
        let x = dragStart.current + g.dx;
        // Resist dragging past the revealed actions (unless full swipe is allowed).
        if (x > leftWidth) x = leftWidth + (x - leftWidth) / 3;
        if (x < -rightWidth) x = fullSwipe ? Math.max(x, -width) : -rightWidth + (x + rightWidth) / 3;
        translateX.value = x;
      },
      onPanResponderRelease: (_, g) => {
        const { id, leftWidth, rightWidth, width, fullSwipe, onOpenChange, rightActions } = latest.current;
        const x = translateX.value;

        if (fullSwipe && rightActions.length > 0 && x < -width * 0.55) {
          translateX.value = withTiming(-width, { duration: 180 });
          onOpenChange(null);
          setTimeout(() => rightActions[rightActions.length - 1].onPress(), 180);
          // Reset only after the row has had time to animate out, so a deleted row doesn't flash back first.
          setTimeout(() => {
            translateX.value = 0;
          }, 500);
          return;
        }

        const projected = x + g.vx * 100;
        let target = 0;
        if (rightWidth > 0 && projected < -rightWidth / 2) target = -rightWidth;
        else if (leftWidth > 0 && projected > leftWidth / 2) target = leftWidth;
        springTo(target);
        onOpenChange(target === 0 ? null : id);
      },
      onPanResponderTerminate: () => {
        springTo(0);
        latest.current.onOpenChange(null);
      },
    }),
  ).current;

  const contentStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));
  const leftStyle = useAnimatedStyle(() => ({ opacity: translateX.value > 0 ? 1 : 0 }));
  const rightStyle = useAnimatedStyle(() => ({ opacity: translateX.value < 0 ? 1 : 0 }));

  const runAction = (action: SwipeAction) => {
    onOpenChange(null);
    action.onPress();
  };

  const renderActions = (actions: SwipeAction[]) =>
    actions.map((action) => (
      <Pressable
        key={action.label}
        accessibilityRole="button"
        accessibilityLabel={action.label}
        onPress={() => runAction(action)}
        style={[styles.swipeAction, { backgroundColor: action.color }]}>
        <FontAwesome name={action.icon} size={18} color="#FFFFFF" />
        <Text style={styles.swipeActionLabel}>{action.label}</Text>
      </Pressable>
    ));

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={styles.swipeRow}>
      {leftActions.length > 0 ? (
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.swipeActionsLeft, { backgroundColor: leftActions[0].color }, leftStyle]}>
          {renderActions(leftActions)}
        </Animated.View>
      ) : null}
      {rightActions.length > 0 ? (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.swipeActionsRight,
            // Fills the overshoot area during a full swipe with the outermost action's color.
            { backgroundColor: rightActions[rightActions.length - 1].color },
            rightStyle,
          ]}>
          {renderActions(rightActions)}
        </Animated.View>
      ) : null}
      <Animated.View {...panResponder.panHandlers} style={[styles.swipeContent, contentStyle]}>
        <Pressable
          onPress={() => (openId === id ? onOpenChange(null) : onPress?.())}
          style={({ pressed }) => [styles.swipeContentInner, !isLast && styles.rowSeparator, pressed && styles.swipePressed]}>
          {children}
        </Pressable>
      </Animated.View>
    </View>
  );
}

type Mail = {
  id: string;
  from: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
  flagged: boolean;
};

const INITIAL_MAILS: Mail[] = [
  {
    id: '1',
    from: 'GitHub',
    subject: '[taskflow] PR #42 merged',
    preview: 'Your pull request “Add UI components demo” was merged into main.',
    time: '9:41 AM',
    unread: true,
    flagged: false,
  },
  {
    id: '2',
    from: 'Linh Nguyen',
    subject: 'Design review notes',
    preview: 'I left a few comments on the bottom sheet spacing and the FAB shadow.',
    time: '8:15 AM',
    unread: true,
    flagged: true,
  },
  {
    id: '3',
    from: 'Expo',
    subject: 'SDK 57 is now available',
    preview: 'Upgrade to get the latest React Native, faster builds and new APIs.',
    time: 'Yesterday',
    unread: false,
    flagged: false,
  },
  {
    id: '4',
    from: 'Vercel',
    subject: 'Deployment ready',
    preview: 'taskflow-web was successfully deployed to production.',
    time: 'Yesterday',
    unread: false,
    flagged: false,
  },
  {
    id: '5',
    from: 'Minh Tran',
    subject: 'Lunch on Friday?',
    preview: 'There is a new phở place near the office, want to try it?',
    time: 'Mon',
    unread: false,
    flagged: false,
  },
];

type RatingIcon = 'star' | 'heart';

const RATING_EMPTY_COLOR = '#D1D1D6';

type RatingSymbolProps = {
  icon: RatingIcon;
  // 0..1 — how much of this symbol is filled.
  fill: number;
  size: number;
  color: string;
  animate: boolean;
};

function RatingSymbol({ icon, fill, size, color, animate }: RatingSymbolProps) {
  const scale = useSharedValue(1);
  const wasFilled = useRef(fill > 0);

  // Pop the symbol when it becomes filled.
  useEffect(() => {
    const filled = fill > 0;
    if (animate && filled && !wasFilled.current) {
      scale.value = withSequence(withTiming(1.3, { duration: 100 }), withSpring(1, { damping: 8, stiffness: 300 }));
    }
    wasFilled.current = filled;
  }, [fill, animate, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[{ width: size, height: size }, style]}>
      <FontAwesome name={icon} size={size} color={RATING_EMPTY_COLOR} />
      {/* The filled symbol is clipped to `fill` of its width, which also renders half and fractional values. */}
      <View style={[styles.ratingFill, { width: size * fill }]}>
        <FontAwesome name={icon} size={size} color={color} />
      </View>
    </Animated.View>
  );
}

type RatingProps = {
  value: number;
  // Omit to render a read-only rating (fractional values like 4.3 are supported).
  onChange?: (value: number) => void;
  max?: number;
  size?: number;
  gap?: number;
  color?: string;
  icon?: RatingIcon;
  allowHalf?: boolean;
};

function Rating({
  value,
  onChange,
  max = 5,
  size = 28,
  gap = 6,
  color = '#FFCC00',
  icon = 'star',
  allowHalf = false,
}: RatingProps) {
  const interactive = !!onChange;

  const latest = useRef({ onChange, max, size, gap, allowHalf, value });
  latest.current = { onChange, max, size, gap, allowHalf, value };

  const valueFromX = (x: number) => {
    const { max, size, gap, allowHalf } = latest.current;
    const unit = size + gap;
    const index = Math.min(max - 1, Math.max(0, Math.floor(x / unit)));
    const withinStar = (x - index * unit) / size;
    const step = allowHalf && withinStar <= 0.5 ? 0.5 : 1;
    return index + step;
  };

  // Tap a symbol or drag across the row to set the rating.
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !!latest.current.onChange,
      onMoveShouldSetPanResponder: () => !!latest.current.onChange,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => update(e.nativeEvent.locationX),
      onPanResponderMove: (e) => update(e.nativeEvent.locationX),
    }),
  ).current;

  function update(x: number) {
    const next = valueFromX(x);
    if (next !== latest.current.value) latest.current.onChange?.(next);
  }

  return (
    <View
      {...(interactive ? panResponder.panHandlers : null)}
      accessible
      accessibilityRole={interactive ? 'adjustable' : 'text'}
      accessibilityLabel={`Rating: ${value} of ${max}`}
      accessibilityActions={interactive ? [{ name: 'increment' }, { name: 'decrement' }] : undefined}
      onAccessibilityAction={(e) => {
        const step = allowHalf ? 0.5 : 1;
        if (e.nativeEvent.actionName === 'increment') onChange?.(Math.min(max, value + step));
        if (e.nativeEvent.actionName === 'decrement') onChange?.(Math.max(step, value - step));
      }}
      style={[styles.rating, { gap }]}>
      {/* Children ignore touches so locationX is always relative to the whole row. */}
      <View pointerEvents="none" style={[styles.rating, { gap }]}>
        {Array.from({ length: max }, (_, i) => (
          <RatingSymbol
            key={i}
            icon={icon}
            fill={Math.min(1, Math.max(0, value - i))}
            size={size}
            color={color}
            animate={interactive}
          />
        ))}
      </View>
    </View>
  );
}

const RATING_LABELS = ['Tap a star to rate', 'Terrible', 'Bad', 'Okay', 'Good', 'Excellent'];

const REVIEW_DISTRIBUTION = [
  { stars: 5, count: 812 },
  { stars: 4, count: 264 },
  { stars: 3, count: 88 },
  { stars: 2, count: 31 },
  { stars: 1, count: 45 },
];
const REVIEW_TOTAL = REVIEW_DISTRIBUTION.reduce((sum, r) => sum + r.count, 0);
const REVIEW_AVERAGE = REVIEW_DISTRIBUTION.reduce((sum, r) => sum + r.stars * r.count, 0) / REVIEW_TOTAL;

type Step = { title: string; description?: string };

type StepState = 'done' | 'current' | 'upcoming';

function StepCircle({ index, state, color }: { index: number; state: StepState; color: string }) {
  const scale = useDerivedValue(() =>
    state === 'current' ? withSequence(withTiming(1.15, { duration: 120 }), withSpring(1)) : withTiming(1),
  );
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      style={[
        styles.stepCircle,
        state === 'done' && { backgroundColor: color, borderColor: color },
        state === 'current' && { borderColor: color },
        style,
      ]}>
      {state === 'done' ? (
        <FontAwesome name="check" size={12} color="#FFFFFF" />
      ) : (
        <Text style={[styles.stepNumber, state === 'current' && { color }]}>{index + 1}</Text>
      )}
    </Animated.View>
  );
}

function StepConnector({
  filled,
  delay = 0,
  color,
  vertical = false,
}: {
  filled: boolean;
  // Lets the line fill "flow" from one step into the next when moving forward.
  delay?: number;
  color: string;
  vertical?: boolean;
}) {
  const progress = useDerivedValue(() =>
    filled ? withDelay(delay, withTiming(1, { duration: 200 })) : withTiming(0, { duration: 200 }),
  );
  const fillStyle = useAnimatedStyle(() =>
    vertical ? { height: `${progress.value * 100}%` } : { width: `${progress.value * 100}%` },
  );

  return (
    <View style={vertical ? styles.stepConnectorVertical : styles.stepConnector}>
      <Animated.View style={[styles.stepConnectorFill, { backgroundColor: color }, fillStyle]} />
    </View>
  );
}

type StepIndicatorProps = {
  steps: Step[];
  current: number;
  // Lets the user jump back to a completed step.
  onStepPress?: (index: number) => void;
  orientation?: 'horizontal' | 'vertical';
  color?: string;
};

function StepIndicator({ steps, current, onStepPress, orientation = 'horizontal', color = '#007AFF' }: StepIndicatorProps) {
  const stateOf = (i: number): StepState => (i < current ? 'done' : i === current ? 'current' : 'upcoming');

  if (orientation === 'vertical') {
    return (
      <View>
        {steps.map((step, i) => (
          <View key={step.title} style={styles.stepVertical}>
            <View style={styles.stepVerticalRail}>
              <StepCircle index={i} state={stateOf(i)} color={color} />
              {i < steps.length - 1 ? <StepConnector filled={current > i} color={color} vertical /> : null}
            </View>
            <View style={[styles.rowText, i < steps.length - 1 && styles.stepVerticalBody]}>
              <Text style={[styles.rowLabel, stateOf(i) === 'upcoming' && styles.stepLabelUpcoming]}>{step.title}</Text>
              {step.description ? <Text style={styles.rowDescription}>{step.description}</Text> : null}
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.stepHorizontal}>
      {steps.map((step, i) => {
        const state = stateOf(i);
        return (
          <Pressable
            key={step.title}
            accessibilityRole="button"
            accessibilityLabel={`Step ${i + 1}: ${step.title}`}
            accessibilityState={{ selected: state === 'current', disabled: state !== 'done' }}
            disabled={!onStepPress || state !== 'done'}
            onPress={() => onStepPress?.(i)}
            style={styles.stepHorizontalItem}>
            <View style={styles.stepHorizontalTrack}>
              {i > 0 ? <StepConnector filled={current >= i} delay={150} color={color} /> : <View style={styles.flex1} />}
              <StepCircle index={i} state={state} color={color} />
              {i < steps.length - 1 ? <StepConnector filled={current > i} color={color} /> : <View style={styles.flex1} />}
            </View>
            <Text
              numberOfLines={1}
              style={[
                styles.stepLabel,
                state === 'current' && { color, fontFamily: 'BeVietnamPro_600SemiBold' },
                state === 'upcoming' && styles.stepLabelUpcoming,
              ]}>
              {step.title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const WIZARD_STEPS: Step[] = [{ title: 'Details' }, { title: 'Schedule' }, { title: 'Assign' }, { title: 'Review' }];
const PRIORITIES = ['Low', 'Medium', 'High'];
const DUE_OPTIONS = ['Today', 'Tomorrow', 'Next week'];
const TEAM = ['Tony', 'Linh', 'Minh', 'Sarah'];

const ORDER_STEPS: Step[] = [
  { title: 'Order placed', description: 'Oct 1, 9:12 AM' },
  { title: 'Packed', description: 'Oct 1, 2:40 PM' },
  { title: 'Shipped', description: 'Oct 2, 8:05 AM · Ho Chi Minh City hub' },
  { title: 'Out for delivery', description: 'Driver: Nguyen Van A' },
  { title: 'Delivered', description: 'Leave at the front door' },
];

type CollapsibleProps = {
  expanded: boolean;
  // Height shown while collapsed (0 hides the content entirely; >0 gives a "Read more" preview).
  collapsedHeight?: number;
  duration?: number;
  children: ReactNode;
};

function Collapsible({ expanded, collapsedHeight = 0, duration = 250, children }: CollapsibleProps) {
  const contentHeight = useSharedValue(0);
  const progress = useDerivedValue(() => withTiming(expanded ? 1 : 0, { duration }));

  const containerStyle = useAnimatedStyle(() => {
    const collapsed = Math.min(collapsedHeight, contentHeight.value);
    return { height: collapsed + (contentHeight.value - collapsed) * progress.value };
  });

  return (
    <Animated.View style={[styles.collapsible, containerStyle]}>
      {/* Absolutely positioned so it lays out at its natural height regardless of the animated container. */}
      <View
        style={styles.collapsibleContent}
        onLayout={(e) => {
          const height = e.nativeEvent.layout.height;
          // Animate later size changes (e.g. nested content appearing), but not the first measurement.
          contentHeight.value =
            contentHeight.value === 0 ? height : withTiming(height, { duration: 200 });
        }}>
        {children}
      </View>
    </Animated.View>
  );
}

type AccordionItemProps = {
  title: string;
  subtitle?: string;
  icon?: IconName;
  iconColor?: string;
  expanded: boolean;
  onToggle: () => void;
  isLast?: boolean;
  children: ReactNode;
};

function AccordionItem({ title, subtitle, icon, iconColor = '#007AFF', expanded, onToggle, isLast, children }: AccordionItemProps) {
  const rotation = useDerivedValue(() => withTiming(expanded ? 180 : 0, { duration: 250 }));
  const chevronStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));

  return (
    <View style={!isLast && styles.rowSeparator}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={onToggle}
        style={({ pressed }) => [styles.row, pressed && styles.demoButtonPressed]}>
        {icon ? (
          <View style={[styles.accordionIcon, { backgroundColor: iconColor }]}>
            <FontAwesome name={icon} size={14} color="#FFFFFF" />
          </View>
        ) : null}
        <View style={styles.rowText}>
          <Text style={[styles.rowLabel, expanded && styles.accordionTitleExpanded]}>{title}</Text>
          {subtitle ? <Text style={styles.rowDescription}>{subtitle}</Text> : null}
        </View>
        <Animated.View style={chevronStyle}>
          <FontAwesome name="chevron-down" size={13} color={COLORS.secondaryText} />
        </Animated.View>
      </Pressable>
      <Collapsible expanded={expanded}>
        <View style={styles.accordionBody}>{children}</View>
      </Collapsible>
    </View>
  );
}

const FAQS = [
  {
    id: 'what',
    question: 'What is TaskFlow?',
    answer: 'TaskFlow is a simple task manager that helps you plan your day, track progress and collaborate with your team.',
  },
  {
    id: 'sync',
    question: 'Does it sync across devices?',
    answer:
      'Yes. Your tasks sync automatically between iPhone, Android and the web as soon as you are signed in with the same account.',
  },
  {
    id: 'offline',
    question: 'Can I use it offline?',
    answer:
      'You can create and edit tasks without a connection. Changes are saved on the device and uploaded the next time you are online.',
  },
  {
    id: 'price',
    question: 'Is it free?',
    answer: 'The personal plan is free forever. Team features such as shared projects and assignees are part of TaskFlow Pro.',
  },
];

const ABOUT_TEXT =
  'TaskFlow started as a weekend project to scratch our own itch: we wanted a to-do app that felt native on every platform, ' +
  'loaded instantly and never got in the way. Today it is used by thousands of people to organise everything from grocery ' +
  'lists to product launches. Every component in this demo — switches, sheets, pickers and swipe actions — is built with ' +
  'plain React Native and Reanimated, so it runs the same on iOS, Android and the web without extra native dependencies.';

type Rect = { x: number; y: number; width: number; height: number };
type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right' | 'auto';
type TooltipSide = Exclude<TooltipPlacement, 'auto'>;

type TooltipConfig = {
  text: string;
  title?: string;
  placement?: TooltipPlacement;
  // Dims everything except the target (coach-mark style).
  spotlight?: boolean;
  // Passive tooltips don't block touches and hide themselves (used for hover / long-press labels).
  passive?: boolean;
  duration?: number;
  step?: { index: number; total: number };
};

type TooltipState = TooltipConfig & { rect: Rect; id: number };

const TOOLTIP_ARROW = 6;
const TOOLTIP_GAP = 6;
const TOOLTIP_MARGIN = 8;
const SPOTLIGHT_PADDING = 6;
const OPPOSITE_SIDE: Record<TooltipSide, TooltipSide> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), Math.max(min, max));

const measureInWindow = (ref: React.RefObject<View | null>) =>
  new Promise<Rect | null>((resolve) => {
    if (!ref.current) return resolve(null);
    ref.current.measureInWindow((x, y, width, height) => resolve({ x, y, width, height }));
  });

function useTooltip() {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setTooltip(null);
  }, []);

  const show = useCallback(
    async (ref: React.RefObject<View | null>, config: TooltipConfig) => {
      const rect = await measureInWindow(ref);
      if (!rect) return;
      if (timer.current) clearTimeout(timer.current);
      setTooltip({ ...config, rect, id: Date.now() });
      if (config.passive || config.duration) timer.current = setTimeout(hide, config.duration ?? 1500);
    },
    [hide],
  );

  useEffect(() => hide, [hide]);

  return { tooltip, show, hide };
}

// Picks the requested side, flipping to the opposite one when the bubble would go off-screen.
function layoutTooltip(rect: Rect, size: { width: number; height: number }, placement: TooltipPlacement, screen: { width: number; height: number; top: number; bottom: number }) {
  const offset = TOOLTIP_ARROW + TOOLTIP_GAP;
  const fits: Record<TooltipSide, boolean> = {
    top: rect.y - size.height - offset >= screen.top + TOOLTIP_MARGIN,
    bottom: rect.y + rect.height + offset + size.height <= screen.height - screen.bottom - TOOLTIP_MARGIN,
    left: rect.x - size.width - offset >= TOOLTIP_MARGIN,
    right: rect.x + rect.width + offset + size.width <= screen.width - TOOLTIP_MARGIN,
  };
  const candidates: TooltipSide[] = placement === 'auto' ? ['top', 'bottom'] : [placement, OPPOSITE_SIDE[placement]];
  const side = candidates.find((c) => fits[c]) ?? candidates[0];

  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;

  if (side === 'top' || side === 'bottom') {
    const left = clamp(cx - size.width / 2, TOOLTIP_MARGIN, screen.width - size.width - TOOLTIP_MARGIN);
    const top = side === 'top' ? rect.y - size.height - offset : rect.y + rect.height + offset;
    return { side, left, top, arrowOffset: clamp(cx - left, 14, size.width - 14) };
  }
  const top = clamp(cy - size.height / 2, screen.top + TOOLTIP_MARGIN, screen.height - size.height - TOOLTIP_MARGIN);
  const left = side === 'left' ? rect.x - size.width - offset : rect.x + rect.width + offset;
  return { side, left, top, arrowOffset: clamp(cy - top, 14, size.height - 14) };
}

type TooltipOverlayProps = {
  tooltip: TooltipState | null;
  onDismiss: () => void;
  onNext?: () => void;
};

function TooltipOverlay({ tooltip, onDismiss, onNext }: TooltipOverlayProps) {
  const rootRef = useRef<View>(null);
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  // measureInWindow is window-relative; subtract the overlay's own origin to get local coordinates.
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const [bubble, setBubble] = useState<{ id: number; width: number; height: number } | null>(null);
  const progress = useSharedValue(0);

  const ready = !!tooltip && bubble?.id === tooltip.id;

  useEffect(() => {
    progress.value = 0;
    if (ready) progress.value = withTiming(1, { duration: 160 });
  }, [ready, tooltip?.id, progress]);

  const bubbleAnimStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.92 + progress.value * 0.08 }],
  }));

  const measureOrigin = () => rootRef.current?.measureInWindow((x, y) => setOrigin({ x, y }));

  if (!tooltip) {
    return <View ref={rootRef} pointerEvents="none" style={StyleSheet.absoluteFill} onLayout={measureOrigin} />;
  }

  const rect = { ...tooltip.rect, x: tooltip.rect.x - origin.x, y: tooltip.rect.y - origin.y };
  const layout = ready
    ? layoutTooltip(rect, bubble!, tooltip.placement ?? 'auto', {
        width: screenWidth,
        height: screenHeight,
        top: insets.top,
        bottom: insets.bottom,
      })
    : null;

  const arrowPosition = layout
    ? {
        top: { bottom: -TOOLTIP_ARROW, left: layout.arrowOffset - TOOLTIP_ARROW },
        bottom: { top: -TOOLTIP_ARROW, left: layout.arrowOffset - TOOLTIP_ARROW },
        left: { right: -TOOLTIP_ARROW, top: layout.arrowOffset - TOOLTIP_ARROW },
        right: { left: -TOOLTIP_ARROW, top: layout.arrowOffset - TOOLTIP_ARROW },
      }[layout.side]
    : null;

  const spot = {
    x: rect.x - SPOTLIGHT_PADDING,
    y: rect.y - SPOTLIGHT_PADDING,
    width: rect.width + SPOTLIGHT_PADDING * 2,
    height: rect.height + SPOTLIGHT_PADDING * 2,
  };

  return (
    <View
      ref={rootRef}
      pointerEvents={tooltip.passive ? 'none' : 'box-none'}
      style={StyleSheet.absoluteFill}
      onLayout={measureOrigin}>
      {!tooltip.passive ? (
        <Pressable accessibilityLabel="Dismiss tooltip" style={StyleSheet.absoluteFill} onPress={onDismiss} />
      ) : null}

      {tooltip.spotlight ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {/* Four dimmed rectangles around the target leave a "hole" over it. */}
          <View style={[styles.spotlightDim, { top: 0, left: 0, right: 0, height: Math.max(0, spot.y) }]} />
          <View style={[styles.spotlightDim, { top: spot.y + spot.height, left: 0, right: 0, bottom: 0 }]} />
          <View style={[styles.spotlightDim, { top: spot.y, left: 0, width: Math.max(0, spot.x), height: spot.height }]} />
          <View
            style={[styles.spotlightDim, { top: spot.y, left: spot.x + spot.width, right: 0, height: spot.height }]}
          />
          <View style={[styles.spotlightRing, { top: spot.y, left: spot.x, width: spot.width, height: spot.height }]} />
        </View>
      ) : null}

      <Animated.View
        accessibilityRole="alert"
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          if (bubble?.id !== tooltip.id || bubble.width !== width || bubble.height !== height) {
            setBubble({ id: tooltip.id, width, height });
          }
        }}
        style={[
          styles.tooltip,
          layout ? { left: layout.left, top: layout.top } : styles.tooltipMeasuring,
          bubbleAnimStyle,
        ]}>
        {arrowPosition ? <View style={[styles.tooltipArrow, arrowPosition]} /> : null}
        {tooltip.title ? <Text style={styles.tooltipTitle}>{tooltip.title}</Text> : null}
        <Text style={styles.tooltipText}>{tooltip.text}</Text>
        {tooltip.step ? (
          <View style={styles.tooltipFooter}>
            <Text style={styles.tooltipStep}>
              {tooltip.step.index + 1} of {tooltip.step.total}
            </Text>
            <View style={styles.tooltipButtons}>
              {tooltip.step.index < tooltip.step.total - 1 ? (
                <Pressable hitSlop={8} onPress={onDismiss}>
                  <Text style={styles.tooltipSkip}>Skip</Text>
                </Pressable>
              ) : null}
              <Pressable hitSlop={8} onPress={onNext} style={styles.tooltipNext}>
                <Text style={styles.tooltipNextLabel}>
                  {tooltip.step.index < tooltip.step.total - 1 ? 'Next' : 'Done'}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}

const TOOLBAR_ITEMS: { icon: IconName; label: string }[] = [
  { icon: 'bold', label: 'Bold' },
  { icon: 'italic', label: 'Italic' },
  { icon: 'underline', label: 'Underline' },
  { icon: 'link', label: 'Insert link' },
  { icon: 'image', label: 'Insert image' },
  { icon: 'list-ul', label: 'Bulleted list' },
];

const TOUR_STEPS = [
  { title: 'Search', text: 'Find any task by name, tag or assignee.' },
  { title: 'Filters', text: 'Narrow the list down by priority, due date or status.' },
  { title: 'New task', text: 'Tap here to add a task. You can also use the orange button at the bottom.' },
];

type SheetName = 'actions' | 'comments' | 'filters' | 'reminder';

const SHEET_ACTIONS: { icon: IconName; label: string; destructive?: boolean }[] = [
  { icon: 'share-square-o', label: 'Share' },
  { icon: 'link', label: 'Copy Link' },
  { icon: 'clone', label: 'Duplicate' },
  { icon: 'trash-o', label: 'Delete', destructive: true },
];

const COMMENTS = [
  { author: 'Linh', text: 'Looks great! Can we ship this on Friday?' },
  { author: 'Minh', text: 'The animation on the switch feels really smooth.' },
  { author: 'Sarah', text: 'Could the toast also support a bottom position on tablets?' },
  { author: 'Huy', text: 'Left a few notes on the segmented control spacing.' },
  { author: 'Alex', text: 'Approved from the design side ✅' },
  { author: 'Trang', text: 'QA passed on iOS 18 and Android 15.' },
  { author: 'Duc', text: 'Should the FAB hide when the keyboard is open?' },
  { author: 'Emma', text: 'Search highlight is a nice touch.' },
  { author: 'Nam', text: 'Let’s add haptics in the next iteration.' },
  { author: 'Chris', text: 'Merging after the last review round.' },
];

const SORT_OPTIONS = ['Newest', 'Oldest', 'Priority'];

const PERIODS = ['Day', 'Week', 'Month', 'Year'];
const PERIOD_STATS = [
  { done: 4, total: 6 },
  { done: 18, total: 25 },
  { done: 72, total: 96 },
  { done: 840, total: 1020 },
];
const TASK_FILTERS = ['All', 'Active', 'Completed'];
const TILE_COLORS = ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#007AFF', '#AF52DE'];

const COUNTRIES = [
  { name: 'Vietnam', flag: '🇻🇳', capital: 'Hanoi' },
  { name: 'Japan', flag: '🇯🇵', capital: 'Tokyo' },
  { name: 'South Korea', flag: '🇰🇷', capital: 'Seoul' },
  { name: 'Thailand', flag: '🇹🇭', capital: 'Bangkok' },
  { name: 'Singapore', flag: '🇸🇬', capital: 'Singapore' },
  { name: 'United States', flag: '🇺🇸', capital: 'Washington, D.C.' },
  { name: 'United Kingdom', flag: '🇬🇧', capital: 'London' },
  { name: 'France', flag: '🇫🇷', capital: 'Paris' },
  { name: 'Germany', flag: '🇩🇪', capital: 'Berlin' },
  { name: 'Australia', flag: '🇦🇺', capital: 'Canberra' },
  { name: 'Canada', flag: '🇨🇦', capital: 'Ottawa' },
  { name: 'Brazil', flag: '🇧🇷', capital: 'Brasília' },
];

type DemoButtonProps = {
  label: string;
  onPress: () => void;
  color?: string;
  selected?: boolean;
};

function DemoButton({ label, onPress, color = '#007AFF', selected = true }: DemoButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.demoButton,
        { borderColor: color, backgroundColor: selected ? color : 'transparent' },
        pressed && styles.demoButtonPressed,
      ]}>
      <Text style={[styles.demoButtonLabel, { color: selected ? '#FFFFFF' : color }]}>{label}</Text>
    </Pressable>
  );
}

export default function UIUXComponentsScreen() {
  const [wifi, setWifi] = useState(true);
  const [bluetooth, setBluetooth] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const [terms, setTerms] = useState(false);
  const [newsletter, setNewsletter] = useState(true);
  const [toppings, setToppings] = useState<string[]>(['Cheese']);
  const [tasks, setTasks] = useState([
    { title: 'Design onboarding', done: true },
    { title: 'Build login screen', done: false },
    { title: 'Write tests', done: false },
  ]);

  const allToppings = toppings.length === TOPPINGS.length;
  const someToppings = toppings.length > 0 && !allToppings;
  const toggleTopping = (name: string) =>
    setToppings((prev) => (prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]));
  const toggleTask = (index: number) =>
    setTasks((prev) => prev.map((t, i) => (i === index ? { ...t, done: !t.done } : t)));

  const { toast, visible: toastVisible, show: showToast, hide: hideToast } = useToast();
  const [toastPosition, setToastPosition] = useState<ToastPosition>('top');
  const [messageCount, setMessageCount] = useState(5);

  const [searchQuery, setSearchQuery] = useState('');
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const searchResults = COUNTRIES.filter(
    (c) => c.name.toLowerCase().includes(normalizedQuery) || c.capital.toLowerCase().includes(normalizedQuery),
  );

  const [period, setPeriod] = useState(1);
  const [layout, setLayout] = useState(0);
  const [taskFilter, setTaskFilter] = useState(0);
  const stats = PERIOD_STATS[period];

  const [showFab, setShowFab] = useState(true);
  const [fabSpeedDial, setFabSpeedDial] = useState(true);
  const [fabExtended, setFabExtended] = useState(true);
  const lastScrollY = useRef(0);

  // Collapse the FAB to a circle while scrolling down; extend it again on scroll up or at the top.
  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const dy = y - lastScrollY.current;
    if (Math.abs(dy) < 4) return;
    setFabExtended(dy < 0 || y <= 0);
    lastScrollY.current = y;
  };

  const fabActions: FabAction[] = [
    {
      icon: 'check-square-o',
      label: 'New Task',
      color: '#34C759',
      onPress: () => showToast({ type: 'success', message: 'New task created' }),
    },
    {
      icon: 'camera',
      label: 'Upload Photo',
      color: '#007AFF',
      onPress: () => showToast({ type: 'info', message: 'Opening camera…' }),
    },
    {
      icon: 'microphone',
      label: 'Voice Note',
      color: '#FF9500',
      onPress: () => showToast({ type: 'info', message: 'Recording voice note…' }),
    },
  ];

  const [openSheet, setOpenSheet] = useState<SheetName | null>(null);
  const closeSheet = useCallback(() => setOpenSheet(null), []);
  const [sortBy, setSortBy] = useState(0);
  const [showCompleted, setShowCompleted] = useState(true);
  const [onlyMine, setOnlyMine] = useState(false);

  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return d;
  });
  const [expandedPicker, setExpandedPicker] = useState<'date' | 'time' | null>(null);
  const [reminder, setReminder] = useState<Date | null>(null);
  const [reminderDraft, setReminderDraft] = useState(dueDate);
  const togglePicker = (picker: 'date' | 'time') => setExpandedPicker((p) => (p === picker ? null : picker));

  const [mails, setMails] = useState(INITIAL_MAILS);
  const [openMailId, setOpenMailId] = useState<string | null>(null);

  const updateMail = (id: string, patch: Partial<Mail>) =>
    setMails((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  const deleteMail = (mail: Mail) => {
    const index = mails.findIndex((m) => m.id === mail.id);
    setMails((prev) => prev.filter((m) => m.id !== mail.id));
    showToast({
      type: 'info',
      message: `Deleted “${mail.subject}”`,
      duration: 4000,
      action: {
        label: 'Undo',
        onPress: () =>
          setMails((prev) => (prev.some((m) => m.id === mail.id) ? prev : [...prev.slice(0, index), mail, ...prev.slice(index)])),
      },
    });
  };

  const [appRating, setAppRating] = useState(0);
  const [halfRating, setHalfRating] = useState(3.5);
  const [heartRating, setHeartRating] = useState(4);

  const [wizardStep, setWizardStep] = useState(0);
  const wizardDirection = useRef<1 | -1>(1);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState(1);
  const [taskDue, setTaskDue] = useState(0);
  const [taskRemind, setTaskRemind] = useState(true);
  const [taskAssignees, setTaskAssignees] = useState<string[]>([]);
  const [orderStep, setOrderStep] = useState(2);

  const goToWizardStep = (step: number) => {
    wizardDirection.current = step > wizardStep ? 1 : -1;
    setWizardStep(step);
  };
  const wizardStepValid = [taskTitle.trim().length > 0, true, taskAssignees.length > 0, true][wizardStep];
  const isLastWizardStep = wizardStep === WIZARD_STEPS.length - 1;

  const finishWizard = () => {
    showToast({ type: 'success', message: `Task “${taskTitle.trim()}” created` });
    setTaskTitle('');
    setTaskPriority(1);
    setTaskDue(0);
    setTaskRemind(true);
    setTaskAssignees([]);
    goToWizardStep(0);
  };

  const [openFaqs, setOpenFaqs] = useState<string[]>(['what']);
  const [allowMultipleFaqs, setAllowMultipleFaqs] = useState(false);
  const [openSettings, setOpenSettings] = useState<string[]>([]);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [pushSound, setPushSound] = useState(true);
  const [pushBadges, setPushBadges] = useState(false);
  const [shareAnalytics, setShareAnalytics] = useState(false);
  const [faceIdLock, setFaceIdLock] = useState(true);
  const [aboutExpanded, setAboutExpanded] = useState(false);

  const toggleFaq = (id: string) =>
    setOpenFaqs((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : allowMultipleFaqs ? [...prev, id] : [id],
    );
  const toggleSetting = (id: string) =>
    setOpenSettings((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));

  const { tooltip, show: showTooltip, hide: hideTooltip } = useTooltip();
  const placementRefs = {
    top: useRef<View>(null),
    bottom: useRef<View>(null),
    left: useRef<View>(null),
    right: useRef<View>(null),
  };
  const estimateInfoRef = useRef<View>(null);
  const storyPointsInfoRef = useRef<View>(null);
  const toolbarRefs = useRef<(View | null)[]>([]);
  const tourRefs = [useRef<View>(null), useRef<View>(null), useRef<View>(null)];
  const [tourStep, setTourStep] = useState<number | null>(null);

  const showTourStep = (index: number) => {
    setTourStep(index);
    showTooltip(tourRefs[index], {
      ...TOUR_STEPS[index],
      placement: 'bottom',
      spotlight: true,
      step: { index, total: TOUR_STEPS.length },
    });
  };
  const endTour = () => {
    setTourStep(null);
    hideTooltip();
  };
  const nextTourStep = () => {
    if (tourStep === null || tourStep >= TOUR_STEPS.length - 1) {
      endTour();
      showToast({ type: 'success', message: 'You’re all set!' });
    } else {
      showTourStep(tourStep + 1);
    }
  };

  const deleteMessage = () => {
    if (messageCount === 0) {
      showToast({ type: 'warning', message: 'No messages left to delete', position: toastPosition });
      return;
    }
    setMessageCount((c) => c - 1);
    showToast({
      type: 'info',
      message: 'Message deleted',
      position: toastPosition,
      duration: 4000,
      action: { label: 'Undo', onPress: () => setMessageCount((c) => c + 1) },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        onScroll={handleScroll}
        onScrollBeginDrag={() => {
          setOpenMailId(null);
          // Tooltips are positioned from a one-off measurement, so close them once the content moves.
          if (tooltip) endTour();
        }}
        scrollEventThrottle={16}>
        <Text style={styles.title}>UI/UX Components</Text>
        <Text style={styles.subtitle}>iOS-style Switch</Text>

        <Text style={styles.sectionHeader}>CONNECTIVITY</Text>
        <View style={styles.card}>
          <SettingRow label="Wi-Fi" value={wifi} onValueChange={setWifi} />
          <SettingRow label="Bluetooth" value={bluetooth} onValueChange={setBluetooth} isLast />
        </View>

        <Text style={styles.sectionHeader}>PREFERENCES</Text>
        <View style={styles.card}>
          <SettingRow
            label="Notifications"
            description="Custom active color"
            value={notifications}
            onValueChange={setNotifications}
            activeColor="#F4693F"
          />
          <SettingRow label="Dark Mode" value={darkMode} onValueChange={setDarkMode} />
          <SettingRow label="Disabled (on)" value onValueChange={() => {}} disabled />
          <SettingRow label="Disabled (off)" value={false} onValueChange={() => {}} disabled isLast />
        </View>

        <Text style={[styles.subtitle, styles.componentTitle]}>Checkbox</Text>

        <Text style={styles.sectionHeader}>BASIC</Text>
        <View style={styles.card}>
          <CheckboxRow label="I agree to the Terms of Service" value={terms} onValueChange={setTerms} />
          <CheckboxRow
            label="Subscribe to newsletter"
            value={newsletter}
            onValueChange={setNewsletter}
            activeColor="#F4693F"
          />
          <CheckboxRow label="Disabled (checked)" value onValueChange={() => {}} disabled />
          <CheckboxRow label="Disabled (unchecked)" value={false} onValueChange={() => {}} disabled isLast />
        </View>

        <Text style={styles.sectionHeader}>SELECT ALL (INDETERMINATE)</Text>
        <View style={styles.card}>
          <CheckboxRow
            label={`All toppings (${toppings.length}/${TOPPINGS.length})`}
            value={allToppings}
            indeterminate={someToppings}
            onValueChange={() => setToppings(allToppings ? [] : TOPPINGS)}
          />
          {TOPPINGS.map((name, i) => (
            <View key={name} style={styles.nestedRow}>
              <CheckboxRow
                label={name}
                value={toppings.includes(name)}
                onValueChange={() => toggleTopping(name)}
                isLast={i === TOPPINGS.length - 1}
              />
            </View>
          ))}
        </View>

        <Text style={styles.sectionHeader}>CIRCLE (REMINDERS STYLE)</Text>
        <View style={styles.card}>
          {tasks.map((task, i) => (
            <CheckboxRow
              key={task.title}
              label={task.title}
              shape="circle"
              activeColor="#007AFF"
              value={task.done}
              onValueChange={() => toggleTask(i)}
              isLast={i === tasks.length - 1}
            />
          ))}
        </View>

        <Text style={[styles.subtitle, styles.componentTitle]}>Toast</Text>

        <Text style={styles.sectionHeader}>POSITION</Text>
        <View style={styles.buttonGroup}>
          <DemoButton label="Top" selected={toastPosition === 'top'} onPress={() => setToastPosition('top')} />
          <DemoButton
            label="Bottom"
            selected={toastPosition === 'bottom'}
            onPress={() => setToastPosition('bottom')}
          />
        </View>

        <Text style={styles.sectionHeader}>TYPES</Text>
        <View style={styles.buttonGroup}>
          <DemoButton
            label="Success"
            color={TOAST_VARIANTS.success.color}
            onPress={() => showToast({ type: 'success', message: 'Task saved successfully', position: toastPosition })}
          />
          <DemoButton
            label="Error"
            color={TOAST_VARIANTS.error.color}
            onPress={() =>
              showToast({ type: 'error', message: 'Could not connect to server', position: toastPosition })
            }
          />
          <DemoButton
            label="Warning"
            color={TOAST_VARIANTS.warning.color}
            onPress={() => showToast({ type: 'warning', message: 'Battery is running low', position: toastPosition })}
          />
          <DemoButton
            label="Info"
            color={TOAST_VARIANTS.info.color}
            onPress={() => showToast({ type: 'info', message: 'A new version is available', position: toastPosition })}
          />
        </View>

        <Text style={styles.sectionHeader}>WITH ACTION (UNDO)</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, styles.rowText]}>Inbox: {messageCount} messages</Text>
            <DemoButton label="Delete" color={TOAST_VARIANTS.error.color} onPress={deleteMessage} />
          </View>
        </View>

        <Text style={[styles.subtitle, styles.componentTitle]}>Search Bar</Text>

        <Text style={styles.sectionHeader}>
          {normalizedQuery
            ? `${searchResults.length} RESULT${searchResults.length === 1 ? '' : 'S'}`
            : `COUNTRIES (${COUNTRIES.length})`}
        </Text>
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Search country or capital" />
        <View style={[styles.card, styles.searchResults]}>
          {searchResults.length === 0 ? (
            <View style={styles.searchEmpty}>
              <FontAwesome name="search" size={28} color={COLORS.separator} />
              <Text style={styles.searchEmptyTitle}>No Results</Text>
              <Text style={styles.rowDescription}>No matches for “{searchQuery.trim()}”</Text>
            </View>
          ) : (
            searchResults.map((country, i) => (
              <View key={country.name} style={[styles.row, i < searchResults.length - 1 && styles.rowSeparator]}>
                <Text style={styles.searchFlag}>{country.flag}</Text>
                <View style={styles.rowText}>
                  <HighlightedText text={country.name} query={searchQuery} />
                  <HighlightedText text={country.capital} query={searchQuery} style={styles.rowDescription} />
                </View>
              </View>
            ))
          )}
        </View>

        <Text style={[styles.subtitle, styles.componentTitle]}>Segmented Control</Text>

        <Text style={styles.sectionHeader}>BASIC</Text>
        <SegmentedControl segments={PERIODS} selectedIndex={period} onChange={setPeriod} />
        <View style={[styles.card, styles.segmentedContent, styles.statCard]}>
          <Text style={styles.rowDescription}>Tasks completed this {PERIODS[period].toLowerCase()}</Text>
          <Text style={styles.segmentedStat}>
            {stats.done}
            <Text style={styles.rowDescription}> / {stats.total}</Text>
          </Text>
        </View>

        <Text style={styles.sectionHeader}>WITH ICONS</Text>
        <SegmentedControl
          segments={[
            { icon: 'list', label: 'List' },
            { icon: 'th-large', label: 'Grid' },
          ]}
          selectedIndex={layout}
          onChange={setLayout}
        />
        <View style={[styles.segmentedContent, layout === 1 && styles.tileGrid]}>
          {TILE_COLORS.map((color, i) => (
            <View key={color} style={[styles.tile, layout === 1 ? styles.tileGridItem : styles.tileListItem]}>
              <View style={[styles.tileSwatch, { backgroundColor: color }]} />
              <Text style={styles.rowLabel}>Item {i + 1}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionHeader}>CUSTOM COLOR</Text>
        <SegmentedControl
          segments={TASK_FILTERS}
          selectedIndex={taskFilter}
          onChange={setTaskFilter}
          activeColor="#F4693F"
        />

        <Text style={styles.sectionHeader}>DISABLED</Text>
        <SegmentedControl segments={['First', 'Second', 'Third']} selectedIndex={0} onChange={() => {}} disabled />

        <Text style={[styles.subtitle, styles.componentTitle]}>Floating Action Button</Text>

        <Text style={styles.sectionHeader}>OPTIONS</Text>
        <View style={styles.card}>
          <SettingRow label="Show FAB" value={showFab} onValueChange={setShowFab} />
          <SettingRow
            label="Speed dial"
            description={fabSpeedDial ? 'Tap the FAB to open 3 quick actions' : 'Tap the FAB to run a single action'}
            value={fabSpeedDial}
            onValueChange={setFabSpeedDial}
            isLast
          />
        </View>
        <Text style={[styles.rowDescription, styles.fabHint]}>
          The FAB sits at the bottom-right corner. Scroll down to collapse it into a circle, scroll up to show the
          label again.
        </Text>

        <Text style={[styles.subtitle, styles.componentTitle]}>Bottom Sheet</Text>

        <Text style={styles.sectionHeader}>VARIANTS</Text>
        <View style={styles.buttonGroup}>
          <DemoButton label="Action sheet" onPress={() => setOpenSheet('actions')} />
          <DemoButton label="Comments (2 snaps)" onPress={() => setOpenSheet('comments')} />
          <DemoButton label="Filters" onPress={() => setOpenSheet('filters')} />
        </View>
        <Text style={[styles.rowDescription, styles.fabHint]}>
          Drag the handle to resize or dismiss, flick to jump between snap points, or tap the dimmed background to
          close.
        </Text>

        <Text style={[styles.subtitle, styles.componentTitle]}>Date / Time Picker</Text>

        <Text style={styles.sectionHeader}>INLINE (TAP A VALUE)</Text>
        <View style={styles.card}>
          <View style={[styles.row, styles.rowSeparator]}>
            <Text style={[styles.rowLabel, styles.rowText]}>Date</Text>
            <Pressable onPress={() => togglePicker('date')} style={styles.pickerPill}>
              <Text style={[styles.pickerPillText, expandedPicker === 'date' && styles.pickerPillTextActive]}>
                {formatDate(dueDate)}
              </Text>
            </Pressable>
          </View>
          {expandedPicker === 'date' ? (
            <View style={styles.rowSeparator}>
              <Calendar
                value={dueDate}
                onChange={(d) => {
                  setDueDate(d);
                  setExpandedPicker(null);
                }}
              />
            </View>
          ) : null}
          <View style={[styles.row, expandedPicker === 'time' && styles.rowSeparator]}>
            <Text style={[styles.rowLabel, styles.rowText]}>Time</Text>
            <Pressable onPress={() => togglePicker('time')} style={styles.pickerPill}>
              <Text style={[styles.pickerPillText, expandedPicker === 'time' && styles.pickerPillTextActive]}>
                {formatTime(dueDate)}
              </Text>
            </Pressable>
          </View>
          {expandedPicker === 'time' ? <TimePicker value={dueDate} onChange={setDueDate} /> : null}
        </View>

        <Text style={styles.sectionHeader}>IN A BOTTOM SHEET</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Reminder</Text>
              <Text style={styles.rowDescription}>
                {reminder ? `${formatDate(reminder)} at ${formatTime(reminder)}` : 'Not set'}
              </Text>
            </View>
            <DemoButton
              label={reminder ? 'Change' : 'Set'}
              onPress={() => {
                setReminderDraft(reminder ?? dueDate);
                setOpenSheet('reminder');
              }}
            />
          </View>
        </View>

        <Text style={[styles.subtitle, styles.componentTitle]}>Swipeable Row</Text>

        <Text style={styles.sectionHeader}>INBOX ({mails.filter((m) => m.unread).length} UNREAD)</Text>
        <View style={styles.swipeList}>
          {mails.length === 0 ? (
            <View style={styles.searchEmpty}>
              <FontAwesome name="inbox" size={28} color={COLORS.separator} />
              <Text style={styles.searchEmptyTitle}>Inbox Zero</Text>
              <DemoButton label="Restore emails" onPress={() => setMails(INITIAL_MAILS)} />
            </View>
          ) : (
            mails.map((mail, i) => (
              <Animated.View key={mail.id} exiting={FadeOut.duration(200)} layout={LinearTransition}>
                <SwipeableRow
                  id={mail.id}
                  openId={openMailId}
                  onOpenChange={setOpenMailId}
                  isLast={i === mails.length - 1}
                  fullSwipe
                  onPress={() => {
                    updateMail(mail.id, { unread: false });
                    showToast({ type: 'info', message: `Opened “${mail.subject}”` });
                  }}
                  leftActions={[
                    {
                      icon: mail.unread ? 'envelope-open-o' : 'envelope',
                      label: mail.unread ? 'Read' : 'Unread',
                      color: '#007AFF',
                      onPress: () => updateMail(mail.id, { unread: !mail.unread }),
                    },
                  ]}
                  rightActions={[
                    {
                      icon: 'flag',
                      label: mail.flagged ? 'Unflag' : 'Flag',
                      color: '#FF9500',
                      onPress: () => updateMail(mail.id, { flagged: !mail.flagged }),
                    },
                    { icon: 'trash', label: 'Delete', color: '#FF3B30', onPress: () => deleteMail(mail) },
                  ]}>
                  <View style={styles.mailUnreadDot}>
                    {mail.unread ? <View style={styles.mailUnreadDotInner} /> : null}
                  </View>
                  <View style={styles.rowText}>
                    <View style={styles.mailHeader}>
                      <Text style={[styles.rowLabel, styles.mailFrom]} numberOfLines={1}>
                        {mail.from}
                      </Text>
                      {mail.flagged ? <FontAwesome name="flag" size={12} color="#FF9500" /> : null}
                      <Text style={styles.rowDescription}>{mail.time}</Text>
                    </View>
                    <Text style={styles.mailSubject} numberOfLines={1}>
                      {mail.subject}
                    </Text>
                    <Text style={styles.rowDescription} numberOfLines={1}>
                      {mail.preview}
                    </Text>
                  </View>
                </SwipeableRow>
              </Animated.View>
            ))
          )}
        </View>
        <Text style={[styles.rowDescription, styles.fabHint]}>
          Swipe right to mark read/unread, swipe left for Flag and Delete. Swipe all the way left to delete in one
          move — then tap Undo on the toast.
        </Text>

        <Text style={[styles.subtitle, styles.componentTitle]}>Rating</Text>

        <Text style={styles.sectionHeader}>TAP OR DRAG</Text>
        <View style={[styles.card, styles.ratingCard]}>
          <Rating value={appRating} onChange={setAppRating} size={40} gap={10} />
          <Text style={[styles.rowLabel, styles.ratingCaption]}>{RATING_LABELS[appRating]}</Text>
          <View style={styles.buttonGroup}>
            <DemoButton
              label="Submit"
              onPress={() =>
                appRating === 0
                  ? showToast({ type: 'warning', message: 'Please choose a rating first' })
                  : showToast({ type: 'success', message: `Thanks for rating us ${appRating}★!` })
              }
            />
            <DemoButton label="Clear" selected={false} onPress={() => setAppRating(0)} />
          </View>
        </View>

        <Text style={styles.sectionHeader}>HALF STARS</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Rating value={halfRating} onChange={setHalfRating} allowHalf />
            </View>
            <Text style={styles.ratingValue}>{halfRating.toFixed(1)} / 5</Text>
          </View>
        </View>

        <Text style={styles.sectionHeader}>CUSTOM ICON & COLOR</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, styles.rowText]}>How much do you love it?</Text>
            <Rating value={heartRating} onChange={setHeartRating} icon="heart" color="#FF2D55" size={22} gap={4} />
          </View>
        </View>

        <Text style={styles.sectionHeader}>READ-ONLY SUMMARY</Text>
        <View style={[styles.card, styles.reviewSummary]}>
          <View style={styles.reviewAverage}>
            <Text style={styles.reviewAverageValue}>{REVIEW_AVERAGE.toFixed(1)}</Text>
            <Rating value={REVIEW_AVERAGE} size={14} gap={2} />
            <Text style={styles.rowDescription}>{REVIEW_TOTAL.toLocaleString('en-US')} ratings</Text>
          </View>
          <View style={styles.reviewBars}>
            {REVIEW_DISTRIBUTION.map((r) => (
              <View key={r.stars} style={styles.reviewBarRow}>
                <Text style={styles.reviewBarLabel}>{r.stars}</Text>
                <View style={styles.reviewBarTrack}>
                  <View style={[styles.reviewBarFill, { width: `${(r.count / REVIEW_TOTAL) * 100}%` }]} />
                </View>
              </View>
            ))}
          </View>
        </View>
        <Text style={[styles.subtitle, styles.componentTitle]}>Stepper / Wizard</Text>

        <Text style={styles.sectionHeader}>CREATE TASK WIZARD</Text>
        <View style={[styles.card, styles.wizardCard]}>
          <StepIndicator steps={WIZARD_STEPS} current={wizardStep} onStepPress={goToWizardStep} color="#F4693F" />

          <View style={styles.wizardBody}>
            <Animated.View
              key={wizardStep}
              entering={(wizardDirection.current === 1 ? SlideInRight : SlideInLeft).duration(250)}>
              {wizardStep === 0 ? (
                <>
                  <Text style={styles.wizardLabel}>Task title</Text>
                  <TextInput
                    value={taskTitle}
                    onChangeText={setTaskTitle}
                    placeholder="e.g. Prepare sprint demo"
                    placeholderTextColor={COLORS.secondaryText}
                    style={styles.wizardInput}
                  />
                  <Text style={styles.wizardLabel}>Priority</Text>
                  <SegmentedControl segments={PRIORITIES} selectedIndex={taskPriority} onChange={setTaskPriority} />
                </>
              ) : wizardStep === 1 ? (
                <>
                  <Text style={styles.wizardLabel}>Due</Text>
                  <SegmentedControl segments={DUE_OPTIONS} selectedIndex={taskDue} onChange={setTaskDue} />
                  <View style={styles.wizardSwitchRow}>
                    <Text style={[styles.rowLabel, styles.rowText]}>Remind me</Text>
                    <IOSSwitch value={taskRemind} onValueChange={setTaskRemind} />
                  </View>
                </>
              ) : wizardStep === 2 ? (
                <>
                  <Text style={styles.wizardLabel}>Assign to (at least one)</Text>
                  {TEAM.map((name, i) => (
                    <CheckboxRow
                      key={name}
                      label={name}
                      value={taskAssignees.includes(name)}
                      activeColor="#F4693F"
                      onValueChange={() =>
                        setTaskAssignees((prev) =>
                          prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
                        )
                      }
                      isLast={i === TEAM.length - 1}
                    />
                  ))}
                </>
              ) : (
                <>
                  {[
                    { label: 'Title', value: taskTitle.trim(), step: 0 },
                    { label: 'Priority', value: PRIORITIES[taskPriority], step: 0 },
                    { label: 'Due', value: DUE_OPTIONS[taskDue], step: 1 },
                    { label: 'Reminder', value: taskRemind ? 'On' : 'Off', step: 1 },
                    { label: 'Assignees', value: taskAssignees.join(', '), step: 2 },
                  ].map((item, i, all) => (
                    <View key={item.label} style={[styles.row, i < all.length - 1 && styles.rowSeparator]}>
                      <Text style={[styles.rowDescription, styles.wizardReviewLabel]}>{item.label}</Text>
                      <Text style={[styles.rowLabel, styles.rowText]} numberOfLines={1}>
                        {item.value}
                      </Text>
                      <Pressable hitSlop={8} onPress={() => goToWizardStep(item.step)}>
                        <Text style={styles.wizardEdit}>Edit</Text>
                      </Pressable>
                    </View>
                  ))}
                </>
              )}
            </Animated.View>
          </View>

          <View style={styles.wizardFooter}>
            {wizardStep > 0 ? (
              <DemoButton label="Back" color="#F4693F" selected={false} onPress={() => goToWizardStep(wizardStep - 1)} />
            ) : (
              <View />
            )}
            <View style={!wizardStepValid && styles.disabled} pointerEvents={wizardStepValid ? 'auto' : 'none'}>
              <DemoButton
                label={isLastWizardStep ? 'Create Task' : 'Next'}
                color="#F4693F"
                onPress={() => (isLastWizardStep ? finishWizard() : goToWizardStep(wizardStep + 1))}
              />
            </View>
          </View>
        </View>

        <Text style={styles.sectionHeader}>VERTICAL (ORDER TRACKING)</Text>
        <View style={[styles.card, styles.wizardCard]}>
          <StepIndicator steps={ORDER_STEPS} current={orderStep} orientation="vertical" color="#34C759" />
          <View style={styles.buttonGroup}>
            <DemoButton
              label={orderStep >= ORDER_STEPS.length ? 'Reset' : 'Advance'}
              color="#34C759"
              onPress={() => setOrderStep((s) => (s >= ORDER_STEPS.length ? 0 : s + 1))}
            />
          </View>
        </View>
        <Text style={[styles.subtitle, styles.componentTitle]}>Accordion / Collapsible</Text>

        <Text style={styles.sectionHeader}>FAQ</Text>
        <View style={styles.card}>
          <SettingRow
            label="Allow multiple open"
            description={allowMultipleFaqs ? 'Any number of answers can be open' : 'Opening one closes the others'}
            value={allowMultipleFaqs}
            onValueChange={(v) => {
              setAllowMultipleFaqs(v);
              // Switching back to single mode keeps only the most recently opened item.
              if (!v) setOpenFaqs((prev) => prev.slice(-1));
            }}
          />
          {FAQS.map((faq, i) => (
            <AccordionItem
              key={faq.id}
              title={faq.question}
              expanded={openFaqs.includes(faq.id)}
              onToggle={() => toggleFaq(faq.id)}
              isLast={i === FAQS.length - 1}>
              <Text style={styles.accordionText}>{faq.answer}</Text>
            </AccordionItem>
          ))}
        </View>

        <Text style={styles.sectionHeader}>SETTINGS GROUPS (DYNAMIC CONTENT)</Text>
        <View style={styles.card}>
          <AccordionItem
            title="Notifications"
            subtitle={pushEnabled ? 'On' : 'Off'}
            icon="bell"
            iconColor="#FF3B30"
            expanded={openSettings.includes('notifications')}
            onToggle={() => toggleSetting('notifications')}>
            <SettingRow
              label="Push notifications"
              value={pushEnabled}
              onValueChange={setPushEnabled}
              isLast={!pushEnabled}
            />
            {/* These rows appear/disappear inside an open section — the section animates to the new height. */}
            {pushEnabled ? (
              <>
                <SettingRow label="Sound" value={pushSound} onValueChange={setPushSound} />
                <SettingRow label="Badges" value={pushBadges} onValueChange={setPushBadges} isLast />
              </>
            ) : null}
          </AccordionItem>
          <AccordionItem
            title="Privacy & Security"
            icon="lock"
            iconColor="#007AFF"
            expanded={openSettings.includes('privacy')}
            onToggle={() => toggleSetting('privacy')}>
            <SettingRow label="Share analytics" value={shareAnalytics} onValueChange={setShareAnalytics} />
            <SettingRow label="Face ID lock" value={faceIdLock} onValueChange={setFaceIdLock} isLast />
          </AccordionItem>
          <AccordionItem
            title="Storage"
            subtitle="3.2 GB of 5 GB used"
            icon="database"
            iconColor="#34C759"
            expanded={openSettings.includes('storage')}
            onToggle={() => toggleSetting('storage')}
            isLast>
            <View style={styles.storageBar}>
              <View style={[styles.storageSegment, { flex: 1.8, backgroundColor: '#007AFF' }]} />
              <View style={[styles.storageSegment, { flex: 0.9, backgroundColor: '#FF9500' }]} />
              <View style={[styles.storageSegment, { flex: 0.5, backgroundColor: '#AF52DE' }]} />
              <View style={[styles.storageSegment, { flex: 1.8, backgroundColor: '#E5E5EA' }]} />
            </View>
            <Text style={styles.accordionText}>Photos 1.8 GB · Documents 0.9 GB · Other 0.5 GB</Text>
          </AccordionItem>
        </View>

        <Text style={styles.sectionHeader}>READ MORE</Text>
        <View style={[styles.card, styles.readMoreCard]}>
          <Collapsible expanded={aboutExpanded} collapsedHeight={66}>
            <Text style={styles.accordionText}>{ABOUT_TEXT}</Text>
          </Collapsible>
          <Pressable hitSlop={8} onPress={() => setAboutExpanded((v) => !v)}>
            <Text style={styles.wizardEdit}>{aboutExpanded ? 'Show less' : 'Read more'}</Text>
          </Pressable>
        </View>
        <Text style={[styles.subtitle, styles.componentTitle]}>Tooltip</Text>

        <Text style={styles.sectionHeader}>PLACEMENT (AUTO-FLIPS AT SCREEN EDGES)</Text>
        <View style={styles.buttonGroup}>
          {(['top', 'bottom', 'left', 'right'] as const).map((placement) => (
            <View key={placement} ref={placementRefs[placement]} collapsable={false}>
              <DemoButton
                label={placement[0].toUpperCase() + placement.slice(1)}
                onPress={() =>
                  showTooltip(placementRefs[placement], {
                    text: `Requested “${placement}”. Tap anywhere to close.`,
                    placement,
                  })
                }
              />
            </View>
          ))}
        </View>

        <Text style={styles.sectionHeader}>INFO ICONS</Text>
        <View style={styles.card}>
          <View style={[styles.row, styles.rowSeparator]}>
            <Text style={styles.rowLabel}>Estimated time</Text>
            <Pressable
              ref={estimateInfoRef}
              accessibilityLabel="About estimated time"
              hitSlop={10}
              onPress={() =>
                showTooltip(estimateInfoRef, {
                  title: 'Estimated time',
                  text: 'How long you expect the task to take. Used to plan your day and warn you about overbooking.',
                })
              }
              style={styles.tooltipInfoIcon}>
              <FontAwesome name="info-circle" size={17} color="#007AFF" />
            </Pressable>
            <Text style={[styles.rowLabel, styles.tooltipRowValue]}>2h 30m</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Story points</Text>
            <Pressable
              ref={storyPointsInfoRef}
              accessibilityLabel="About story points"
              hitSlop={10}
              onPress={() =>
                showTooltip(storyPointsInfoRef, {
                  text: 'Relative effort on a 1–13 scale. Compare tasks with each other, not with hours.',
                  placement: 'bottom',
                })
              }
              style={styles.tooltipInfoIcon}>
              <FontAwesome name="info-circle" size={17} color="#007AFF" />
            </Pressable>
            <Text style={[styles.rowLabel, styles.tooltipRowValue]}>5</Text>
          </View>
        </View>

        <Text style={styles.sectionHeader}>TOOLBAR LABELS (LONG-PRESS / HOVER ON WEB)</Text>
        <View style={[styles.card, styles.tooltipToolbar]}>
          {TOOLBAR_ITEMS.map((item, i) => {
            const ref = { current: null } as React.RefObject<View | null>;
            const showLabel = () => {
              ref.current = toolbarRefs.current[i];
              showTooltip(ref, { text: item.label, placement: 'top', passive: true });
            };
            return (
              <Pressable
                key={item.icon}
                ref={(node) => {
                  toolbarRefs.current[i] = node;
                }}
                accessibilityLabel={item.label}
                onPress={() => showToast({ type: 'info', message: `${item.label} applied` })}
                onLongPress={showLabel}
                onHoverIn={showLabel}
                onHoverOut={hideTooltip}
                style={({ pressed }) => [styles.tooltipToolbarButton, pressed && styles.swipePressed]}>
                <FontAwesome name={item.icon} size={17} color={COLORS.text} />
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionHeader}>FEATURE TOUR (COACH MARKS)</Text>
        <View style={[styles.card, styles.tourCard]}>
          <View style={styles.tourHeader}>
            <Text style={[styles.calendarMonth, styles.rowText]}>My Tasks</Text>
            <Pressable ref={tourRefs[0]} accessibilityLabel="Search" style={styles.tourIcon}>
              <FontAwesome name="search" size={17} color={COLORS.text} />
            </Pressable>
            <Pressable ref={tourRefs[1]} accessibilityLabel="Filters" style={styles.tourIcon}>
              <FontAwesome name="sliders" size={18} color={COLORS.text} />
            </Pressable>
            <Pressable ref={tourRefs[2]} accessibilityLabel="New task" style={[styles.tourIcon, styles.tourAdd]}>
              <FontAwesome name="plus" size={15} color="#FFFFFF" />
            </Pressable>
          </View>
          <DemoButton label="Start tour" color="#F4693F" onPress={() => showTourStep(0)} />
        </View>
      </ScrollView>

      {showFab ? (
        <FloatingActionButton
          label="New Task"
          extended={fabExtended}
          actions={fabSpeedDial ? fabActions : undefined}
          onPress={() => showToast({ type: 'success', message: 'New task created' })}
        />
      ) : null}

      <BottomSheet visible={openSheet === 'actions'} onClose={closeSheet} snapPoints={[0.42]} title="Task Options">
        <View style={styles.card}>
          {SHEET_ACTIONS.map((action, i) => (
            <Pressable
              key={action.label}
              onPress={() => {
                closeSheet();
                showToast({
                  type: action.destructive ? 'error' : 'success',
                  message: action.destructive ? 'Task deleted' : `${action.label} — done`,
                });
              }}
              style={({ pressed }) => [
                styles.row,
                i < SHEET_ACTIONS.length - 1 && styles.rowSeparator,
                pressed && styles.demoButtonPressed,
              ]}>
              <FontAwesome
                name={action.icon}
                size={18}
                color={action.destructive ? TOAST_VARIANTS.error.color : '#007AFF'}
                style={styles.sheetActionIcon}
              />
              <Text style={[styles.rowLabel, action.destructive && { color: TOAST_VARIANTS.error.color }]}>
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </BottomSheet>

      <BottomSheet
        visible={openSheet === 'comments'}
        onClose={closeSheet}
        snapPoints={[0.45, 0.9]}
        title={`Comments (${COMMENTS.length})`}>
        <ScrollView contentContainerStyle={styles.sheetScroll}>
          {COMMENTS.map((comment) => (
            <View key={comment.author} style={styles.comment}>
              <View style={styles.commentAvatar}>
                <Text style={styles.commentAvatarText}>{comment.author[0]}</Text>
              </View>
              <View style={styles.rowText}>
                <Text style={styles.searchHighlight}>{comment.author}</Text>
                <Text style={styles.rowDescription}>{comment.text}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </BottomSheet>

      <BottomSheet visible={openSheet === 'filters'} onClose={closeSheet} snapPoints={[0.55]} title="Filters">
        <Text style={[styles.sectionHeader, styles.sheetSectionHeader]}>SORT BY</Text>
        <SegmentedControl segments={SORT_OPTIONS} selectedIndex={sortBy} onChange={setSortBy} />
        <Text style={styles.sectionHeader}>SHOW</Text>
        <View style={styles.card}>
          <SettingRow label="Completed tasks" value={showCompleted} onValueChange={setShowCompleted} />
          <SettingRow label="Only my tasks" value={onlyMine} onValueChange={setOnlyMine} isLast />
        </View>
        <Pressable
          onPress={() => {
            closeSheet();
            showToast({ type: 'success', message: `Sorted by ${SORT_OPTIONS[sortBy].toLowerCase()}` });
          }}
          style={({ pressed }) => [styles.sheetPrimaryButton, pressed && styles.demoButtonPressed]}>
          <Text style={styles.sheetPrimaryButtonLabel}>Apply Filters</Text>
        </Pressable>
      </BottomSheet>

      <BottomSheet visible={openSheet === 'reminder'} onClose={closeSheet} snapPoints={[0.88]} title="Set Reminder">
        <ScrollView contentContainerStyle={styles.sheetScroll}>
          <View style={styles.card}>
            <Calendar value={reminderDraft} onChange={setReminderDraft} minimumDate={new Date()} accentColor="#F4693F" />
          </View>
          <View style={[styles.card, styles.reminderTimeCard]}>
            <TimePicker value={reminderDraft} onChange={setReminderDraft} />
          </View>
          <Pressable
            onPress={() => {
              setReminder(reminderDraft);
              closeSheet();
              showToast({
                type: 'success',
                message: `Reminder set for ${formatDate(reminderDraft)}, ${formatTime(reminderDraft)}`,
              });
            }}
            style={({ pressed }) => [styles.sheetPrimaryButton, pressed && styles.demoButtonPressed]}>
            <Text style={styles.sheetPrimaryButtonLabel}>Done</Text>
          </Pressable>
        </ScrollView>
      </BottomSheet>

      <TooltipOverlay tooltip={tooltip} onDismiss={endTour} onNext={nextTourStep} />

      <Toast toast={toast} visible={toastVisible} onHide={hideToast} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    // Leave room so the FAB never covers the last row.
    paddingBottom: 120,
  },
  title: {
    fontFamily: 'BeVietnamPro_700Bold',
    fontSize: 28,
    color: COLORS.text,
  },
  subtitle: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 15,
    color: COLORS.secondaryText,
    marginTop: 4,
  },
  sectionHeader: {
    fontFamily: 'BeVietnamPro_500Medium',
    fontSize: 13,
    color: COLORS.secondaryText,
    marginTop: 28,
    marginBottom: 8,
    marginLeft: 16,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingLeft: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingVertical: 8,
    paddingRight: 16,
  },
  rowSeparator: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  rowText: {
    flex: 1,
    marginRight: 12,
  },
  rowLabel: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 17,
    color: COLORS.text,
  },
  rowDescription: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 13,
    color: COLORS.secondaryText,
    marginTop: 2,
  },
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    justifyContent: 'center',
  },
  thumb: {
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    marginLeft: THUMB_MARGIN,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  disabled: {
    opacity: 0.4,
  },
  componentTitle: {
    marginTop: 36,
    fontFamily: 'BeVietnamPro_600SemiBold',
    color: COLORS.text,
  },
  checkbox: {
    width: CHECKBOX_SIZE,
    height: CHECKBOX_SIZE,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    flex: 1,
    marginLeft: 12,
  },
  completedLabel: {
    color: COLORS.secondaryText,
    textDecorationLine: 'line-through',
  },
  nestedRow: {
    paddingLeft: 34,
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  demoButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  demoButtonPressed: {
    opacity: 0.7,
  },
  demoButtonLabel: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 14,
  },
  toastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    maxWidth: 420,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#1C1C1E',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  toastMessage: {
    flex: 1,
    fontFamily: 'BeVietnamPro_500Medium',
    fontSize: 15,
    color: '#FFFFFF',
  },
  toastAction: {
    fontFamily: 'BeVietnamPro_700Bold',
    fontSize: 15,
  },
  toastCountdown: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    height: 3,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 36,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#E3E3E8',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    padding: 0,
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 17,
    color: COLORS.text,
  },
  searchCancelContainer: {
    overflow: 'hidden',
    alignItems: 'flex-end',
  },
  searchCancel: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 17,
    color: '#007AFF',
  },
  searchHighlight: {
    fontFamily: 'BeVietnamPro_700Bold',
    color: COLORS.text,
  },
  searchResults: {
    marginTop: 12,
  },
  searchFlag: {
    fontSize: 26,
    marginRight: 12,
  },
  searchEmpty: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingRight: 16,
    gap: 6,
  },
  searchEmptyTitle: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 17,
    color: COLORS.text,
  },
  segmentedTrack: {
    flexDirection: 'row',
    height: 32,
    padding: SEGMENT_PADDING,
    borderRadius: 9,
    backgroundColor: '#E3E3E8',
  },
  segmentedThumb: {
    position: 'absolute',
    top: SEGMENT_PADDING,
    bottom: SEGMENT_PADDING,
    left: SEGMENT_PADDING,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  segmentLabel: {
    fontFamily: 'BeVietnamPro_500Medium',
    fontSize: 13,
  },
  segmentLabelSelected: {
    fontFamily: 'BeVietnamPro_600SemiBold',
  },
  segmentedContent: {
    marginTop: 12,
  },
  statCard: {
    paddingTop: 12,
  },
  segmentedStat: {
    fontFamily: 'BeVietnamPro_700Bold',
    fontSize: 34,
    color: COLORS.text,
    paddingBottom: 12,
  },
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tile: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 12,
  },
  tileListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  tileGridItem: {
    width: '31.5%',
    alignItems: 'center',
    gap: 8,
  },
  tileSwatch: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  fabHint: {
    marginTop: 8,
    marginHorizontal: 16,
  },
  fabBackdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    alignItems: 'flex-end',
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    // Keeps the icon centered when collapsed to a circle.
    paddingLeft: (FAB_SIZE - FAB_ICON_SIZE) / 2,
    backgroundColor: '#F4693F',
    overflow: 'hidden',
    shadowColor: '#F4693F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  fabPressed: {
    transform: [{ scale: 0.95 }],
  },
  fabIcon: {
    width: FAB_ICON_SIZE,
    height: FAB_ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabLabel: {
    marginLeft: 10,
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  speedDial: {
    alignItems: 'flex-end',
    gap: 14,
    marginBottom: 16,
    // Centers the mini buttons above the main FAB.
    marginRight: (FAB_SIZE - FAB_MINI_SIZE) / 2,
  },
  speedDialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  speedDialLabel: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.card,
  },
  speedDialLabelText: {
    fontFamily: 'BeVietnamPro_500Medium',
    fontSize: 14,
    color: COLORS.text,
  },
  speedDialButton: {
    width: FAB_MINI_SIZE,
    height: FAB_MINI_SIZE,
    borderRadius: FAB_MINI_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    // Extra height below the screen edge (see paddingBottom) hides the gap while rubber-banding upward.
    bottom: '-10%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: COLORS.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 16,
  },
  sheetHeader: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 12,
  },
  sheetHandle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#C7C7CC',
    marginBottom: 10,
  },
  sheetTitle: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 17,
    color: COLORS.text,
  },
  sheetBody: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sheetActionIcon: {
    width: 28,
    marginRight: 8,
  },
  sheetScroll: {
    paddingBottom: 24,
  },
  sheetSectionHeader: {
    marginTop: 4,
  },
  sheetPrimaryButton: {
    marginTop: 24,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4693F',
  },
  sheetPrimaryButtonLabel: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 17,
    color: '#FFFFFF',
  },
  comment: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
  },
  commentAvatarText: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  pickerPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#E3E3E8',
  },
  pickerPillText: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 16,
    color: COLORS.text,
  },
  pickerPillTextActive: {
    color: '#007AFF',
  },
  calendar: {
    paddingVertical: 12,
    paddingRight: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calendarMonth: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 17,
    color: COLORS.text,
  },
  calendarNav: {
    flexDirection: 'row',
    gap: 24,
    paddingRight: 4,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: `${100 / 7}%`,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarWeekday: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 12,
    color: COLORS.secondaryText,
    textAlign: 'center',
    lineHeight: 40,
  },
  calendarDay: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayText: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 17,
    color: COLORS.text,
  },
  calendarDayTextSelected: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    color: '#FFFFFF',
  },
  calendarDayTextDisabled: {
    color: COLORS.separator,
  },
  timePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: WHEEL_ITEM_HEIGHT * WHEEL_VISIBLE_ITEMS,
    marginVertical: 8,
    paddingRight: 16,
  },
  wheelHighlight: {
    position: 'absolute',
    left: 8,
    right: 24,
    top: WHEEL_PADDING,
    height: WHEEL_ITEM_HEIGHT,
    borderRadius: 8,
    backgroundColor: '#EFEFF4',
  },
  wheel: {
    height: WHEEL_ITEM_HEIGHT * WHEEL_VISIBLE_ITEMS,
  },
  wheelContent: {
    paddingVertical: WHEEL_PADDING,
  },
  wheelItem: {
    height: WHEEL_ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelItemText: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 21,
    color: COLORS.text,
  },
  timeSeparator: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 21,
    color: COLORS.text,
  },
  reminderTimeCard: {
    marginTop: 12,
  },
  swipeList: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    overflow: 'hidden',
  },
  swipeRow: {
    overflow: 'hidden',
  },
  swipeActionsLeft: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  swipeActionsRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  swipeAction: {
    width: SWIPE_ACTION_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  swipeActionLabel: {
    fontFamily: 'BeVietnamPro_500Medium',
    fontSize: 13,
    color: '#FFFFFF',
  },
  swipeContent: {
    backgroundColor: COLORS.card,
  },
  swipeContentInner: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingRight: 16,
  },
  swipePressed: {
    backgroundColor: '#E5E5EA',
  },
  mailUnreadDot: {
    width: 28,
    paddingTop: 7,
    alignItems: 'center',
  },
  mailUnreadDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  mailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mailFrom: {
    flex: 1,
    fontFamily: 'BeVietnamPro_600SemiBold',
  },
  mailSubject: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 15,
    color: COLORS.text,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  ratingCard: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingRight: 16,
    gap: 12,
  },
  ratingCaption: {
    color: COLORS.secondaryText,
  },
  ratingValue: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 15,
    color: COLORS.text,
  },
  reviewSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingVertical: 16,
    paddingRight: 16,
  },
  reviewAverage: {
    alignItems: 'center',
    gap: 4,
  },
  reviewAverageValue: {
    fontFamily: 'BeVietnamPro_700Bold',
    fontSize: 44,
    lineHeight: 50,
    color: COLORS.text,
  },
  reviewBars: {
    flex: 1,
    gap: 6,
  },
  reviewBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewBarLabel: {
    width: 10,
    fontFamily: 'BeVietnamPro_500Medium',
    fontSize: 12,
    color: COLORS.secondaryText,
  },
  reviewBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E5EA',
    overflow: 'hidden',
  },
  reviewBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#8E8E93',
  },
  flex1: {
    flex: 1,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.separator,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 13,
    color: COLORS.secondaryText,
  },
  stepConnector: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E5EA',
  },
  stepConnectorVertical: {
    flex: 1,
    width: 2,
    minHeight: 20,
    marginVertical: 4,
    backgroundColor: '#E5E5EA',
  },
  stepConnectorFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  stepHorizontal: {
    flexDirection: 'row',
  },
  stepHorizontalItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  stepHorizontalTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  stepLabel: {
    fontFamily: 'BeVietnamPro_500Medium',
    fontSize: 12,
    color: COLORS.text,
  },
  stepLabelUpcoming: {
    color: COLORS.secondaryText,
  },
  stepVertical: {
    flexDirection: 'row',
    gap: 12,
  },
  stepVerticalRail: {
    alignItems: 'center',
  },
  stepVerticalBody: {
    paddingBottom: 20,
  },
  wizardCard: {
    paddingVertical: 16,
    paddingRight: 16,
    gap: 16,
  },
  wizardBody: {
    minHeight: 190,
    overflow: 'hidden',
  },
  wizardLabel: {
    fontFamily: 'BeVietnamPro_500Medium',
    fontSize: 13,
    color: COLORS.secondaryText,
    marginBottom: 8,
    marginTop: 4,
  },
  wizardInput: {
    height: 44,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 16,
    color: COLORS.text,
  },
  wizardSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  wizardReviewLabel: {
    width: 80,
    marginTop: 0,
  },
  wizardEdit: {
    fontFamily: 'BeVietnamPro_500Medium',
    fontSize: 15,
    color: '#F4693F',
  },
  wizardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  collapsible: {
    overflow: 'hidden',
  },
  collapsibleContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  accordionIcon: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  accordionTitleExpanded: {
    fontFamily: 'BeVietnamPro_600SemiBold',
  },
  accordionBody: {
    paddingBottom: 12,
  },
  accordionText: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: '#3C3C43',
    paddingRight: 16,
  },
  storageBar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
    marginRight: 16,
    gap: 2,
  },
  storageSegment: {
    height: '100%',
  },
  readMoreCard: {
    paddingVertical: 14,
    gap: 8,
  },
  tooltip: {
    position: 'absolute',
    maxWidth: 260,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#1C1C1E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  tooltipMeasuring: {
    // Off-screen and invisible until its size is known and it can be positioned.
    left: -1000,
    top: -1000,
    opacity: 0,
  },
  tooltipArrow: {
    position: 'absolute',
    width: TOOLTIP_ARROW * 2,
    height: TOOLTIP_ARROW * 2,
    backgroundColor: '#1C1C1E',
    transform: [{ rotate: '45deg' }],
  },
  tooltipTitle: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  tooltipText: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#EBEBF5',
  },
  tooltipFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 16,
  },
  tooltipStep: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 13,
    color: '#8E8E93',
  },
  tooltipButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  tooltipSkip: {
    fontFamily: 'BeVietnamPro_500Medium',
    fontSize: 14,
    color: '#8E8E93',
  },
  tooltipNext: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F4693F',
  },
  tooltipNextLabel: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  tooltipInfoIcon: {
    marginLeft: 6,
  },
  tooltipRowValue: {
    flex: 1,
    textAlign: 'right',
    color: COLORS.secondaryText,
  },
  tooltipToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingRight: 16,
  },
  tooltipToolbarButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotlightDim: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  spotlightRing: {
    position: 'absolute',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  tourCard: {
    paddingVertical: 14,
    paddingRight: 16,
    gap: 14,
    alignItems: 'flex-start',
  },
  tourHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: 8,
  },
  tourIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
  },
  tourAdd: {
    backgroundColor: '#F4693F',
  },
});
