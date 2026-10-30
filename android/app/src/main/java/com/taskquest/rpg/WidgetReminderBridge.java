package com.taskquest.rpg;

import android.app.*;
import android.content.*;
import android.os.Build;
import com.capacitorjs.plugins.localnotifications.NotificationStorage;
import com.capacitorjs.plugins.localnotifications.TimedNotificationPublisher;
import org.json.*;

/** Cancel only this occurrence, including the normal Capacitor notification mode. */
final class WidgetReminderBridge {
    static void complete(Context c, JSONObject task, String nextDue) {
        String taskId = task.optString("id"), due = task.optString("dueDate");
        JSONArray nativeRows = ReminderOverlayStore.read(c, "reminders"), next = new JSONArray();
        for (int i = 0; i < nativeRows.length(); i++) {
            JSONObject row = nativeRows.optJSONObject(i); if (row == null) continue;
            if (taskId.equals(row.optString("taskId")) && due.equals(row.optString("dueDate"))) {
                ReminderOverlayStore.dismiss(c, row.optInt("id"));
            }
            else next.put(row);
        }
        // Rebuild from preferences, including a previously stopped series. No WebView needed.
        if (nextDue != null && !task.optString("reminderType", "none").equals("none")) try {
            long dueAt = java.time.Instant.parse(nextDue).toEpochMilli();
            next.put(followup(task, nextDue, "due", dueAt));
            String type = task.optString("reminderType");
            if ("constant".equals(type) && task.optInt("reminderVersion") == 2) {
                long interval = task.optLong("reminderIntervalMinutes", 30) * 60000L;
                if (interval != 900000 && interval != 1800000 && interval != 3600000) interval = 1800000;
                long start = dueAt - Math.max(1, task.optLong("reminderStartMinutes", 60)) * 60000L;
                next.put(followup(task, nextDue, "repeat", ReminderRules.next(start, interval, dueAt, System.currentTimeMillis()))
                    .put("startAt", start).put("dueAt", dueAt).put("intervalMs", interval));
            } else {
                int minutes = offset(task);
                if (minutes > 0) next.put(followup(task, nextDue, "advance", dueAt - minutes * 60000L));
            }
        } catch (Exception ignored) { }
        ReminderOverlayStore.sync(c, next);
        NotificationStorage storage = new NotificationStorage(c);
        for (String id : storage.getSavedNotificationIds()) {
            JSONObject record = storage.getSavedNotificationAsJSObject(id);
            JSONObject extra = record == null ? null : record.optJSONObject("extra");
            if (extra == null || !"focusmission-task-reminder".equals(extra.optString("source")) || !taskId.equals(extra.optString("taskId")) || (extra.has("dueDate") && !due.equals(extra.optString("dueDate")))) continue;
            try {
                int notificationId = Integer.parseInt(id);
                PendingIntent pending = PendingIntent.getBroadcast(c, notificationId, new Intent(c, TimedNotificationPublisher.class), PendingIntent.FLAG_NO_CREATE | (Build.VERSION.SDK_INT >= 31 ? PendingIntent.FLAG_MUTABLE : 0));
                if (pending != null) { ((AlarmManager)c.getSystemService(Context.ALARM_SERVICE)).cancel(pending); pending.cancel(); }
                ((NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE)).cancel(notificationId);
                storage.deleteNotification(id);
            } catch (RuntimeException ignored) { }
        }
    }
    private static JSONObject followup(JSONObject task, String due, String kind, long at) throws JSONException {
        return new JSONObject().put("id", ReminderRules.eventId(task.optString("id"), due, kind)).put("taskId", task.optString("id"))
            .put("dueDate", due).put("kind", kind).put("at", at).put("requestedAt", at)
            .put("title", task.optString("title")).put("body", task.optString("description", "Tu misión te espera."))
            .put("signature", "widget:" + task.optString("id") + ":" + due + ":" + kind);
    }
    private static int offset(JSONObject task) {
        switch (task.optString("reminderType")) {
            case "5_minutes_before": return 5;
            case "10_minutes_before": return 10;
            case "30_minutes_before": return 30;
            case "1_hour_before": return 60;
            case "1_day_before": return 1440;
            case "2_days_before": return 2880;
            case "3_days_before": return 4320;
            case "1_week_before": return 10080;
            case "custom": return task.optInt("reminderCustomMinutes", 30);
            default: return 0;
        }
    }
}
