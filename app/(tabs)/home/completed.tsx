import TaskListScreen from '@/components/TaskListScreen';

export default function CompletedTasksScreen() {
  return (
    <TaskListScreen
      title="Completed"
      subtitle="Tasks you've finished"
      filter={(task) => task.done}
      emptyText="No completed tasks yet."
    />
  );
}
