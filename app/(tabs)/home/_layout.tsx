import { Stack } from 'expo-router';

import { TasksProvider } from '@/components/TasksProvider';

export const unstable_settings = {
  initialRouteName: 'today',
};

export default function TodayStackLayout() {
  return (
    <TasksProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="today" />
        <Stack.Screen name="overdue" />
        <Stack.Screen name="completed" />
        <Stack.Screen name="pending" />
      </Stack>
    </TasksProvider>
  );
}
