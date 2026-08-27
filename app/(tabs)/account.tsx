import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useState } from 'react';

import { PurpleTheme } from '@/constants/Purple';

const COLORS = {
  bg: '#F3F4F8',
  card: '#FFFFFF',
  dark: '#151A2E',
  gray: '#8891A5',
  grayLight: '#C7CBD6',
  primary: PurpleTheme.primary,
  primaryTint: PurpleTheme.primarySoft,
  red: '#E0483E',
  redTint: '#FBEAE8',
};

type SettingRow = {
  id: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  label: string;
  value?: string;
  toggle?: boolean;
  defaultValue?: boolean;
};

const STATS = [
  { label: 'Projects', value: '4' },
  { label: 'Done this week', value: '12' },
  { label: 'Day streak', value: '12' },
];

const ACCOUNT_ROWS: SettingRow[] = [
  {
    id: 'appearance',
    icon: 'color-palette-outline',
    iconColor: '#2F8FE0',
    iconBg: '#E7F1FC',
    label: 'Appearance',
    value: 'System',
  },
  {
    id: 'security',
    icon: 'shield-checkmark-outline',
    iconColor: '#1FA97D',
    iconBg: '#E4F6EF',
    label: 'Security',
  },
];

const NOTIFICATION_ROWS: SettingRow[] = [
  {
    id: 'task-reminders',
    icon: 'alarm-outline',
    iconColor: PurpleTheme.primary,
    iconBg: PurpleTheme.primarySoft,
    label: 'Task reminders',
    toggle: true,
  },
  {
    id: 'daily-digest',
    icon: 'mail-unread-outline',
    iconColor: '#2F8FE0',
    iconBg: '#E7F1FC',
    label: 'Daily digest at 8am',
    toggle: true,
  },
  {
    id: 'haptics-on-complete',
    icon: 'phone-portrait-outline',
    iconColor: '#1FA97D',
    iconBg: '#E4F6EF',
    label: 'Haptics on complete',
    toggle: true,
  },
];

const WORKSPACE_ROWS: SettingRow[] = [
  {
    id: 'connected-apps',
    icon: 'apps-outline',
    iconColor: '#D9552F',
    iconBg: '#FBEAE3',
    label: 'Connected apps',
    value: '3',
  },
  {
    id: 'export',
    icon: 'download-outline',
    iconColor: '#8891A5',
    iconBg: '#EEF0F5',
    label: 'Export data',
  },
];

const SUPPORT_ROWS: SettingRow[] = [
  {
    id: 'help',
    icon: 'help-circle-outline',
    iconColor: PurpleTheme.primary,
    iconBg: PurpleTheme.primarySoft,
    label: 'Help & Support',
  },
  {
    id: 'about',
    icon: 'information-circle-outline',
    iconColor: '#8891A5',
    iconBg: '#EEF0F5',
    label: 'About TaskFlow',
    value: 'v1.0.0',
  },
];

function SettingsSection({ title, rows }: { title: string; rows: SettingRow[] }) {
  const [toggles, setToggles] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      rows.filter((row) => row.toggle).map((row) => [row.id, row.defaultValue ?? true])
    )
  );

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>
        {rows.map((row, index) => (
          <View key={row.id}>
            <Pressable style={styles.row} disabled={row.toggle}>
              {row.icon ? (
                <View style={[styles.rowIcon, { backgroundColor: row.iconBg }]}>
                  <Ionicons name={row.icon} size={18} color={row.iconColor} />
                </View>
              ) : null}
              <Text style={styles.rowLabel}>{row.label}</Text>
              {row.toggle ? (
                <Switch
                  value={toggles[row.id] ?? false}
                  onValueChange={(next) =>
                    setToggles((prev) => ({ ...prev, [row.id]: next }))
                  }
                  trackColor={{ false: COLORS.grayLight, true: COLORS.primary }}
                  thumbColor="#fff"
                />
              ) : (
                <View style={styles.rowRight}>
                  {row.value ? <Text style={styles.rowValue}>{row.value}</Text> : null}
                  <Ionicons name="chevron-forward" size={18} color={COLORS.grayLight} />
                </View>
              )}
            </Pressable>
            {index < rows.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </View>
    </View>
  );
}

export default function AccountScreen() {
  function handleLogOut() {
    router.replace('/login');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>AM</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>Alex Morgan</Text>
          <Text style={styles.profileEmail}>alex.morgan@taskflow.app</Text>
        </View>
        <Pressable style={styles.editButton} hitSlop={8}>
          <Ionicons name="pencil" size={16} color={COLORS.primary} />
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        {STATS.map((stat) => (
          <View key={stat.label} style={styles.statTile}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <SettingsSection title="ACCOUNT" rows={ACCOUNT_ROWS} />
      <SettingsSection title="NOTIFICATIONS" rows={NOTIFICATION_ROWS} />
      <SettingsSection title="WORKSPACE" rows={WORKSPACE_ROWS} />
      <SettingsSection title="SUPPORT" rows={SUPPORT_ROWS} />

      <Pressable style={styles.logOutButton} onPress={handleLogOut}>
        <Ionicons name="log-out-outline" size={18} color={COLORS.red} />
        <Text style={styles.logOutText}>Log Out</Text>
      </Pressable>

      <Text style={styles.footerText}>TaskFlow v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.dark,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 13,
    color: COLORS.gray,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  statTile: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.dark,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.dark,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowValue: {
    fontSize: 14,
    color: COLORS.gray,
    marginRight: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F1F5',
    marginLeft: 58,
  },
  logOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.redTint,
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  logOutText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.red,
    marginLeft: 8,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.grayLight,
    textAlign: 'center',
  },
});
