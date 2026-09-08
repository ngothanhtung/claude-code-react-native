import TaskListScreen from '@/components/TaskListScreen';

export default function PendingTasksScreen() {
  return (
    <TaskListScreen
      title="Pending"
      subtitle="Tasks still to do"
      filter={(task) => !task.done}
      emptyText="Nothing pending. You're all caught up!"
    />
  );
}
