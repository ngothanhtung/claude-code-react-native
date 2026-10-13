import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import type {
  InAppMessageClickEvent,
  NotificationClickEvent,
  NotificationWillDisplayEvent,
  PushSubscriptionChangedState,
  UserChangedState,
} from 'react-native-onesignal';

/**
 * Single entry point for every OneSignal SDK call in the app — screens and
 * layouts must go through this module instead of importing
 * `react-native-onesignal` directly.
 */

export const ONESIGNAL_APP_ID = '283627ad-d0eb-4b48-852b-ba14eed521a3';

// The native module is looked up eagerly when `react-native-onesignal` is
// imported, which throws on web and inside Expo Go (no OneSignal native code).
// Only load it in a development/production build.
const isSupported = Platform.OS !== 'web' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

type OneSignalModule = typeof import('react-native-onesignal');
const sdk: OneSignalModule | null = isSupported ? require('react-native-onesignal') : null;

const noop = () => {};

let initialized = false;

export type PushSubscriptionInfo = {
  id: string | null;
  token: string | null;
  optedIn: boolean;
};

/** A real, server-assigned subscription ID is non-empty and not the `local-` placeholder. */
export function isRegisteredSubscriptionId(id: string | null | undefined): id is string {
  return !!id && !id.startsWith('local-');
}

export const OneSignalService = {
  isSupported,

  initialize() {
    if (!sdk || initialized) return;
    initialized = true;
    if (__DEV__) sdk.OneSignal.Debug.setLogLevel(sdk.LogLevel.Verbose);
    sdk.OneSignal.initialize(ONESIGNAL_APP_ID);
  },

  setLogLevel(level: 'none' | 'error' | 'warn' | 'verbose') {
    if (!sdk) return;
    const map = { none: sdk.LogLevel.None, error: sdk.LogLevel.Error, warn: sdk.LogLevel.Warn, verbose: sdk.LogLevel.Verbose };
    sdk.OneSignal.Debug.setLogLevel(map[level]);
  },

  // --- Push permission & subscription ---

  async hasPermission() {
    return sdk ? sdk.OneSignal.Notifications.getPermissionAsync() : false;
  },

  async canRequestPermission() {
    return sdk ? sdk.OneSignal.Notifications.canRequestPermission() : false;
  },

  /** `fallbackToSettings` opens the OS settings page when the prompt was already denied. */
  async requestPermission(fallbackToSettings = true) {
    return sdk ? sdk.OneSignal.Notifications.requestPermission(fallbackToSettings) : false;
  },

  async getPushSubscription(): Promise<PushSubscriptionInfo> {
    if (!sdk) return { id: null, token: null, optedIn: false };
    const { pushSubscription } = sdk.OneSignal.User;
    const [id, token, optedIn] = await Promise.all([pushSubscription.getIdAsync(), pushSubscription.getTokenAsync(), pushSubscription.getOptedInAsync()]);
    return { id, token, optedIn };
  },

  optIn() {
    sdk?.OneSignal.User.pushSubscription.optIn();
  },

  optOut() {
    sdk?.OneSignal.User.pushSubscription.optOut();
  },

  clearAllNotifications() {
    sdk?.OneSignal.Notifications.clearAll();
  },

  // --- User identity ---

  login(externalId: string) {
    sdk?.OneSignal.login(externalId);
  },

  logout() {
    sdk?.OneSignal.logout();
  },

  async getUserIds() {
    if (!sdk) return { onesignalId: null, externalId: null };
    const [onesignalId, externalId] = await Promise.all([sdk.OneSignal.User.getOnesignalId(), sdk.OneSignal.User.getExternalId()]);
    return { onesignalId, externalId };
  },

  // --- Tags ---

  addTag(key: string, value: string) {
    sdk?.OneSignal.User.addTag(key, value);
  },

  removeTag(key: string) {
    sdk?.OneSignal.User.removeTag(key);
  },

  async getTags(): Promise<Record<string, string>> {
    return sdk ? sdk.OneSignal.User.getTags() : {};
  },

  // --- Email & SMS subscriptions ---

  addEmail(email: string) {
    sdk?.OneSignal.User.addEmail(email);
  },

  removeEmail(email: string) {
    sdk?.OneSignal.User.removeEmail(email);
  },

  addSms(phoneNumber: string) {
    sdk?.OneSignal.User.addSms(phoneNumber);
  },

  removeSms(phoneNumber: string) {
    sdk?.OneSignal.User.removeSms(phoneNumber);
  },

  // --- In-app messages ---

  addInAppTrigger(key: string, value: string) {
    sdk?.OneSignal.InAppMessages.addTrigger(key, value);
  },

  clearInAppTriggers() {
    sdk?.OneSignal.InAppMessages.clearTriggers();
  },

  setInAppMessagesPaused(paused: boolean) {
    sdk?.OneSignal.InAppMessages.setPaused(paused);
  },

  // --- Event listeners: each returns an unsubscribe function ---

  onPushSubscriptionChange(listener: (event: PushSubscriptionChangedState) => void) {
    if (!sdk) return noop;
    const { pushSubscription } = sdk.OneSignal.User;
    pushSubscription.addEventListener('change', listener);
    return () => pushSubscription.removeEventListener('change', listener);
  },

  onPermissionChange(listener: (granted: boolean) => void) {
    if (!sdk) return noop;
    const { Notifications } = sdk.OneSignal;
    Notifications.addEventListener('permissionChange', listener);
    return () => Notifications.removeEventListener('permissionChange', listener);
  },

  onNotificationClick(listener: (event: NotificationClickEvent) => void) {
    if (!sdk) return noop;
    const { Notifications } = sdk.OneSignal;
    Notifications.addEventListener('click', listener);
    return () => Notifications.removeEventListener('click', listener);
  },

  /** Call `event.preventDefault()` synchronously inside the listener to suppress the banner. */
  onForegroundWillDisplay(listener: (event: NotificationWillDisplayEvent) => void) {
    if (!sdk) return noop;
    const { Notifications } = sdk.OneSignal;
    Notifications.addEventListener('foregroundWillDisplay', listener);
    return () => Notifications.removeEventListener('foregroundWillDisplay', listener);
  },

  onUserChange(listener: (event: UserChangedState) => void) {
    if (!sdk) return noop;
    const { User } = sdk.OneSignal;
    User.addEventListener('change', listener);
    return () => User.removeEventListener('change', listener);
  },

  onInAppMessageClick(listener: (event: InAppMessageClickEvent) => void) {
    if (!sdk) return noop;
    const { InAppMessages } = sdk.OneSignal;
    InAppMessages.addEventListener('click', listener);
    return () => InAppMessages.removeEventListener('click', listener);
  },
};
