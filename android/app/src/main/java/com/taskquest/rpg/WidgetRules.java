package com.taskquest.rpg;

import java.time.*;
import java.util.*;

/** Rules independent of Android views/storage, shared by all widget instances. */
final class WidgetRules {
    static Instant instant(String value) { try { return Instant.parse(value); } catch (Exception e) { return null; } }
    static String section(String due, Instant now, ZoneId zone) {
        Instant at = instant(due); if (at == null) return "later";
        if (at.isBefore(now)) return "overdue";
        LocalDate day = at.atZone(zone).toLocalDate(), today = now.atZone(zone).toLocalDate();
        return day.equals(today) ? "today" : day.equals(today.plusDays(1)) ? "tomorrow" : "later";
    }
    static String next(String due, String recurrence, int[] days, Instant completed, ZoneId zone) {
        Instant parsed = instant(due); if (parsed == null) return null;
        ZonedDateTime anchor = parsed.atZone(zone), next, stepping = anchor;
        for (int n = 1; n < 100000; n++) {
            switch (recurrence) {
                case "daily": next = stepping.plusDays(1); stepping = next; break;
                case "weekly": next = stepping.plusWeeks(1); stepping = next; break;
                case "monthly": next = anchor.plusMonths(n); break;
                case "yearly": next = anchor.plusYears(n); break;
                case "weekdays": case "custom_days":
                    if (n > 3660) return null;
                    next = stepping.plusDays(1); stepping = next;
                    int day = next.getDayOfWeek().getValue() % 7;
                    boolean allowed = recurrence.equals("weekdays") ? day > 0 && day < 6 : Arrays.stream(days).anyMatch(d -> d == day);
                    if (!allowed) continue; break;
                default: return null;
            }
            next = next.withEarlierOffsetAtOverlap();
            if (next.toInstant().isAfter(completed)) return iso(next.toInstant());
        }
        return null;
    }
    static String iso(Instant at) { return new java.time.format.DateTimeFormatterBuilder().appendInstant(3).toFormatter().format(at); }
    static int[] allocation(int height, int rowHeight, int today, int overdue, int tomorrow, int[] limits) {
        int budget = Math.max(2, (height - 92) / rowHeight);
        int a = 0, b = 0, c = 0;
        while (budget > 0 && ((a < today && a < limits[0]) || (b < overdue && b < limits[1]))) {
            if (a < today && a < limits[0] && (a <= b || b >= overdue || b >= limits[1])) { a++; budget--; }
            else if (b < overdue && b < limits[1]) { b++; budget--; }
        }
        // Tomorrow never consumes the budget reserved for the main two groups.
        if (height >= 320 && tomorrow > 0 && limits[2] > 0) c = Math.min(tomorrow, Math.min(limits[2], 1));
        return new int[]{a, b, c};
    }
}
