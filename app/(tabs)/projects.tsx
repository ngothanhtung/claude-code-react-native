import { Ionicons } from '@expo/vector-icons';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { PurpleTheme } from '@/constants/Purple';

const COLORS = {
  bg: '#F3F4F8',
  card: '#FFFFFF',
  dark: '#151A2E',
  gray: '#8891A5',
  primary: PurpleTheme.primary,
  track: '#EEF0F5',
};

type Project = {
  id: string;
  name: string;
  dotColor: string;
  barColor: string;
  done: number;
  total: number;
  due: string;
  members: { initials: string; color: string }[];
};

const PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Mobile app v2',
    dotColor: COLORS.primary,
    barColor: COLORS.primary,
    done: 6,
    total: 14,
    due: 'Ships 3 Sep',
    members: [
      { initials: 'AM', color: COLORS.primary },
      { initials: 'JC', color: '#1FA97D' },
      { initials: 'RK', color: '#D9552F' },
    ],
  },
  {
    id: '2',
    name: 'Brand refresh',
    dotColor: '#1FA97D',
    barColor: '#1FA97D',
    done: 7,
    total: 9,
    due: 'Review Thu',
    members: [
      { initials: 'TP', color: '#2F8FE0' },
      { initials: 'AM', color: COLORS.primary },
    ],
  },
  {
    id: '3',
    name: 'Q3 planning',
    dotColor: '#D9552F',
    barColor: '#D9552F',
    done: 1,
    total: 6,
    due: 'Draft due Fri',
    members: [
      { initials: 'AM', color: COLORS.primary },
      { initials: 'SB', color: COLORS.primary },
    ],
  },
  {
    id: '4',
    name: 'Ops & admin',
    dotColor: '#3B82F6',
    barColor: '#3B82F6',
    done: 8,
    total: 11,
    due: 'Recurring',
    members: [{ initials: 'SB', color: COLORS.primary }],
  },
];

function ProjectCard({ project }: { project: Project }) {
  const progress = project.done / project.total;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.dot, { backgroundColor: project.dotColor }]} />
        <Text style={styles.cardTitle}>{project.name}</Text>
        <Text style={styles.cardCount}>
          {project.done}/{project.total}
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress * 100}%`, backgroundColor: project.barColor },
          ]}
        />
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.avatarRow}>
          {project.members.map((member, index) => (
            <View
              key={member.initials + index}
              style={[
                styles.avatar,
                { backgroundColor: member.color, marginLeft: index === 0 ? 0 : -10 },
              ]}>
              <Text style={styles.avatarText}>{member.initials}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.dueText}>{project.due}</Text>
      </View>
    </View>
  );
}

export default function ProjectsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Projects</Text>
        <Pressable hitSlop={8}>
          <Text style={styles.teamLink}>Team</Text>
        </Pressable>
      </View>

      <FlatList
        data={PROJECTS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <ProjectCard project={item} />}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.dark,
  },
  teamLink: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    marginRight: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
  },
  cardCount: {
    fontSize: 15,
    color: COLORS.gray,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.track,
    marginBottom: 14,
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarRow: {
    flexDirection: 'row',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  dueText: {
    fontSize: 14,
    color: COLORS.gray,
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
