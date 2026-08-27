import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PurpleTheme } from '@/constants/Purple';

const COLORS = {
  bg: '#F3F4F8',
  card: '#FFFFFF',
  dark: '#151A2E',
  gray: '#8891A5',
  grayLight: '#C7CBD6',
  gridLine: '#E2E4EA',
  primary: PurpleTheme.primary,
};

const HOUR_HEIGHT = 84;
const MIN_BLOCK_HEIGHT = 84;
const FIRST_HOUR = 8;
const LAST_HOUR = 17;

const DAYS = [
  { label: 'M', date: 21 },
  { label: 'T', date: 22 },
  { label: 'W', date: 23 },
  { label: 'T', date: 24 },
  { label: 'F', date: 25 },
  { label: 'S', date: 26 },
  { label: 'S', date: 27 },
];

type Event = {
  id: string;
  title: string;
  timeLabel: string;
  project: string;
  color: string;
  startHour: number;
  endHour: number;
};

const EVENTS: Event[] = [
  {
    id: '1',
    title: 'Design review',
    timeLabel: '9:00 – 10:00',
    project: 'Mobile app v2',
    color: COLORS.primary,
    startHour: 9,
    endHour: 10,
  },
  {
    id: '2',
    title: 'Focus: hiring brief',
    timeLabel: '11:00 – 12:30',
    project: 'Q3 planning',
    color: '#D9552F',
    startHour: 11,
    endHour: 12.5,
  },
  {
    id: '3',
    title: 'Unblock Rina',
    timeLabel: '14:30 – 15:00',
    project: 'Mobile app v2',
    color: '#1FA97D',
    startHour: 14.5,
    endHour: 15,
  },
];

function hourLabel(hour: number) {
  if (hour === 12) return '12 pm';
  if (hour > 12) return `${hour - 12} pm`;
  return `${hour} am`;
}

const HOURS = Array.from({ length: LAST_HOUR - FIRST_HOUR + 1 }, (_, i) => FIRST_HOUR + i);
const TIMELINE_HEIGHT = HOURS.length * HOUR_HEIGHT;

export default function ScheduleScreen() {
  const [selectedDay, setSelectedDay] = useState(3);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Schedule</Text>
      </View>

      <View style={styles.weekRow}>
        {DAYS.map((day, index) => {
          const selected = index === selectedDay;
          return (
            <Pressable
              key={index}
              style={[styles.dayPill, selected && styles.dayPillSelected]}
              onPress={() => setSelectedDay(index)}>
              <Text style={[styles.dayLetter, selected && styles.dayTextSelected]}>
                {day.label}
              </Text>
              <Text style={[styles.dayNumber, selected && styles.dayTextSelected]}>
                {day.date}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.timeline, { height: TIMELINE_HEIGHT }]}>
          {HOURS.map((hour, index) => (
            <View key={hour} style={[styles.hourLabelWrap, { top: index * HOUR_HEIGHT - 8 }]}>
              <Text style={styles.hourLabel}>{hourLabel(hour)}</Text>
            </View>
          ))}
          {HOURS.map(
            (hour, index) =>
              index > 0 && (
                <View
                  key={hour}
                  style={[styles.gridLine, { top: index * HOUR_HEIGHT }]}
                />
              )
          )}
          {EVENTS.map((event) => {
            const top = (event.startHour - FIRST_HOUR) * HOUR_HEIGHT;
            const computedHeight = (event.endHour - event.startHour) * HOUR_HEIGHT;
            return (
              <View
                key={event.id}
                style={[
                  styles.eventBlock,
                  {
                    top,
                    height: Math.max(computedHeight, MIN_BLOCK_HEIGHT) - 6,
                    backgroundColor: event.color,
                  },
                ]}>
                <Text style={styles.eventTitle} numberOfLines={1}>
                  {event.title}
                </Text>
                <Text style={styles.eventSubtitle} numberOfLines={1}>
                  {event.timeLabel} · {event.project}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.unscheduledPanel}>
          <Text style={styles.unscheduledTitle}>Unscheduled · 4 tasks</Text>
          <Text style={styles.unscheduledHint}>
            Drag a task onto the timeline to schedule it.
          </Text>
        </View>
      </ScrollView>

      <Pressable style={styles.fab} hitSlop={8}>
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.dark,
  },
  weekRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  dayPill: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingVertical: 10,
    marginRight: 6,
  },
  dayPillSelected: {
    backgroundColor: COLORS.dark,
  },
  dayLetter: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray,
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.dark,
  },
  dayTextSelected: {
    color: '#fff',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  timeline: {
    position: 'relative',
    paddingHorizontal: 20,
  },
  hourLabelWrap: {
    position: 'absolute',
    left: 20,
    width: 48,
  },
  hourLabel: {
    fontSize: 13,
    color: COLORS.gray,
  },
  gridLine: {
    position: 'absolute',
    left: 76,
    right: 20,
    height: 1,
    backgroundColor: COLORS.gridLine,
  },
  eventBlock: {
    position: 'absolute',
    left: 76,
    right: 20,
    borderRadius: 16,
    padding: 14,
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  eventSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
  unscheduledPanel: {
    marginTop: 24,
    marginHorizontal: 20,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
  },
  unscheduledTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 4,
  },
  unscheduledHint: {
    fontSize: 13,
    color: COLORS.gray,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});
