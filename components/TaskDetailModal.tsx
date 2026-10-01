import { Ionicons } from '@expo/vector-icons';
import { Alert, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Task } from '@/constants/Tasks';
import { PurpleTheme } from '@/constants/Purple';

const COLORS = {
  bg: '#F3F4F8',
  card: '#FFFFFF',
  dark: '#151A2E',
  gray: '#8891A5',
  grayLight: '#C7CBD6',
  green: '#1FA97D',
  greenSoft: '#E3F6EF',
  primary: PurpleTheme.primary,
  primarySoft: PurpleTheme.primaryMist,
};

const DUE_LABELS: Record<Task['dueCategory'], string> = {
  today: 'Today',
  overdue: 'Overdue',
  tomorrow: 'Tomorrow',
};

export default function TaskDetailModal({
  task,
  onClose,
  onToggle,
}: {
  task: Task | null;
  onClose: () => void;
  onToggle: (id: string) => void;
}) {
  function handleActionPress() {
    if (!task) return;
    if (task.done) {
      onToggle(task.id);
      return;
    }

    const message = `Mark "${task.title}" as complete?`;
    // Alert.alert is a no-op on react-native-web, so fall back to the browser's confirm dialog.
    if (Platform.OS === 'web') {
      if (window.confirm(message)) onToggle(task.id);
      return;
    }
    Alert.alert('Complete task', message, [
      { text: 'No', style: 'cancel' },
      { text: 'Yes', onPress: () => onToggle(task.id) },
    ]);
  }

  return (
    <Modal visible={task !== null} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        {task && (
          <SafeAreaView style={styles.sheet} edges={['bottom']}>
            <View style={styles.handle} />

            <View style={styles.headerRow}>
              <View style={[styles.statusBadge, task.done && styles.statusBadgeDone]}>
                <Ionicons
                  name={task.done ? 'checkmark-circle' : 'ellipse-outline'}
                  size={14}
                  color={task.done ? COLORS.green : COLORS.primary}
                />
                <Text style={[styles.statusText, task.done && styles.statusTextDone]}>
                  {task.done ? 'Completed' : 'In progress'}
                </Text>
              </View>
              <Pressable style={styles.closeButton} onPress={onClose} hitSlop={8}>
                <Ionicons name="close" size={20} color={COLORS.dark} />
              </Pressable>
            </View>

            <Text style={[styles.title, task.done && styles.titleDone]}>{task.title}</Text>

            <View style={styles.details}>
              <DetailRow icon="folder-outline" label="Project">
                <View style={styles.inlineRow}>
                  <View style={[styles.dot, { backgroundColor: task.dotColor }]} />
                  <Text style={styles.detailValue}>{task.project}</Text>
                </View>
              </DetailRow>

              <DetailRow icon="calendar-outline" label="Due">
                <Text
                  style={[
                    styles.detailValue,
                    task.timeColor ? { color: task.timeColor } : null,
                  ]}>
                  {task.time === DUE_LABELS[task.dueCategory]
                    ? task.time
                    : `${DUE_LABELS[task.dueCategory]} · ${task.time}`}
                </Text>
              </DetailRow>

              {task.count ? (
                <DetailRow icon="list-outline" label="Subtasks">
                  <Text style={styles.detailValue}>{task.count} done</Text>
                </DetailRow>
              ) : null}

              <DetailRow icon="person-outline" label="Assignee">
                <View style={[styles.avatar, { backgroundColor: task.avatarColor }]}>
                  <Text style={styles.avatarText}>{task.avatarInitials}</Text>
                </View>
              </DetailRow>
            </View>

            <Pressable
              style={[styles.actionButton, task.done && styles.actionButtonSecondary]}
              onPress={handleActionPress}>
              <Ionicons
                name={task.done ? 'arrow-undo-outline' : 'checkmark'}
                size={18}
                color={task.done ? COLORS.primary : '#fff'}
              />
              <Text style={[styles.actionText, task.done && styles.actionTextSecondary]}>
                {task.done ? 'Mark as not done' : 'Mark as complete'}
              </Text>
            </Pressable>
          </SafeAreaView>
        )}
      </View>
    </Modal>
  );
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailLabelWrap}>
        <Ionicons name={icon} size={18} color={COLORS.gray} />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(21, 26, 46, 0.4)',
  },
  sheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.grayLight,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: COLORS.primarySoft,
  },
  statusBadgeDone: {
    backgroundColor: COLORS.greenSoft,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statusTextDone: {
    color: COLORS.green,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.dark,
    marginBottom: 20,
  },
  titleDone: {
    color: COLORS.gray,
    textDecorationLine: 'line-through',
  },
  details: {
    backgroundColor: COLORS.bg,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  detailLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
  },
  actionButtonSecondary: {
    backgroundColor: COLORS.primarySoft,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  actionTextSecondary: {
    color: COLORS.primary,
  },
});
