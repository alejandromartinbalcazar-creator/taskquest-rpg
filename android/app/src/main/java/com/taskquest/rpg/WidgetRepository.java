package com.taskquest.rpg;

import android.content.*;
import org.json.*;
import java.time.*;
import java.util.*;

final class WidgetRepository {
    static android.content.SharedPreferences prefs(Context c) { return c.getSharedPreferences(WidgetDataPlugin.PREFS, 0); }
    static JSONArray array(Context c, String key) { try { return new JSONArray(prefs(c).getString(key, "[]")); } catch (Exception e) { return new JSONArray(); } }
    static String source(Context c) { return prefs(c).getString("source", "device"); }
    static WidgetSettings settings(Context c, int id, String fallback) {
        WidgetSettings s = new WidgetSettings(); s.appearance = fallback;
        try {
            JSONObject j = new JSONObject(prefs(c).getString("config_" + id, "{}"));
            s.preset = j.optString("preset", s.preset); s.appearance = j.optString("appearance", s.appearance);
            s.palette = j.optString("palette", s.palette); s.density = j.optString("density", s.density); s.sort = j.optString("sort", s.sort);
            s.overdueFirst = j.optBoolean("overdueFirst", true); s.showEmpty = j.optBoolean("showEmpty");
            JSONArray order = j.optJSONArray("order"), limits = j.optJSONArray("limits");
            if (order != null && order.length() == 3) {
                Set<String> seen = new HashSet<>();
                for (int i = 0; i < 3; i++) seen.add(order.optString(i));
                if (seen.containsAll(Arrays.asList("today", "overdue", "tomorrow"))) for (int i = 0; i < 3; i++) s.order[i] = order.optString(i);
            }
            if (limits != null) for (int i = 0; i < 3; i++) s.limits[i] = WidgetSettings.limit(limits.optInt(i, s.limits[i]));
        } catch (Exception ignored) { }
        return s;
    }
    static void saveSettings(Context c, int id, WidgetSettings s) {
        try {
            JSONObject j = new JSONObject().put("version", 1).put("preset", s.preset).put("appearance", s.appearance).put("palette", s.palette)
                .put("density", s.density).put("sort", s.sort).put("overdueFirst", s.overdueFirst).put("showEmpty", s.showEmpty)
                .put("order", new JSONArray(Arrays.asList(s.order))).put("limits", new JSONArray().put(s.limits[0]).put(s.limits[1]).put(s.limits[2]));
            prefs(c).edit().putString("config_" + id, j.toString()).apply();
        } catch (Exception ignored) { }
    }
    static synchronized void sync(Context c, String source, JSONArray tasks) {
        prefs(c).edit().putString("source", source).putString(WidgetDataPlugin.TASKS_KEY, tasks.toString()).commit();
    }
    static synchronized ArrayList<JSONObject> projected(Context c) {
        JSONArray base = array(c, WidgetDataPlugin.TASKS_KEY), actions = array(c, "actions");
        ArrayList<JSONObject> result = new ArrayList<>();
        for (int i = 0; i < base.length(); i++) { JSONObject row = base.optJSONObject(i); if (row != null) result.add(row); }
        for (int i = 0; i < actions.length(); i++) {
            JSONObject action = actions.optJSONObject(i);
            if (action == null || action.optBoolean("settled") || !source(c).equals(action.optString("source"))) continue;
            for (JSONObject task : result) if (matches(task, action.optString("taskId"), action.optString("dueDate"))) apply(task, action);
        }
        for (JSONObject task : result) try { task.put("_widgetSource", source(c)); } catch (Exception ignored) { }
        return result;
    }
    static boolean matches(JSONObject task, String id, String due) { return !task.optBoolean("completed") && id.equals(task.optString("id")) && due.equals(task.optString("dueDate")); }
    private static void apply(JSONObject task, JSONObject action) {
        try {
            String next = action.isNull("nextDueDate") ? "" : action.optString("nextDueDate", "");
            if (next.isEmpty()) task.put("completed", true).put("completedAt", action.optString("completedAt"));
            else {
                task.put("dueDate", next).put("completed", false);
                if (task.optString("reminderType").equals("absolute")) task.put("reminderType", "none").remove("reminderAt");
            }
        } catch (Exception ignored) { }
    }
    static synchronized boolean complete(Context c, String source, String id, String due) {
        if (!source(c).equals(source)) return false;
        JSONObject task = null;
        for (JSONObject item : projected(c)) if (matches(item, id, due)) { task = item; break; }
        if (task == null) return false;
        JSONArray actions = array(c, "actions"); int pending = 0;
        for (int i = 0; i < actions.length(); i++) if (!actions.optJSONObject(i).optBoolean("settled")) pending++;
        if (pending >= 500) return false; // Keep existing actions; never silently drop offline work.
        try {
            Instant now = Instant.now(); JSONArray days = task.optJSONArray("recurrenceDays"); int[] selected = new int[days == null ? 0 : days.length()];
            for (int i = 0; i < selected.length; i++) selected[i] = days.optInt(i);
            String next = task.optBoolean("isHonorDebt") ? null : WidgetRules.next(due, task.optString("recurrence"), selected, now, ZoneId.systemDefault());
            JSONObject action = new JSONObject().put("key", source + ":" + UUID.randomUUID()).put("source", source).put("taskId", id).put("dueDate", due)
                .put("completedAt", WidgetRules.iso(now)).put("nextDueDate", next == null ? JSONObject.NULL : next).put("settled", false);
            actions.put(action);
            if (!prefs(c).edit().putString("actions", actions.toString()).commit()) return false;
            WidgetReminderBridge.cancel(c, id, due);
            return true;
        } catch (Exception e) { return false; }
    }
    static synchronized JSONArray actions(Context c, String source) {
        JSONArray all = array(c, "actions"), result = new JSONArray();
        for (int i = 0; i < all.length(); i++) { JSONObject a = all.optJSONObject(i); if (a != null && source.equals(a.optString("source"))) result.put(a); }
        return result;
    }
    static synchronized void acknowledge(Context c, String source, JSONArray keys, JSONArray tasks) {
        if (!source(c).equals(source)) return;
        JSONArray actions = array(c, "actions");
        for (int i = 0; i < actions.length(); i++) {
            JSONObject action = actions.optJSONObject(i); if (action == null || !source.equals(action.optString("source"))) continue;
            for (int j = 0; j < keys.length(); j++) if (keys.optString(j).equals(action.optString("key"))) try { action.put("settled", true); } catch (Exception ignored) { }
        }
        prefs(c).edit().putString("actions", actions.toString()).putString(WidgetDataPlugin.TASKS_KEY, tasks.toString()).commit();
    }
    static int pendingCount(Context c) {
        int count = 0; JSONArray actions = actions(c, source(c));
        for (int i = 0; i < actions.length(); i++) if (!actions.optJSONObject(i).optBoolean("settled")) count++;
        return count;
    }
}
