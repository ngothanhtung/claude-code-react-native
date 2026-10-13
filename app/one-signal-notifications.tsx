import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { isRegisteredSubscriptionId, ONESIGNAL_APP_ID, OneSignalService, type PushSubscriptionInfo } from '@/components/oneSignal';
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

type LogEntry = {
  id: number;
  time: string;
  kind: 'received' | 'tapped' | 'info' | 'error';
  text: string;
};

type Status = {
  permission: boolean | null;
  subscription: PushSubscriptionInfo;
  onesignalId: string | null;
  externalId: string | null;
  tags: Record<string, string>;
};

const INITIAL_STATUS: Status = {
  permission: null,
  subscription: { id: null, token: null, optedIn: false },
  onesignalId: null,
  externalId: null,
  tags: {},
};

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

function InfoRow({ label, value, ok }: { label: string; value: string | null; ok?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLabelRow}>
        {ok !== undefined ? <Ionicons name={ok ? 'checkmark-circle' : 'alert-circle'} size={16} color={ok ? COLORS.green : COLORS.red} /> : null}
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.mono} selectable>
        {value ?? '—'}
      </Text>
    </View>
  );
}

function Input(props: React.ComponentProps<typeof TextInput>) {
  return <TextInput placeholderTextColor={COLORS.grayLight} autoCapitalize='none' autoCorrect={false} {...props} style={[styles.input, props.style]} />;
}

function InlineButtons({ children }: { children: React.ReactNode[] }) {
  return (
    <View style={styles.inlineButtons}>
      {children.map((child, index) => (
        <View key={index} style={{ flex: 1 }}>
          {child}
        </View>
      ))}
    </View>
  );
}

