import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SideMenu from '@/components/SideMenu';
import TaskCard from '@/components/TaskCard';
import { useTasks } from '@/components/TasksProvider';
import { Task } from '@/constants/Tasks';
import { PurpleTheme } from '@/constants/Purple';

const COLORS = {
  bg: '#F3F4F8',
  card: '#FFFFFF',
  dark: '#151A2E',
  gray: '#8891A5',
  primary: PurpleTheme.primary,
};

export default function TaskListScreen({
  title,
  subtitle,
  filter,
  emptyText,
}: {
  title: string;
  subtitle: string;
  filter: (task: Task) => boolean;
  emptyText: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { tasks, toggleTask } = useTasks();
  const filteredTasks = tasks.filter(filter);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.menuButton} onPress={() => setMenuOpen(true)} hitSlop={8}>
            <Ionicons name="menu" size={24} color={COLORS.dark} />
          </Pressable>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>{title}</Text>
            <Text style={styles.headerSubtitle}>{subtitle}</Text>
          </View>
        </View>

        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => <TaskCard task={item} onToggle={toggleTask} />}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListEmptyComponent={<Text style={styles.emptyText}>{emptyText}</Text>}
        />
      </SafeAreaView>

      <SideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 16,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.dark,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 40,
  },
});
