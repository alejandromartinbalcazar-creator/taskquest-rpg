import type { Task } from '../types';

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const addMonthsFromAnchor = (anchor: Date, months: number) => {
  const next = new Date(anchor);
  const targetMonth = anchor.getMonth() + months;
  next.setDate(1);
  next.setMonth(targetMonth);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(anchor.getDate(), lastDay));
  return next;
};

const addYearsFromAnchor = (anchor: Date, years: number) => {
  const next = new Date(anchor);
  next.setDate(1);
  next.setFullYear(anchor.getFullYear() + years);
  const lastDay = new Date(next.getFullYear(), anchor.getMonth() + 1, 0).getDate();
  next.setMonth(anchor.getMonth());
  next.setDate(Math.min(anchor.getDate(), lastDay));
  return next;
};

/** Returns the next occurrence while preserving the time selected for the task. */
export const getNextTaskDueDate = (task: Task, completedAt = new Date()): string | null => {
  const anchor = new Date(task.dueDate);
  if (Number.isNaN(anchor.getTime())) return null;

  if (task.recurrence === 'daily') {
    let occurrence = addDays(anchor, 1);
    while (occurrence <= completedAt) occurrence = addDays(occurrence, 1);
    return occurrence.toISOString();
  }

  if (task.recurrence === 'weekly') {
    let occurrence = addDays(anchor, 7);
    while (occurrence <= completedAt) occurrence = addDays(occurrence, 7);
    return occurrence.toISOString();
  }

  if (task.recurrence === 'monthly') {
    let months = 1;
    let occurrence = addMonthsFromAnchor(anchor, months);
    while (occurrence <= completedAt) occurrence = addMonthsFromAnchor(anchor, ++months);
    return occurrence.toISOString();
  }

  if (task.recurrence === 'yearly') {
    let years = 1;
    let occurrence = addYearsFromAnchor(anchor, years);
    while (occurrence <= completedAt) occurrence = addYearsFromAnchor(anchor, ++years);
    return occurrence.toISOString();
  }

  if (task.recurrence === 'weekdays' || task.recurrence === 'custom_days') {
    const selectedDays = task.recurrence === 'weekdays'
      ? [1, 2, 3, 4, 5]
      : task.recurrenceDays || [];
    if (selectedDays.length === 0) return null;

    let occurrence = addDays(anchor, 1);
    for (let attempts = 0; attempts < 3_660; attempts++) {
      if (occurrence > completedAt && selectedDays.includes(occurrence.getDay())) return occurrence.toISOString();
      occurrence = addDays(occurrence, 1);
    }
  }

  return null;
};
