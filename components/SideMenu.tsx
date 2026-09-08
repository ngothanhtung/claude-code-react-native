import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTasks } from '@/components/TasksProvider';
import { PurpleTheme } from '@/constants/Purple';

const COLORS = {
  bg: '#F3F4F8',
  card: '#FFFFFF',
  dark: '#151A2E',
  gray: '#8891A5',
  primary: PurpleTheme.primary,
  primarySoft: PurpleTheme.primarySoft,
};

const PANEL_WIDTH = Math.min(280, Dimensions.get('window').width * 0.8);

const MENU_ITEMS: { path: '/home/today' | '/home/overdue' | '/home/completed' | '/home/pending'; key: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { path: '/home/today', key: 'today', label: 'Today tasks', icon: 'calendar-outline' },
  { path: '/home/overdue', key: 'overdue', label: 'Overdue tasks', icon: 'alert-circle-outline' },
  { path: '/home/completed', key: 'completed', label: 'Completed tasks', icon: 'checkmark-circle-outline' },
  { path: '/home/pending', key: 'pending', label: 'Pending tasks', icon: 'time-outline' },
];

export default function SideMenu({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const translateX = useRef(new Animated.Value(-PANEL_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const pathname = usePathname();
  const { tasks } = useTasks();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: visible ? 0 : -PANEL_WIDTH,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: visible ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, translateX, backdropOpacity]);

  const counts: Record<string, number> = {
    today: tasks.filter((task) => task.dueCategory === 'today').length,
    overdue: tasks.filter((task) => task.dueCategory === 'overdue' && !task.done).length,
    completed: tasks.filter((task) => task.done).length,
    pending: tasks.filter((task) => !task.done).length,
  };

  return (
    <>
      <Animated.View
        style={[styles.backdrop, { opacity: backdropOpacity }]}
        pointerEvents={visible ? 'auto' : 'none'}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[styles.panel, { width: PANEL_WIDTH, transform: [{ translateX }] }]}
        pointerEvents={visible ? 'auto' : 'none'}>
        <SafeAreaView style={styles.panelInner} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <Text style={styles.title}>Tasks</Text>
            <Text style={styles.subtitle}>Browse your agenda</Text>
          </View>

          <View style={styles.list}>
            {MENU_ITEMS.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Pressable
                  key={item.key}
                  style={[styles.item, isActive && styles.itemActive]}
                  onPress={() => {
                    onClose();
                    router.replace(item.path);
                  }}>
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={isActive ? COLORS.primary : COLORS.gray}
                    style={styles.itemIcon}
                  />
                  <Text style={[styles.itemLabel, isActive && styles.itemLabelActive]}>
                    {item.label}
                  </Text>
                  <View style={[styles.countBadge, isActive && styles.countBadgeActive]}>
                    <Text style={[styles.countText, isActive && styles.countTextActive]}>
                      {counts[item.key]}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </SafeAreaView>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(21, 26, 46, 0.4)',
    zIndex: 10,
  },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: COLORS.card,
    zIndex: 11,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 4, height: 0 },
    elevation: 12,
  },
  panelInner: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.dark,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 2,
  },
  list: {
    paddingHorizontal: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  itemActive: {
    backgroundColor: COLORS.primarySoft,
  },
  itemIcon: {
    marginRight: 14,
  },
  itemLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.dark,
  },
  itemLabelActive: {
    color: COLORS.primary,
  },
  countBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 6,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeActive: {
    backgroundColor: '#FFFFFF',
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray,
  },
  countTextActive: {
    color: COLORS.primary,
  },
});
