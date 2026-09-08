import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PROJECTS, Project } from '@/constants/Projects';
import { PurpleTheme } from '@/constants/Purple';

const COLORS = {
  bg: '#F3F4F8',
  card: '#FFFFFF',
  dark: '#151A2E',
  gray: '#8891A5',
  primary: PurpleTheme.primary,
  track: '#EEF0F5',
};

function ProjectCard({ project, onPress }: { project: Project; onPress: () => void }) {
  const progress = project.done / project.total;

  return (
    <Pressable style={styles.card} onPress={onPress}>
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
    </Pressable>
  );
}

export default function ProjectsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
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
          renderItem={({ item }) => (
            <ProjectCard project={item} onPress={() => router.push(`/projects/${item.id}`)} />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      </SafeAreaView>

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
  safeArea: {
    flex: 1,
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
