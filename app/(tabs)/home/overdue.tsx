import TaskListScreen from '@/components/TaskListScreen';

export default function OverdueTasksScreen() {
  return (
    <TaskListScreen
      title="Overdue"
      subtitle="Tasks past their due date"
      filter={(task) => task.dueCategory === 'overdue' && !task.done}
      emptyText="No overdue tasks."
    />
  );
}
