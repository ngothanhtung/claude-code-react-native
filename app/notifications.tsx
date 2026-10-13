import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PurpleTheme } from '@/constants/Purple';

const COLORS = {
  bg: '#F3F4F8',
  card: '#FFFFFF',
  dark: '#151A2E',
  gray: '#8891A5',
  grayLight: '#C7CBD6',
  primary: PurpleTheme.primary,
  primaryTint: PurpleTheme.primarySoft,
  green: '#1FA97D',
  red: '#E0483E',
  redTint: '#FBEAE8',
};

const ANDROID_CHANNEL_ID = 'default';

// Without a handler, notifications are not shown while the app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

type LogEntry = {
  id: number;
  time: string;
  kind: 'received' | 'tapped' | 'info' | 'error';
  text: string;
};

function describePermissions(perm: Notifications.NotificationPermissionsStatus | null) {
  if (!perm) return 'Checking…';
  if (Platform.OS === 'ios' && perm.ios) {
    return `${perm.status} (iOS: ${Notifications.IosAuthorizationStatus[perm.ios.status]})`;
  }
  return perm.status;
}

function ActionButton({ icon, label, onPress, variant = 'primary' }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'danger' }) {
  const variantStyle = variant === 'primary' ? styles.buttonPrimary : variant === 'danger' ? styles.buttonDanger : styles.buttonSecondary;
  const color = variant === 'primary' ? '#fff' : variant === 'danger' ? COLORS.red : COLORS.primary;

  return (
    <Pressable style={({ pressed }) => [styles.button, variantStyle, pressed && { opacity: 0.7 }]} onPress={onPress}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.buttonText, { color }]}>{label}</Text>
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

