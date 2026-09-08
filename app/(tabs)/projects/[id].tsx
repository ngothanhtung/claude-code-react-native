import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PROJECTS } from '@/constants/Projects';
import { PurpleTheme } from '@/constants/Purple';

const COLORS = {
  bg: '#F3F4F8',
  card: '#FFFFFF',
  dark: '#151A2E',
  gray: '#8891A5',
  primary: PurpleTheme.primary,
  track: '#EEF0F5',
};

export default function ProjectDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const project = PROJECTS.find((item) => item.id === id);

  if (!project) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color={COLORS.dark} />
          </Pressable>
        </View>
        <Text style={styles.notFoundText}>Project not found.</Text>
      </SafeAreaView>
    );
  }

  const progress = project.done / project.total;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={COLORS.dark} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {project.name}
        </Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
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

          <Text style={styles.dueText}>{project.due}</Text>
        </View>

        <Text style={styles.sectionLabel}>ABOUT</Text>
        <View style={styles.card}>
          <Text style={styles.descriptionText}>{project.description}</Text>
        </View>

        <Text style={styles.sectionLabel}>MEMBERS</Text>
        <View style={styles.card}>
          {project.members.map((member, index) => (
            <View
              key={member.initials + index}
              style={[styles.memberRow, index !== 0 && styles.memberRowDivider]}>
              <View style={[styles.avatar, { backgroundColor: member.color }]}>
                <Text style={styles.avatarText}>{member.initials}</Text>
              </View>
              <Text style={styles.memberName}>{member.initials}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  notFoundText: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 40,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: COLORS.gray,
    marginTop: 20,
    marginBottom: 8,
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
    marginBottom: 10,
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  dueText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.dark,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  memberRowDivider: {
    borderTopWidth: 1,
    borderTopColor: COLORS.track,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.dark,
  },
});
