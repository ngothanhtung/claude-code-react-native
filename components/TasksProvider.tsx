import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

import { Task, TASKS } from '@/constants/Tasks';

type TasksContextValue = {
  tasks: Task[];
  toggleTask: (id: string) => void;
};

const TasksContext = createContext<TasksContextValue | null>(null);

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState(TASKS);

  function toggleTask(id: string) {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, done: !task.done } : task))
    );
  }

  const value = useMemo(() => ({ tasks, toggleTask }), [tasks]);

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTasks() {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error('useTasks must be used within a TasksProvider');
  }
  return context;
}
