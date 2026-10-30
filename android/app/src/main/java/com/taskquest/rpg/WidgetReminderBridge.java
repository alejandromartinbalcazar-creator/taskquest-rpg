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
                // Relative native alarms can follow the locally projected habit
                // without waiting for the WebView/reward reconciliation.
                if (nextDue != null && !task.optString("reminderType").equals("absolute")) try {
                    long offset = java.time.Instant.parse(due).toEpochMilli() - row.optLong("requestedAt", row.optLong("at"));
                    JSONObject followup = new JSONObject(row.toString());
                    long at = java.time.Instant.parse(nextDue).toEpochMilli() - offset;
                    followup.put("dueDate", nextDue).put("at", at).put("requestedAt", at).put("fired", false).put("dismissed", false)
                        .put("signature", row.optString("signature") + ":widget:" + nextDue);
                    next.put(followup);
                } catch (Exception ignored) { }
            }
            else next.put(row);
        }
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
}
