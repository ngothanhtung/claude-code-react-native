import {
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
} from '@expo-google-fonts/be-vietnam-pro';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import 'react-native-reanimated';

import { isRegisteredSubscriptionId, OneSignalService } from '@/components/oneSignal';
import { useColorScheme } from '@/components/useColorScheme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useOneSignal();

  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

// Initializes OneSignal and shows a one-time confirmation once this device has
// a server-assigned push subscription. Push permission is requested from here.
function useOneSignal() {
  const dialogShown = useRef(false);

  useEffect(() => {
    OneSignalService.initialize();

    const maybeShowDialog = (subscriptionId: string | null | undefined) => {
      if (!isRegisteredSubscriptionId(subscriptionId) || dialogShown.current) return;
      dialogShown.current = true;
      Alert.alert(
        'Your OneSignal SDK integration is complete!',
        'You can now send Push Notifications & In-App Messages through OneSignal. Tap below to enable push notifications.',
        [{ text: 'Got it', onPress: () => OneSignalService.requestPermission(true) }],
        { cancelable: false },
      );
    };

    const unsubscribe = OneSignalService.onPushSubscriptionChange((event) => maybeShowDialog(event.current.id));
    // The ID may already be assigned before the listener attaches.
    OneSignalService.getPushSubscription().then((subscription) => maybeShowDialog(subscription.id));

    return unsubscribe;
  }, []);
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // TEMP (manual test): open the OneSignal test screen first on launch.
    router.replace('/one-signal-notifications');
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="ui-ux-components" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ title: 'Notifications test' }} />
        <Stack.Screen name="one-signal-notifications" options={{ title: 'OneSignal test' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
