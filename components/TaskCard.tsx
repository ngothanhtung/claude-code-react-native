import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Task } from '@/constants/Tasks';

const COLORS = {
  card: '#FFFFFF',
  dark: '#151A2E',
  gray: '#8891A5',
  grayLight: '#C7CBD6',
  green: '#1FA97D',
};

export default function TaskCard({
  task,
  onToggle,
  onPress,
}: {
  task: Task;
  onToggle: (id: string) => void;
  onPress?: (task: Task) => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.taskCard, pressed && onPress && styles.taskCardPressed]}
      onPress={onPress ? () => onPress(task) : undefined}
      disabled={!onPress}>
      <Pressable
        style={[styles.checkbox, task.done && styles.checkboxDone]}
        onPress={() => onToggle(task.id)}
        hitSlop={8}>
        {task.done && <Ionicons name="checkmark" size={16} color="#fff" />}
      </Pressable>

      <View style={styles.taskBody}>
        <Text
          style={[styles.taskTitle, task.done && styles.taskTitleDone]}
          numberOfLines={1}>
          {task.title}
        </Text>
        <View style={styles.taskMetaRow}>
          <View style={[styles.dot, { backgroundColor: task.dotColor }]} />
          <Text style={styles.taskMetaText}>{task.project}</Text>
          <Text
            style={[
              styles.taskMetaText,
              styles.taskMetaSeparated,
              task.timeColor ? { color: task.timeColor, fontWeight: '600' } : null,
            ]}>
            {task.time}
          </Text>
          {task.count ? (
            <Text style={[styles.taskMetaText, styles.taskMetaSeparated]}>{task.count}</Text>
          ) : null}
        </View>
      </View>

      <View style={[styles.avatar, { backgroundColor: task.avatarColor }]}>
        <Text style={styles.avatarText}>{task.avatarInitials}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
  },
  taskCardPressed: {
    opacity: 0.7,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: COLORS.grayLight,
    marginRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  taskBody: {
    flex: 1,
    marginRight: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 6,
  },
  taskTitleDone: {
    color: COLORS.grayLight,
    textDecorationLine: 'line-through',
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  taskMetaText: {
    fontSize: 13,
    color: COLORS.gray,
  },
  taskMetaSeparated: {
    marginLeft: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
});
