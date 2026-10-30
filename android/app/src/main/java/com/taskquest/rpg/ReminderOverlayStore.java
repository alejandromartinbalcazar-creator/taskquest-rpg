package com.taskquest.rpg;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import androidx.core.app.NotificationManagerCompat;
import org.json.JSONArray;
import org.json.JSONObject;

/** Native scheduling survives a closed WebView; game rewards remain owned by React. */
final class ReminderOverlayStore {
    static final int TEST_ID = -7;
    static SharedPreferences prefs(Context c) { return c.getSharedPreferences("focusmission_overlay_v1", Context.MODE_PRIVATE); }
    static JSONArray read(Context c, String key) {
        try { return new JSONArray(prefs(c).getString(key, "[]")); } catch (Exception e) { return new JSONArray(); }
    }
    static boolean exact(Context c) { return Build.VERSION.SDK_INT < 31 || ((AlarmManager)c.getSystemService(Context.ALARM_SERVICE)).canScheduleExactAlarms(); }
    static boolean enabled(Context c) { return prefs(c).getBoolean("enabled", false); }
    static boolean permitted(Context c) { return Build.VERSION.SDK_INT >= 26 && enabled(c) && NotificationManagerCompat.from(c).areNotificationsEnabled(); }
    static boolean sound(Context c) { return prefs(c).getBoolean("sound", true); }
    static boolean vibration(Context c) { return prefs(c).getBoolean("vibration", true); }
    static int duration(Context c) { return ReminderDeliveryPolicy.duration(prefs(c).getInt("duration", 30)); }
    static String key(JSONObject row) { return row.optInt("id") + ":" + row.optString("signature"); }
    static synchronized void event(Context c, String code, String detail) {
        try { prefs(c).edit().putString("lastEvent", new JSONObject().put("code", code).put("at", System.currentTimeMillis()).put("detail", detail).toString()).commit(); }
        catch (Exception ignored) { }
    }
    static PendingIntent alarm(Context c, int id) {
        return PendingIntent.getBroadcast(c, id, new Intent(c, ReminderOverlayReceiver.class).setAction("focusmission.reminder").putExtra("id", id), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
    private static boolean sameOccurrence(JSONObject a, JSONObject b) {
        return a.optString("taskId").equals(b.optString("taskId")) && a.optString("dueDate").equals(b.optString("dueDate"))
            && a.optLong("requestedAt", a.optLong("at")) == b.optLong("requestedAt", b.optLong("at"));
    }
    static synchronized void sync(Context c, JSONArray desired) {
        AlarmManager manager = (AlarmManager)c.getSystemService(Context.ALARM_SERVICE);
        JSONArray previous = read(c, "reminders"), next = new JSONArray();
        for (int i = 0; i < desired.length() && i < 450; i++) {
            JSONObject row = desired.optJSONObject(i);
            if (row == null || row.optInt("id") <= 0 || row.optString("taskId").isEmpty() || row.optString("dueDate").isEmpty()) continue;
            try {
                row.put("requestedAt", row.optLong("requestedAt", row.optLong("at")));
                for (int j = 0; j < previous.length(); j++) {
                    JSONObject old = previous.optJSONObject(j);
                    if (old != null && sameOccurrence(old, row)) {
                        row.put("fired", old.optBoolean("fired")).put("dismissed", old.optBoolean("dismissed"));
                        if (old.optLong("at") > System.currentTimeMillis()) row.put("at", old.optLong("at"));
                        break;
                    }
                }
                if (row.optBoolean("constant") && !row.optBoolean("fired") && row.optLong("at") <= System.currentTimeMillis()) row.put("at", System.currentTimeMillis() + 60000);
            } catch (Exception ignored) { }
            next.put(row);
        }
        for (int i = 0; i < previous.length(); i++) {
            JSONObject old = previous.optJSONObject(i); if (old == null) continue;
            manager.cancel(alarm(c, old.optInt("id")));
            if (enabled(c) && old.optInt("id") == TEST_ID && !old.optBoolean("dismissed") && old.optLong("at") > System.currentTimeMillis() - 120000) { next.put(old); continue; }
            boolean keep = false;
            for (int j = 0; j < next.length(); j++) if (key(old).equals(key(next.optJSONObject(j)))) keep = true;
            if (!keep || !enabled(c)) { ReminderAlarmNotice.cancel(c, old.optInt("id")); ReminderAlarmActivity.close(old.optInt("id")); }
        }
        prefs(c).edit().putString("reminders", next.toString()).commit();
        restore(c); ReminderOverlayService.refresh();
    }
    static synchronized void restore(Context c) {
        JSONArray armed = new JSONArray();
        prefs(c).edit().putString("armed", "[]").commit();
        if (!permitted(c)) return;
        AlarmManager manager = (AlarmManager)c.getSystemService(Context.ALARM_SERVICE);
        JSONArray rows = read(c, "reminders");
        for (int i = 0; i < rows.length(); i++) {
            JSONObject row = rows.optJSONObject(i);
            if (row == null || row.optBoolean("fired") || row.optLong("at") <= System.currentTimeMillis()) continue;
            try {
                if (exact(c)) manager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, row.optLong("at"), alarm(c, row.optInt("id")));
                else manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, row.optLong("at"), alarm(c, row.optInt("id")));
                armed.put(row.optInt("id"));
            } catch (RuntimeException e) { event(c, "schedule_error", e.getClass().getSimpleName()); }
        }
        prefs(c).edit().putString("armed", armed.toString()).commit();
    }
    private static boolean armed(Context c, int id) {
        JSONArray armed = read(c, "armed");
        for (int i = 0; i < armed.length(); i++) if (armed.optInt(i) == id) return true;
        return false;
    }
    static synchronized JSONArray scheduledTaskIds(Context c) {
        JSONArray ids = new JSONArray(), rows = read(c, "reminders");
        if (!permitted(c)) return ids;
        java.util.HashSet<Integer> armedIds = new java.util.HashSet<>();
        JSONArray armed = read(c, "armed");
        for (int i = 0; i < armed.length(); i++) armedIds.add(armed.optInt(i));
        for (int i = 0; i < rows.length(); i++) {
            JSONObject row = rows.optJSONObject(i);
            if (row != null && !row.optBoolean("test") && !row.optBoolean("fired") && row.optLong("at") > System.currentTimeMillis() && armedIds.contains(row.optInt("id"))) ids.put(row.optString("taskId"));
        }
        return ids;
    }
    static synchronized JSONObject find(Context c, int id) {
        JSONArray rows = read(c, "reminders");
        for (int i = 0; i < rows.length(); i++) { JSONObject row = rows.optJSONObject(i); if (row != null && row.optInt("id") == id) return row; }
        return null;
    }
    static synchronized JSONObject fire(Context c, int id) {
        JSONArray rows = read(c, "reminders"); JSONObject result = null;
        for (int i = 0; i < rows.length(); i++) {
            JSONObject row = rows.optJSONObject(i);
            if (row != null && row.optInt("id") == id && !row.optBoolean("fired") && row.optLong("at") <= System.currentTimeMillis() + 1000) {
                result = row; try { row.put("fired", true); } catch (Exception ignored) { } break;
            }
        }
        prefs(c).edit().putString("reminders", rows.toString()).commit(); return result;
    }
    static synchronized void dismiss(Context c, int id) {
        JSONArray rows = read(c, "reminders");
        for (int i = 0; i < rows.length(); i++) {
            JSONObject row = rows.optJSONObject(i);
            if (row != null && row.optInt("id") == id) try { row.put("dismissed", true); } catch (Exception ignored) { }
        }
        prefs(c).edit().putString("reminders", rows.toString()).commit();
        ReminderAlarmNotice.cancel(c, id); ReminderOverlayService.dismiss(id); ReminderAlarmActivity.close(id);
    }
    static synchronized void test(Context c) throws Exception {
        JSONArray rows = read(c, "reminders"), next = new JSONArray();
        for (int i = 0; i < rows.length(); i++) { JSONObject row = rows.optJSONObject(i); if (row != null && row.optInt("id") != TEST_ID) next.put(row); }
        long at = System.currentTimeMillis() + 10000;
        next.put(new JSONObject().put("id", TEST_ID).put("taskId", "__reminder_test__").put("dueDate", String.valueOf(at)).put("signature", String.valueOf(at))
            .put("title", "Tu recordatorio de prueba").put("body", "Así se verá una misión pendiente. Esta prueba no modifica tu progreso.").put("at", at).put("test", true));
        prefs(c).edit().putString("reminders", next.toString()).commit(); restore(c);
        if (!armed(c, TEST_ID)) throw new IllegalStateException("Android no aceptó la alarma de prueba");
        event(c, "test_scheduled", "");
    }
    static synchronized void enqueue(Context c, JSONObject row) {
        if (row.optBoolean("test")) return;
        JSONArray actions = read(c, "actions");
        for (int i = 0; i < actions.length(); i++) {
            JSONObject previous = actions.optJSONObject(i); if (previous != null && key(row).equals(previous.optString("key"))) return;
        }
        try { actions.put(new JSONObject().put("key", key(row)).put("taskId", row.optString("taskId")).put("dueDate", row.optString("dueDate")));
            prefs(c).edit().putString("actions", actions.toString()).commit(); } catch (Exception ignored) { }
    }
    static synchronized void acknowledge(Context c, JSONArray keys) {
        JSONArray old = read(c, "actions"), next = new JSONArray();
        for (int i = 0; i < old.length(); i++) {
            JSONObject row = old.optJSONObject(i); if (row == null) continue; boolean remove = false;
            for (int j = 0; j < keys.length(); j++) if (row.optString("key").equals(keys.optString(j))) remove = true;
            if (!remove) next.put(row);
        }
        prefs(c).edit().putString("actions", next.toString()).commit();
    }
}
