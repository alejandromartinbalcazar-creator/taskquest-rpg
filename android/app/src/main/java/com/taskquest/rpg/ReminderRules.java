package com.taskquest.rpg;

/** Clock-only rules shared by scheduling, restoration and widget follow-up. */
final class ReminderRules {
    static long next(long start, long interval, long due, long now) {
        if (interval < 900000L) throw new IllegalArgumentException("Reminder interval too short");
        long at = start > now ? start : start + ((now - start) / interval + 1) * interval;
        return at == due ? at + interval : at;
    }
    static int eventId(String taskId, String due, String kind) {
        // Match the UTF-16 FNV hash in reminderPlan.ts; JSON supplies an unambiguous key.
        String value = org.json.JSONObject.quote(taskId) + "," + org.json.JSONObject.quote(due) + "," + org.json.JSONObject.quote(kind);
        int hash = 0x811c9dc5;
        for (char ch : ("[" + value + "]").toCharArray()) { hash ^= ch; hash *= 16777619; }
        return (int)(Integer.toUnsignedLong(hash) % 2147483646L) + 1;
    }
}
