package com.taskquest.rpg;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;
import java.text.DateFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.Locale;

/** Base compartida para los tres aspectos del widget. Muestra siempre las tres misiones más urgentes. */
public class FocusMissionWidgetProvider extends AppWidgetProvider {
    protected int layoutId() { return R.layout.widget_focusmission_medieval; }
    protected String theme() { return "medieval"; }

    @Override public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) update(context, manager, id);
    }
    @Override public void onAppWidgetOptionsChanged(Context context, AppWidgetManager manager, int id, Bundle options) {
        update(context, manager, id);
    }

    protected void update(Context context, AppWidgetManager manager, int id) {
        RemoteViews views = new RemoteViews(context.getPackageName(), layoutId());
        ArrayList<WidgetTask> tasks = readTasks(context);
        views.setViewVisibility(R.id.widget_task_one, View.GONE); views.setViewVisibility(R.id.widget_task_one_due, View.GONE);
        views.setViewVisibility(R.id.widget_task_two, View.GONE); views.setViewVisibility(R.id.widget_task_two_due, View.GONE);
        views.setViewVisibility(R.id.widget_task_three, View.GONE); views.setViewVisibility(R.id.widget_task_three_due, View.GONE);
        Intent adapter = new Intent(context, WidgetTaskRemoteViewsService.class);
        adapter.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id); adapter.putExtra("theme", theme());
        adapter.setData(Uri.parse(adapter.toUri(Intent.URI_INTENT_SCHEME)));
        views.setRemoteAdapter(R.id.widget_list, adapter); views.setEmptyView(R.id.widget_list, R.id.widget_empty);
        views.setPendingIntentTemplate(R.id.widget_list, linkIntent(context, "tasks", id));
        views.setTextViewText(R.id.widget_empty, tasks.isEmpty() ? "Sin misiones pendientes. Buen descanso." : "");
        views.setViewVisibility(R.id.widget_empty, tasks.isEmpty() ? View.VISIBLE : View.GONE);
        views.setOnClickPendingIntent(R.id.widget_add, linkIntent(context, "add-task", id));
        views.setOnClickPendingIntent(R.id.widget_root, linkIntent(context, "tasks", id));
        manager.updateAppWidget(id, views);
        manager.notifyAppWidgetViewDataChanged(id, R.id.widget_list);
    }

    private PendingIntent linkIntent(Context context, String action, int id) {
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse("com.taskquest.rpg://widget?action=" + action));
        intent.setPackage(context.getPackageName());
        return PendingIntent.getActivity(context, id + action.hashCode(), intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private void bindRow(RemoteViews views, int titleId, int dueId, ArrayList<WidgetTask> tasks, int position) {
        if (position >= tasks.size()) { views.setViewVisibility(titleId, View.GONE); views.setViewVisibility(dueId, View.GONE); return; }
        WidgetTask task = tasks.get(position);
        views.setViewVisibility(titleId, View.VISIBLE); views.setViewVisibility(dueId, View.VISIBLE);
        views.setTextViewText(titleId, task.title);
        views.setTextViewText(dueId, dueLabel(task));
        int color = task.overdue ? Color.rgb(239, 68, 68) : Color.rgb(196, 181, 253);
        views.setTextColor(titleId, color); views.setTextColor(dueId, color);
    }

    private String dueLabel(WidgetTask task) {
        if (task.overdue) return "VENCIDA";
        long diff = task.due - System.currentTimeMillis();
        if (diff < 60 * 60 * 1000) return "Vence en menos de 1 h";
        if (diff < 24 * 60 * 60 * 1000) return "Vence hoy";
        return DateFormat.getDateTimeInstance(DateFormat.SHORT, DateFormat.SHORT, Locale.getDefault()).format(new Date(task.due));
    }

    private ArrayList<WidgetTask> readTasks(Context context) {
        ArrayList<WidgetTask> result = new ArrayList<>();
        String raw = context.getSharedPreferences(WidgetDataPlugin.PREFS, Context.MODE_PRIVATE).getString(WidgetDataPlugin.TASKS_KEY, "[]");
        try {
            JSONArray items = new JSONArray(raw);
            long now = System.currentTimeMillis();
            for (int i = 0; i < items.length(); i++) {
                JSONObject item = items.getJSONObject(i);
                if (item.optBoolean("completed", false)) continue;
                long due = parseDate(item.optString("dueDate", ""));
                result.add(new WidgetTask(item.optString("title", "Misión"), due, due > 0 && due < now));
            }
        } catch (Exception ignored) { }
        Collections.sort(result, new Comparator<WidgetTask>() { public int compare(WidgetTask a, WidgetTask b) {
            if (a.overdue != b.overdue) return a.overdue ? -1 : 1;
            return Long.compare(a.due, b.due);
        }});
        return result;
    }
    private long parseDate(String value) { try { return java.time.Instant.parse(value).toEpochMilli(); } catch (Exception ignored) { return Long.MAX_VALUE; } }
    private static class WidgetTask { String title; long due; boolean overdue; WidgetTask(String title, long due, boolean overdue) { this.title = title; this.due = due; this.overdue = overdue; } }
}