export default function OneSignalNotificationsTestScreen() {
  const [status, setStatus] = useState<Status>(INITIAL_STATUS);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [externalIdInput, setExternalIdInput] = useState('');
  const [tagKey, setTagKey] = useState('');
  const [tagValue, setTagValue] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [triggerKey, setTriggerKey] = useState('');
  const [triggerValue, setTriggerValue] = useState('');
  const [showInForeground, setShowInForeground] = useState(true);
  const [inAppPaused, setInAppPaused] = useState(false);

  // preventDefault() must be called synchronously, so the listener reads a ref instead of state.
  const showInForegroundRef = useRef(showInForeground);
  showInForegroundRef.current = showInForeground;

  const addLog = useCallback((kind: LogEntry['kind'], text: string) => {
    setLog((prev) => [{ id: Date.now() + Math.random(), time: new Date().toLocaleTimeString(), kind, text }, ...prev].slice(0, 30));
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [permission, subscription, ids, tags] = await Promise.all([OneSignalService.hasPermission(), OneSignalService.getPushSubscription(), OneSignalService.getUserIds(), OneSignalService.getTags()]);
      setStatus({ permission, subscription, ...ids, tags });
    } catch (e) {
      addLog('error', `refresh: ${String(e)}`);
    }
  }, [addLog]);

  useEffect(() => {
    if (!OneSignalService.isSupported) return;

    refresh();

    const unsubscribers = [
      OneSignalService.onPermissionChange((granted) => {
        addLog('info', `Permission changed → ${granted ? 'granted' : 'denied'}`);
        refresh();
      }),
      OneSignalService.onPushSubscriptionChange(({ current }) => {
        addLog('info', `Push subscription changed · id=${current.id ?? 'null'} · optedIn=${current.optedIn}`);
        refresh();
      }),
      OneSignalService.onUserChange(({ current }) => {
        addLog('info', `User changed · onesignalId=${current.onesignalId ?? 'null'} · externalId=${current.externalId ?? 'null'}`);
        refresh();
      }),
      OneSignalService.onForegroundWillDisplay((event) => {
        const { title, body } = event.getNotification();
        if (!showInForegroundRef.current) event.preventDefault();
        addLog('received', `${title ?? '(no title)'} · ${body}${showInForegroundRef.current ? '' : ' (banner suppressed)'}`);
      }),
      OneSignalService.onNotificationClick(({ notification, result }) => {
        const extra = [result.actionId && `action=${result.actionId}`, result.url && `url=${result.url}`, notification.additionalData && `data=${JSON.stringify(notification.additionalData)}`].filter(Boolean).join(' · ');
        addLog('tapped', `${notification.title ?? '(no title)'}${extra ? ` · ${extra}` : ''}`);
      }),
      OneSignalService.onInAppMessageClick(({ message, result }) => {
        addLog('tapped', `In-app message ${message.messageId} · action=${result.actionId ?? '—'}`);
      }),
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [addLog, refresh]);

  async function requestPermission() {
    const granted = await OneSignalService.requestPermission(true);
    addLog(granted ? 'info' : 'error', `requestPermission → ${granted ? 'granted' : 'not granted'}`);
    refresh();
  }

  function toggleOptIn() {
    if (status.subscription.optedIn) {
      OneSignalService.optOut();
      addLog('info', 'Opted out of push');
    } else {
      OneSignalService.optIn();
      addLog('info', 'Opted in to push');
    }
  }

  function login() {
    const id = externalIdInput.trim();
    if (!id) return addLog('error', 'Enter an external ID first.');
    OneSignalService.login(id);
    addLog('info', `login("${id}")`);
  }

  function logout() {
    OneSignalService.logout();
    addLog('info', 'logout()');
  }

  function addTag() {
    const key = tagKey.trim();
    if (!key) return addLog('error', 'Enter a tag key first.');
    OneSignalService.addTag(key, tagValue.trim());
    addLog('info', `addTag("${key}", "${tagValue.trim()}")`);
    setTagKey('');
    setTagValue('');
    refresh();
  }

  function removeTag(key: string) {
    OneSignalService.removeTag(key);
    addLog('info', `removeTag("${key}")`);
    refresh();
  }

  function addEmail() {
    const value = email.trim();
    if (!value) return addLog('error', 'Enter an email first.');
    OneSignalService.addEmail(value);
    addLog('info', `addEmail("${value}")`);
  }

  function addSms() {
    const value = phone.trim();
    if (!value) return addLog('error', 'Enter a phone number in E.164 format, e.g. +84901234567.');
    OneSignalService.addSms(value);
    addLog('info', `addSms("${value}")`);
  }

  function addTrigger() {
    const key = triggerKey.trim();
    if (!key) return addLog('error', 'Enter a trigger key first.');
    OneSignalService.addInAppTrigger(key, triggerValue.trim());
    addLog('info', `addTrigger("${key}", "${triggerValue.trim()}")`);
  }

  function toggleInAppPaused(paused: boolean) {
    setInAppPaused(paused);
    OneSignalService.setInAppMessagesPaused(paused);
    addLog('info', `In-app messages ${paused ? 'paused' : 'resumed'}`);
  }

  if (!OneSignalService.isSupported) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name='notifications-off-outline' size={40} color={COLORS.gray} />
        <Text style={[styles.hint, { textAlign: 'center' }]}>
          {Platform.OS === 'web'
            ? 'OneSignal (react-native-onesignal) is not supported on web. Use iOS or Android.'
            : 'OneSignal needs a development build — it does not run in Expo Go.\nRun `npx expo run:ios` or `npx expo run:android`.'}
        </Text>
      </View>
    );
  }

  const registered = isRegisteredSubscriptionId(status.subscription.id);
  const tagEntries = Object.entries(status.tags);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps='handled'>
      <Section title='STATUS'>
        <InfoRow label='App ID' value={ONESIGNAL_APP_ID} />
        <InfoRow label='Push permission' value={status.permission === null ? 'Checking…' : status.permission ? 'granted' : 'not granted'} ok={status.permission ?? false} />
        <InfoRow label='Subscription ID' value={status.subscription.id} ok={registered} />
        <InfoRow label='Opted in' value={String(status.subscription.optedIn)} ok={status.subscription.optedIn} />
        <InfoRow label='Push token' value={status.subscription.token} />
        <InfoRow label='OneSignal ID' value={status.onesignalId} />
        <InfoRow label='External ID' value={status.externalId} />
        <ActionButton icon='refresh-outline' label='Refresh' variant='secondary' onPress={refresh} />
      </Section>

      <Section title='PERMISSION & SUBSCRIPTION'>
        <ActionButton icon='lock-open-outline' label='Request permission' onPress={requestPermission} />
        <ActionButton icon={status.subscription.optedIn ? 'notifications-off-outline' : 'notifications-outline'} label={status.subscription.optedIn ? 'Opt out of push' : 'Opt in to push'} variant='secondary' onPress={toggleOptIn} />
      </Section>

      <Section title='FOREGROUND & TRAY'>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Show banner while app is open</Text>
          <Switch value={showInForeground} onValueChange={setShowInForeground} trackColor={{ true: COLORS.primary }} />
        </View>
        <ActionButton
          icon='close-circle-outline'
          label='Clear all from tray'
          variant='secondary'
          onPress={() => {
            OneSignalService.clearAllNotifications();
            addLog('info', 'Cleared all OneSignal notifications');
          }}
        />
      </Section>

      <Section title='SEND A TEST PUSH'>
        <Text style={styles.hint}>
          1. Grant permission and wait until the Subscription ID shows a green check.{'\n'}
          2. In the OneSignal dashboard → Audience → Subscriptions, find this Subscription ID and add it as a Test Subscription.{'\n'}
          3. Messages → New Push → send to the test subscription (or to External ID / tag below).{'\n'}
          4. Try it with the app in foreground, background and killed — received/tapped events show up in the log.
        </Text>
      </Section>

      <Section title='USER (EXTERNAL ID)'>
        <Input placeholder='External ID, e.g. user-123' value={externalIdInput} onChangeText={setExternalIdInput} />
        <InlineButtons>
          <ActionButton icon='log-in-outline' label='Login' onPress={login} />
          <ActionButton icon='log-out-outline' label='Logout' variant='danger' onPress={logout} />
        </InlineButtons>
      </Section>

      <Section title='TAGS'>
        <InlineButtons>
          <Input placeholder='Key' value={tagKey} onChangeText={setTagKey} />
          <Input placeholder='Value' value={tagValue} onChangeText={setTagValue} />
        </InlineButtons>
        <ActionButton icon='pricetag-outline' label='Add tag' onPress={addTag} />
        {tagEntries.length === 0 ? (
          <Text style={styles.hint}>No tags yet.</Text>
        ) : (
          tagEntries.map(([key, value]) => (
            <View key={key} style={styles.tagRow}>
              <Text style={[styles.mono, { flex: 1 }]}>
                {key} = {value}
              </Text>
              <Pressable onPress={() => removeTag(key)} hitSlop={8}>
                <Ionicons name='trash-outline' size={18} color={COLORS.red} />
              </Pressable>
            </View>
          ))
        )}
      </Section>

      <Section title='EMAIL & SMS'>
        <Input placeholder='Email' keyboardType='email-address' value={email} onChangeText={setEmail} />
        <ActionButton icon='mail-outline' label='Add email subscription' variant='secondary' onPress={addEmail} />
        <Input placeholder='Phone (E.164), e.g. +84901234567' keyboardType='phone-pad' value={phone} onChangeText={setPhone} />
        <ActionButton icon='chatbubble-outline' label='Add SMS subscription' variant='secondary' onPress={addSms} />
      </Section>

      <Section title='IN-APP MESSAGES'>
        <InlineButtons>
          <Input placeholder='Trigger key' value={triggerKey} onChangeText={setTriggerKey} />
          <Input placeholder='Value' value={triggerValue} onChangeText={setTriggerValue} />
        </InlineButtons>
        <ActionButton icon='flash-outline' label='Add trigger' variant='secondary' onPress={addTrigger} />
        <ActionButton
          icon='trash-outline'
          label='Clear triggers'
          variant='danger'
          onPress={() => {
            OneSignalService.clearInAppTriggers();
            addLog('info', 'Cleared in-app triggers');
          }}
        />
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Pause in-app messages</Text>
          <Switch value={inAppPaused} onValueChange={toggleInAppPaused} trackColor={{ true: COLORS.primary }} />
        </View>
      </Section>

      <Section title='EVENT LOG'>
        {log.length === 0 ? (
          <Text style={styles.hint}>OneSignal events and actions will appear here.</Text>
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
  infoRow: {
    gap: 2,
  },
  infoLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray,
  },
  hint: {
    fontSize: 13,
    color: COLORS.gray,
    textAlign: 'left',
    lineHeight: 19,
  },
  mono: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    color: COLORS.dark,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.grayLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.dark,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.dark,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
