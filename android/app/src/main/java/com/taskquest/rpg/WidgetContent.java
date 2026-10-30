package com.taskquest.rpg;

import android.content.Context;
import org.json.JSONObject;
import java.time.*;
import java.util.*;

final class WidgetContent {
    final ArrayList<JSONObject> all = new ArrayList<>();
    final Map<String, ArrayList<JSONObject>> groups = new HashMap<>();
    final WidgetSettings settings; final int[] counts;
    WidgetContent(Context c, WidgetSettings settings, int height) {
        this.settings = settings;
        for (String section : new String[]{"today", "overdue", "tomorrow", "later"}) groups.put(section, new ArrayList<>());
        Instant now = Instant.now(); ZoneId zone = ZoneId.systemDefault();
        for (JSONObject task : WidgetRepository.projected(c)) if (!task.optBoolean("completed")) { all.add(task); groups.get(WidgetRules.section(task.optString("dueDate"), now, zone)).add(task); }
        Comparator<JSONObject> comparator = (a, b) -> {
            Instant ai = WidgetRules.instant(a.optString("dueDate")), bi = WidgetRules.instant(b.optString("dueDate"));
            boolean ao = ai != null && ai.isBefore(now), bo = bi != null && bi.isBefore(now);
            if (ao != bo) return settings.overdueFirst ? (ao ? -1 : 1) : (ao ? 1 : -1);
            int order = Comparator.nullsLast(Comparator.<Instant>naturalOrder()).compare(ai, bi);
            if (settings.sort.equals("descending")) order = -order;
            return order != 0 ? order : a.optString("id").compareTo(b.optString("id"));
        };
        all.sort(comparator); for (ArrayList<JSONObject> list : groups.values()) list.sort(comparator);
        counts = WidgetRules.allocation(height, settings.rowHeight(), groups.get("today").size(), groups.get("overdue").size(), groups.get("tomorrow").size(), settings.limits);
    }
    static int index(String section) { return section.equals("today") ? 0 : section.equals("overdue") ? 1 : 2; }
    static String label(String section) { return section.equals("today") ? "Hoy" : section.equals("overdue") ? "Vencidas" : "Mañana"; }
    ArrayList<JSONObject> selected(String section) {
        ArrayList<JSONObject> list = groups.get(section);
        return new ArrayList<>(list.subList(0, Math.min(list.size(), counts[index(section)])));
    }
    ArrayList<JSONObject> rows(String section) {
        if (section.equals("compact")) return all;
        if (!section.equals("mixed")) return selected(section);
        ArrayList<JSONObject> result = new ArrayList<>();
        String first = "today";
        for (String ordered : settings.order) if (!ordered.equals("tomorrow")) { first = ordered; break; }
        String second = first.equals("today") ? "overdue" : "today";
        ArrayList<JSONObject> a = selected(first), b = selected(second);
        for (int i = 0; i < Math.max(a.size(), b.size()); i++) { if (i < a.size()) result.add(a.get(i)); if (i < b.size()) result.add(b.get(i)); }
        return result;
    }
}
