package com.taskquest.rpg;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.provider.Settings;
import org.json.JSONArray;
import org.json.JSONObject;

/** Private copy of scheduled reminders. Never edits the player's web save. */
final class ReminderOverlayStore {
    static SharedPreferences prefs(Context c) { return c.getSharedPreferences("focusmission_overlay_v1", Context.MODE_PRIVATE); }
    static JSONArray read(Context c, String key) {
        try { return new JSONArray(prefs(c).getString(key, "[]")); } catch (Exception e) { return new JSONArray(); }
    }
    static boolean exact(Context c) {
        return Build.VERSION.SDK_INT < 31 || ((AlarmManager)c.getSystemService(Context.ALARM_SERVICE)).canScheduleExactAlarms();
    }
    static boolean enabled(Context c) { return prefs(c).getBoolean("enabled", false); }
    static boolean permitted(Context c) { return Build.VERSION.SDK_INT >= 26 && enabled(c) && Settings.canDrawOverlays(c) && exact(c); }
    static String key(JSONObject row) { return row.optInt("id") + ":" + row.optString("signature"); }
    static PendingIntent alarm(Context c, int id) {
        return PendingIntent.getBroadcast(c, id, new Intent(c, ReminderOverlayReceiver.class).setAction("focusmission.reminder").putExtra("id", id), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
    static synchronized void sync(Context c, JSONArray desired) {
        AlarmManager manager = (AlarmManager)c.getSystemService(Context.ALARM_SERVICE);
        JSONArray previous = read(c, "reminders");
        for (int i = 0; i < previous.length(); i++) {
            JSONObject row = previous.optJSONObject(i);
            if (row != null) manager.cancel(alarm(c, row.optInt("id")));
        }
        JSONArray next = new JSONArray();
        for (int i = 0; i < desired.length() && i < 450; i++) {
            JSONObject row = desired.optJSONObject(i);
            if (row == null || row.optInt("id") <= 0 || row.optString("taskId").isEmpty() || row.optString("dueDate").isEmpty()) continue;
            for (int j = 0; j < previous.length(); j++) {
                JSONObject old = previous.optJSONObject(j);
                if (old != null && key(old).equals(key(row)) && old.optBoolean("fired")) {
                    try { row.put("fired", true); } catch (Exception ignored) { }
                    break;
                }
            }
            next.put(row);
        }
        prefs(c).edit().putString("reminders", next.toString()).commit();
        restore(c);
        ReminderOverlayService.refresh();
    }
    static synchronized void restore(Context c) {
        if (!permitted(c)) return;
        AlarmManager manager = (AlarmManager)c.getSystemService(Context.ALARM_SERVICE);
        JSONArray rows = read(c, "reminders");
        for (int i = 0; i < rows.length(); i++) {
            JSONObject row = rows.optJSONObject(i);
            if (row == null || row.optBoolean("fired") || row.optLong("at") <= System.currentTimeMillis()) continue;
            try { manager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, row.optLong("at"), alarm(c, row.optInt("id"))); }
            catch (SecurityException ignored) { /* The ordinary notification remains scheduled. */ }
        }
    }
    static synchronized JSONObject find(Context c, int id) {
        JSONArray rows = read(c, "reminders");
        for (int i = 0; i < rows.length(); i++) {
            JSONObject row = rows.optJSONObject(i);
            if (row != null && row.optInt("id") == id) return row;
        }
        return null;
    }
    static synchronized JSONObject fire(Context c, int id) {
        JSONArray rows = read(c, "reminders");
        JSONObject result = null;
        for (int i = 0; i < rows.length(); i++) {
            JSONObject row = rows.optJSONObject(i);
            if (row != null && row.optInt("id") == id && !row.optBoolean("fired") && row.optLong("at") <= System.currentTimeMillis() + 1000) {
                result = row;
                try { row.put("fired", true); } catch (Exception ignored) { }
                break;
            }
        }
        prefs(c).edit().putString("reminders", rows.toString()).commit();
        return result;
    }
    static synchronized void enqueue(Context c, JSONObject row) {
        JSONArray actions = read(c, "actions");
        for (int i = 0; i < actions.length(); i++) if (key(row).equals(actions.optJSONObject(i).optString("key"))) return;
        try {
            actions.put(new JSONObject().put("key", key(row)).put("taskId", row.optString("taskId")).put("dueDate", row.optString("dueDate")));
            prefs(c).edit().putString("actions", actions.toString()).commit();
        } catch (Exception ignored) { }
    }
    static synchronized void acknowledge(Context c, JSONArray keys) {
        JSONArray old = read(c, "actions"), next = new JSONArray();
        for (int i = 0; i < old.length(); i++) {
            JSONObject row = old.optJSONObject(i); if (row == null) continue;
            boolean remove = false;
            for (int j = 0; j < keys.length(); j++) if (row.optString("key").equals(keys.optString(j))) remove = true;
            if (!remove) next.put(row);
        }
        prefs(c).edit().putString("actions", next.toString()).commit();
    }
}
