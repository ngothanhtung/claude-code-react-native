import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
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
  read: boolean;
};

const INBOX_ITEMS: InboxItem[] = [
  {
    id: '1',
    title: 'Ask Jo about the motion spec',
    captured: 'Captured 8:12',
    source: 'voice note',
    read: false,
  },
  {
    id: '2',
    title: 'Look into the duplicate-task bug on Android',
    captured: 'Captured yesterday',
    source: 'shared from Slack',
    read: false,
  },
  {
    id: '3',
    title: 'Book the offsite room for September',
    captured: 'Captured yesterday',
    source: '',
    read: true,
  },
];

type InboxFilter = 'all' | 'read' | 'unread';

const TOP_TABS: { key: InboxFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'read', label: 'Read' },
  { key: 'unread', label: 'Unread' },
];

function TopTabBar({
  active,
  onChange,
}: {
  active: InboxFilter;
  onChange: (filter: InboxFilter) => void;
}) {
  return (
    <View style={styles.topTabBar}>
      {TOP_TABS.map((tab) => (
        <Pressable
          key={tab.key}
          style={styles.topTab}
          onPress={() => onChange(tab.key)}>
          <Text style={[styles.topTabText, active === tab.key && styles.topTabTextActive]}>
            {tab.label}
          </Text>
          <View style={[styles.topTabIndicator, active === tab.key && styles.topTabIndicatorActive]} />
        </Pressable>
      ))}
    </View>
  );
}

function InboxRow({
  item,
  onResolve,
  onToggleRead,
}: {
  item: InboxItem;
  onResolve: (id: string) => void;
  onToggleRead: (id: string) => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTitleRow}>
        {!item.read && <View style={styles.unreadDot} />}
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
      </View>
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
        <Pressable style={styles.pill} onPress={() => onToggleRead(item.id)}>
          <Text style={styles.pillText}>{item.read ? 'Mark unread' : 'Mark read'}</Text>
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
  const [filter, setFilter] = useState<InboxFilter>('all');

  const filteredItems = useMemo(() => {
    if (filter === 'read') return items.filter((item) => item.read);
    if (filter === 'unread') return items.filter((item) => !item.read);
    return items;
  }, [items, filter]);

  function resolveItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function toggleRead(id: string) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: !item.read } : item))
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inbox</Text>
        <Text style={styles.headerSubtitle}>
          {items.length} captured, unsorted
        </Text>
      </View>

      <TopTabBar active={filter} onChange={setFilter} />

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <InboxRow item={item} onResolve={resolveItem} onToggleRead={toggleRead} />
        )}
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
  topTabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E6EE',
    marginBottom: 16,
  },
  topTab: {
    marginRight: 24,
    paddingBottom: 10,
  },
  topTabText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray,
  },
  topTabTextActive: {
    color: COLORS.primary,
  },
  topTabIndicator: {
    height: 2,
    borderRadius: 1,
    backgroundColor: 'transparent',
    marginTop: 10,
  },
  topTabIndicatorActive: {
    backgroundColor: COLORS.primary,
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
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginTop: 6,
    marginRight: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.dark,
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