export default function NotificationsTestScreen() {
  const [permissions, setPermissions] = useState<Notifications.NotificationPermissionsStatus | null>(null);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [scheduled, setScheduled] = useState<Notifications.NotificationRequest[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const lastResponse = Notifications.useLastNotificationResponse();

  const addLog = useCallback((kind: LogEntry['kind'], text: string) => {
    setLog((prev) => [{ id: Date.now() + Math.random(), time: new Date().toLocaleTimeString(), kind, text }, ...prev].slice(0, 30));
  }, []);

  const refreshScheduled = useCallback(async () => {
    try {
      setScheduled(await Notifications.getAllScheduledNotificationsAsync());
    } catch (e) {
      addLog('error', `getAllScheduledNotificationsAsync: ${String(e)}`);
    }
  }, [addLog]);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    // Android 8+ needs a channel; Android 13+ won't show the permission prompt without one.
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: COLORS.primary,
      });
    }

    Notifications.getPermissionsAsync().then(setPermissions);
    refreshScheduled();

    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      addLog('received', notification.request.content.title ?? '(no title)');
      refreshScheduled();
    });
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const { title, data } = response.notification.request.content;
      addLog('tapped', `${title ?? '(no title)'} · data=${JSON.stringify(data)}`);
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [addLog, refreshScheduled]);

  async function requestPermissions() {
    const result = await Notifications.requestPermissionsAsync();
    setPermissions(result);
    addLog('info', `Permission: ${describePermissions(result)}`);
  }

  async function schedule(seconds: number | null) {
    if (!permissions?.granted) {
      addLog('error', 'Permission not granted — tap "Request permission" first.');
      return;
    }
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: seconds ? `⏰ Reminder after ${seconds}s` : '🔔 Instant notification',
          body: seconds ? 'Put the app in the background to see it in the system tray.' : 'Sent from the TaskFlow notifications test screen.',
          data: { source: 'notifications-test', sentAt: Date.now() },
          sound: true,
        },
        trigger: seconds
          ? {
              type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
              seconds,
              channelId: ANDROID_CHANNEL_ID,
            }
          : null,
      });
      addLog('info', seconds ? `Scheduled in ${seconds}s (id ${id.slice(0, 8)})` : 'Sent instantly');
      refreshScheduled();
    } catch (e) {
      addLog('error', `scheduleNotificationAsync: ${String(e)}`);
    }
  }

  async function cancelAll() {
    await Notifications.cancelAllScheduledNotificationsAsync();
    addLog('info', 'Cancelled all scheduled notifications');
    refreshScheduled();
  }

  async function setBadge(count: number) {
    const ok = await Notifications.setBadgeCountAsync(count);
    addLog(ok ? 'info' : 'error', ok ? `Badge set to ${count}` : 'Badge not set (missing permission?)');
  }

  async function dismissAll() {
    await Notifications.dismissAllNotificationsAsync();
    addLog('info', 'Dismissed all notifications from the tray');
  }

  async function getPushToken() {
    if (!Device.isDevice) {
      addLog('error', 'Push tokens require a physical device.');
      return;
    }
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) {
      addLog('error', 'No EAS projectId found — run `eas init` to link the project first.');
      return;
    }
    try {
      const token = await Notifications.getExpoPushTokenAsync({ projectId });
      setPushToken(token.data);
      addLog('info', 'Got Expo push token');
    } catch (e) {
      addLog('error', `getExpoPushTokenAsync: ${String(e)}`);
    }
  }

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name='notifications-off-outline' size={40} color={COLORS.gray} />
        <Text style={styles.hint}>expo-notifications is not supported on web. Use iOS or Android.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Section title='PERMISSION'>
        <View style={styles.statusRow}>
          <Ionicons name={permissions?.granted ? 'checkmark-circle' : 'alert-circle'} size={20} color={permissions?.granted ? COLORS.green : COLORS.red} />
          <Text style={styles.statusText}>{describePermissions(permissions)}</Text>
        </View>
        <ActionButton icon='lock-open-outline' label='Request permission' onPress={requestPermissions} />
      </Section>

      <Section title='LOCAL NOTIFICATIONS'>
        <ActionButton icon='flash-outline' label='Send now' onPress={() => schedule(null)} />
        <ActionButton icon='timer-outline' label='Schedule in 5 seconds' variant='secondary' onPress={() => schedule(5)} />
        <ActionButton icon='hourglass-outline' label='Schedule in 30 seconds' variant='secondary' onPress={() => schedule(30)} />
        <Text style={styles.subTitle}>Scheduled ({scheduled.length})</Text>
        {scheduled.length === 0 ? (
          <Text style={styles.hint}>Nothing pending.</Text>
        ) : (
          scheduled.map((req) => (
            <Text key={req.identifier} style={styles.mono} numberOfLines={1}>
              {req.content.title} · {req.identifier.slice(0, 8)}
            </Text>
          ))
        )}
        <ActionButton icon='trash-outline' label='Cancel all scheduled' variant='danger' onPress={cancelAll} />
      </Section>

      <Section title='BADGE & TRAY'>
        <View style={styles.inlineButtons}>
          <View style={{ flex: 1 }}>
            <ActionButton icon='add-circle-outline' label='Badge = 3' variant='secondary' onPress={() => setBadge(3)} />
          </View>
          <View style={{ flex: 1 }}>
            <ActionButton icon='remove-circle-outline' label='Clear badge' variant='secondary' onPress={() => setBadge(0)} />
          </View>
        </View>
        <ActionButton icon='close-circle-outline' label='Dismiss all from tray' variant='secondary' onPress={dismissAll} />
      </Section>

      <Section title='PUSH TOKEN'>
        <Text style={styles.hint}>Requires a physical device and an EAS projectId. Remote push on Android does not work in Expo Go — use a development build.</Text>
        {pushToken ? (
          <Text style={styles.mono} selectable>
            {pushToken}
          </Text>
        ) : null}
        <ActionButton icon='key-outline' label='Get Expo push token' variant='secondary' onPress={getPushToken} />
      </Section>

      <Section title='LAST TAPPED NOTIFICATION'>
        <Text style={styles.mono}>{lastResponse === undefined ? 'Loading…' : lastResponse === null ? 'None yet' : `${lastResponse.notification.request.content.title}\n${JSON.stringify(lastResponse.notification.request.content.data)}`}</Text>
      </Section>

      <Section title='EVENT LOG'>
        {log.length === 0 ? (
          <Text style={styles.hint}>Events from listeners and actions will appear here.</Text>
        ) : (
          log.map((entry) => (
            <Text key={entry.id} style={[styles.mono, entry.kind === 'error' && { color: COLORS.red }]}>
              [{entry.time}] {entry.kind.toUpperCase()} — {entry.text}
            </Text>
          ))
        )}
        {log.length > 0 ? <ActionButton icon='refresh-outline' label='Clear log' variant='secondary' onPress={() => setLog([])} /> : null}
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 60,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.dark,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.dark,
    marginTop: 4,
  },
  hint: {
    fontSize: 13,
    color: COLORS.gray,
    textAlign: 'left',
  },
  mono: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    color: COLORS.dark,
  },
  inlineButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary,
  },
  buttonSecondary: {
    backgroundColor: COLORS.primaryTint,
  },
  buttonDanger: {
    backgroundColor: COLORS.redTint,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
