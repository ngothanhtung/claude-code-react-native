import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { PurpleTheme } from '@/constants/Purple';

const COLORS = {
  bg: '#F3F4F8',
  card: '#FFFFFF',
  dark: '#151A2E',
  gray: '#8891A5',
  grayLight: '#C7CBD6',
  ringTrack: PurpleTheme.primaryMist,
  primary: PurpleTheme.primary,
  green: '#1FA97D',
  red: '#E0483E',
};

type Task = {
  id: string;
  title: string;
  project: string;
  dotColor: string;
  meta: string;
  metaColor?: string;
  count?: string;
  avatarInitials: string;
  avatarColor: string;
  done?: boolean;
};

const TASKS: Task[] = [
  {
    id: '1',
    title: 'Review the onboarding flow copy',
    project: 'Mobile app v2',
    dotColor: COLORS.primary,
    meta: '9:00',
    count: '1/3',
    avatarInitials: 'AM',
    avatarColor: COLORS.primary,
  },
  {
    id: '2',
    title: 'Ship the empty-state illustrations',
    project: 'Brand refresh',
    dotColor: COLORS.green,
    meta: 'Overdue',
    metaColor: COLORS.red,
    count: '1/2',
    avatarInitials: 'TP',
    avatarColor: '#2F8FE0',
  },
  {
    id: '3',
    title: 'Write Q3 hiring brief',
    project: 'Q3 planning',
    dotColor: '#F4693F',
    meta: 'Today',
    metaColor: COLORS.primary,
    avatarInitials: 'AM',
    avatarColor: COLORS.primary,
  },
  {
    id: '4',
    title: 'Unblock Rina on the API contract',
    project: 'Mobile app v2',
    dotColor: COLORS.primary,
    meta: '14:30',
    count: '0/1',
    avatarInitials: 'RK',
    avatarColor: '#D9552F',
  },
  {
    id: '5',
    title: 'Approve the August invoices',
    project: 'Ops & admin',
    dotColor: '#3B82F6',
    meta: 'Today',
    metaColor: COLORS.primary,
    avatarInitials: 'SB',
    avatarColor: COLORS.primary,
    done: true,
  },
  {
    id: '6',
    title: 'Standup notes to the channel',
    project: 'Ops & admin',
    dotColor: '#3B82F6',
    meta: '17:00',
    avatarInitials: 'AM',
    avatarColor: COLORS.primary,
  },
  {
    id: '7',
    title: 'Wire the offline sync queue',
    project: 'Mobile app v2',
    dotColor: COLORS.primary,
    meta: 'Tomorrow',
    count: '1/2',
    avatarInitials: 'JC',
    avatarColor: COLORS.green,
  },
  {
    id: '8',
    title: 'Review the auth pull request',
    project: 'Mobile app v2',
    dotColor: COLORS.primary,
    meta: 'Tomorrow',
    avatarInitials: 'JC',
    avatarColor: COLORS.green,
  },
];

function ProgressRing({
  progress,
  size = 64,
  strokeWidth = 6,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <View style={{ width: size, height: size }}>
      <View style={{ transform: [{ rotate: '-90deg' }] }}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={COLORS.ringTrack}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={COLORS.primary}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - progress)}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </View>
      <View style={styles.ringLabelWrap}>
        <Text style={styles.ringLabel}>{Math.round(progress * 100)}%</Text>
      </View>
    </View>
  );
}

function TaskRow({ task, onToggle }: { task: Task; onToggle: (id: string) => void }) {
  return (
    <View style={styles.taskCard}>
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
              task.metaColor ? { color: task.metaColor, fontWeight: '600' } : null,
            ]}>
            {task.meta}
          </Text>
          {task.count ? (
            <Text style={[styles.taskMetaText, styles.taskMetaSeparated]}>{task.count}</Text>
          ) : null}
        </View>
      </View>

      <View style={[styles.avatar, { backgroundColor: task.avatarColor }]}>
        <Text style={styles.avatarText}>{task.avatarInitials}</Text>
      </View>
    </View>
  );
}

export default function TodayScreen() {
  const [tasks, setTasks] = useState(TASKS);

  const doneCount = tasks.filter((task) => task.done).length;
  const nextUp = tasks.find((task) => !task.done);

  function toggleTask(id: string) {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, done: !task.done } : task))
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.dateLabel}>MONDAY, 24 AUGUST</Text>
          <Text style={styles.headerTitle}>Today</Text>
        </View>
        <Pressable style={styles.searchButton} hitSlop={8}>
          <Ionicons name="search" size={20} color={COLORS.dark} />
        </Pressable>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.progressCard}>
            <ProgressRing progress={doneCount / tasks.length} />
            <View style={styles.progressBody}>
              <Text style={styles.progressTitle}>
                {doneCount} of {tasks.length} done
              </Text>
              <Text style={styles.progressSubtitle} numberOfLines={2}>
                Next up: {nextUp ? nextUp.title : 'All done!'}
              </Text>
            </View>
            <View style={styles.progressDivider} />
            <View style={styles.progressDays}>
              <Text style={styles.progressDaysNumber}>12</Text>
              <Text style={styles.progressDaysLabel}>DAYS</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => <TaskRow task={item} onToggle={toggleTask} />}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />

      <Pressable style={styles.fab} hitSlop={8}>
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: COLORS.gray,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.dark,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  ringLabelWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.dark,
  },
  progressBody: {
    flex: 1,
    marginLeft: 14,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 2,
  },
  progressSubtitle: {
    fontSize: 13,
    color: COLORS.gray,
  },
  progressDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#EEF0F5',
    marginHorizontal: 12,
  },
  progressDays: {
    alignItems: 'center',
  },
  progressDaysNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.green,
  },
  progressDaysLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.gray,
    letterSpacing: 0.5,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});
