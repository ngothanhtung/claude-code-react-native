import { PurpleTheme } from '@/constants/Purple';

export type Task = {
  id: string;
  title: string;
  project: string;
  dotColor: string;
  time: string;
  timeColor?: string;
  count?: string;
  avatarInitials: string;
  avatarColor: string;
  done: boolean;
  dueCategory: 'today' | 'overdue' | 'tomorrow';
};

export const TASKS: Task[] = [
  {
    id: '1',
    title: 'Review the onboarding flow copy',
    project: 'Mobile app v2',
    dotColor: PurpleTheme.primary,
    time: '9:00',
    count: '1/3',
    avatarInitials: 'AM',
    avatarColor: PurpleTheme.primary,
    done: false,
    dueCategory: 'today',
  },
  {
    id: '2',
    title: 'Ship the empty-state illustrations',
    project: 'Brand refresh',
    dotColor: '#1FA97D',
    time: 'Overdue',
    timeColor: '#E0483E',
    count: '1/2',
    avatarInitials: 'TP',
    avatarColor: '#2F8FE0',
    done: false,
    dueCategory: 'overdue',
  },
  {
    id: '3',
    title: 'Write Q3 hiring brief',
    project: 'Q3 planning',
    dotColor: '#F4693F',
    time: 'Today',
    timeColor: PurpleTheme.primary,
    avatarInitials: 'AM',
    avatarColor: PurpleTheme.primary,
    done: false,
    dueCategory: 'today',
  },
  {
    id: '4',
    title: 'Unblock Rina on the API contract',
    project: 'Mobile app v2',
    dotColor: PurpleTheme.primary,
    time: '14:30',
    count: '0/1',
    avatarInitials: 'RK',
    avatarColor: '#D9552F',
    done: false,
    dueCategory: 'today',
  },
  {
    id: '5',
    title: 'Approve the August invoices',
    project: 'Ops & admin',
    dotColor: '#3B82F6',
    time: 'Today',
    timeColor: PurpleTheme.primary,
    avatarInitials: 'SB',
    avatarColor: PurpleTheme.primary,
    done: true,
    dueCategory: 'today',
  },
  {
    id: '6',
    title: 'Standup notes to the channel',
    project: 'Ops & admin',
    dotColor: '#3B82F6',
    time: '17:00',
    avatarInitials: 'AM',
    avatarColor: PurpleTheme.primary,
    done: false,
    dueCategory: 'today',
  },
  {
    id: '7',
    title: 'Wire the offline sync queue',
    project: 'Mobile app v2',
    dotColor: PurpleTheme.primary,
    time: 'Tomorrow',
    count: '1/2',
    avatarInitials: 'JC',
    avatarColor: '#1FA97D',
    done: false,
    dueCategory: 'tomorrow',
  },
  {
    id: '8',
    title: 'Review the auth pull request',
    project: 'Mobile app v2',
    dotColor: PurpleTheme.primary,
    time: 'Tomorrow',
    avatarInitials: 'JC',
    avatarColor: '#1FA97D',
    done: false,
    dueCategory: 'tomorrow',
  },
];
