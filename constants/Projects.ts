import { PurpleTheme } from '@/constants/Purple';

export type ProjectMember = { initials: string; color: string };

export type Project = {
  id: string;
  name: string;
  description: string;
  dotColor: string;
  barColor: string;
  done: number;
  total: number;
  due: string;
  members: ProjectMember[];
};

export const PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Mobile app v2',
    description: 'Rebuild the onboarding, login, and task flows on the new design system.',
    dotColor: PurpleTheme.primary,
    barColor: PurpleTheme.primary,
    done: 6,
    total: 14,
    due: 'Ships 3 Sep',
    members: [
      { initials: 'AM', color: PurpleTheme.primary },
      { initials: 'JC', color: '#1FA97D' },
      { initials: 'RK', color: '#D9552F' },
    ],
  },
  {
    id: '2',
    name: 'Brand refresh',
    description: 'Update illustrations, iconography, and empty states across the app.',
    dotColor: '#1FA97D',
    barColor: '#1FA97D',
    done: 7,
    total: 9,
    due: 'Review Thu',
    members: [
      { initials: 'TP', color: '#2F8FE0' },
      { initials: 'AM', color: PurpleTheme.primary },
    ],
  },
  {
    id: '3',
    name: 'Q3 planning',
    description: 'Draft the hiring plan and roadmap review for the next quarter.',
    dotColor: '#D9552F',
    barColor: '#D9552F',
    done: 1,
    total: 6,
    due: 'Draft due Fri',
    members: [
      { initials: 'AM', color: PurpleTheme.primary },
      { initials: 'SB', color: PurpleTheme.primary },
    ],
  },
  {
    id: '4',
    name: 'Ops & admin',
    description: 'Recurring invoicing, standups, and general operations upkeep.',
    dotColor: '#3B82F6',
    barColor: '#3B82F6',
    done: 8,
    total: 11,
    due: 'Recurring',
    members: [{ initials: 'SB', color: PurpleTheme.primary }],
  },
];
