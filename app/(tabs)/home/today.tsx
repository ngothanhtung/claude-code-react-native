import TaskListScreen from '@/components/TaskListScreen';

export default function TodayTasksScreen() {
  return (
    <TaskListScreen
      title="Today"
      subtitle="Tasks due today"
      filter={(task) => task.dueCategory === 'today'}
      emptyText="Nothing due today."
    />
  );
}
