import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { PurpleTheme } from '@/constants/Purple';

const COLORS = {
  bg: '#F3F4F8',
  card: '#FFFFFF',
  dark: '#151A2E',
  gray: '#8891A5',
  primary: PurpleTheme.primary,
  pillBg: '#F0F1F5',
  pillActiveBg: PurpleTheme.primarySoft,
};

type InboxItem = {
  id: string;
  title: string;
  captured: string;
  source: string;
};

const INBOX_ITEMS: InboxItem[] = [
  {
    id: '1',
    title: 'Ask Jo about the motion spec',
    captured: 'Captured 8:12',
    source: 'voice note',
  },
  {
    id: '2',
    title: 'Look into the duplicate-task bug on Android',
    captured: 'Captured yesterday',
    source: 'shared from Slack',
  },
  {
    id: '3',
    title: 'Book the offsite room for September',
    captured: 'Captured yesterday',
    source: '',
  },
];

function InboxRow({ item, onResolve }: { item: InboxItem; onResolve: (id: string) => void }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.cardMeta}>
        {item.captured}
        {item.source ? ` · ${item.source}` : ''}
      </Text>

      <View style={styles.pillRow}>
        <Pressable
          style={[styles.pill, styles.pillActive]}
          onPress={() => onResolve(item.id)}>
          <Text style={[styles.pillText, styles.pillTextActive]}>Today</Text>
        </Pressable>
        <Pressable style={styles.pill} onPress={() => onResolve(item.id)}>
          <Text style={styles.pillText}>Project</Text>
        </Pressable>
        <Pressable style={styles.pill} onPress={() => onResolve(item.id)}>
          <Text style={styles.pillText}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function InboxScreen() {
  const [items, setItems] = useState(INBOX_ITEMS);

  function resolveItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inbox</Text>
        <Text style={styles.headerSubtitle}>
          {items.length} captured, unsorted
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <InboxRow item={item} onResolve={resolveItem} />}
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.dark,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: COLORS.gray,
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
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 6,
  },
  cardMeta: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 14,
  },
  pillRow: {
    flexDirection: 'row',
  },
  pill: {
    backgroundColor: COLORS.pillBg,
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  pillActive: {
    backgroundColor: COLORS.pillActiveBg,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray,
  },
  pillTextActive: {
    color: COLORS.primary,
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
