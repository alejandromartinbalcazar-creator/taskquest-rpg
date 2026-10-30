package com.taskquest.rpg;

import android.app.*;
import android.appwidget.*;
import android.content.*;
import android.content.res.Configuration;
import android.net.Uri;
import android.os.Build;
import android.view.View;
import android.widget.RemoteViews;
import org.json.JSONObject;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;

final class WidgetRenderer {
    static boolean dark(Context c, WidgetSettings s) { return !s.appearance.equals("minimal") || s.palette.equals("dark") || (s.palette.equals("auto") && (c.getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES); }
    static int text(Context c, WidgetSettings s) { return dark(c, s) ? 0xFFF1F1F1 : 0xFF202326; }
    static int muted(Context c, WidgetSettings s) { return dark(c, s) ? 0xFFB0B4B8 : 0xFF59616A; }
    static Intent link(Context c, String action, String taskId, String section) {
        Uri.Builder uri = Uri.parse("com.taskquest.rpg://widget").buildUpon().appendQueryParameter("action", action);
        if (taskId != null) uri.appendQueryParameter("taskId", taskId);
        if (section != null) uri.appendQueryParameter("section", section);
        return new Intent(Intent.ACTION_VIEW, uri.build()).setClass(c, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
    }
    private static PendingIntent open(Context c, int id, String action, String section) { return PendingIntent.getActivity(c, Objects.hash(id, action, section), link(c, action, null, section), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE); }
    private static void adapter(Context c, RemoteViews v, int listId, int id, String section) {
        Intent intent = new Intent(c, WidgetTaskRemoteViewsService.class).putExtra("widgetId", id).putExtra("section", section)
            .setData(Uri.parse("focusmission-widget://" + id + "/" + section));
        v.setRemoteAdapter(listId, intent);
        Intent template = new Intent(c, WidgetActionReceiver.class).setAction("com.taskquest.rpg.WIDGET_ROW").putExtra("widgetId", id)
            .setData(Uri.parse("focusmission-widget://action/" + id + "/" + section));
        v.setPendingIntentTemplate(listId, PendingIntent.getBroadcast(c, Objects.hash(id, section), template,
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 31 ? PendingIntent.FLAG_MUTABLE : 0)));
    }
    static RemoteViews render(Context c, int id, WidgetSettings s, int height) {
        WidgetContent content = new WidgetContent(c, s, height);
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_dashboard);
        int color = text(c, s), secondary = muted(c, s);
        int background = s.appearance.equals("medieval") ? R.drawable.widget_panel_medieval : s.appearance.equals("aurora") ? R.drawable.widget_panel_aurora : dark(c, s) ? R.drawable.widget_panel_dark : R.drawable.widget_panel_light;
        v.setInt(R.id.widget_root, "setBackgroundResource", background);
        for (int view : new int[]{R.id.widget_heading, R.id.widget_add, R.id.widget_menu}) v.setTextColor(view, color);
        for (int view : new int[]{R.id.widget_empty, R.id.widget_pending, R.id.widget_tomorrow_summary, R.id.widget_summary_today, R.id.widget_summary_overdue}) v.setTextColor(view, secondary);
        v.setOnClickPendingIntent(R.id.widget_heading, open(c, id, "tasks", null));
        v.setOnClickPendingIntent(R.id.widget_add, open(c, id, "add-task", null));
        Intent config = new Intent(c, WidgetConfigurationActivity.class).putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id).putExtra("menu", true).setData(Uri.parse("focusmission-widget://config/" + id));
        v.setOnClickPendingIntent(R.id.widget_menu, PendingIntent.getActivity(c, id, config, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
        boolean compact = s.preset.equals("compact"), small = height < 320;
        v.setViewVisibility(R.id.widget_sections, !compact && !small ? View.VISIBLE : View.GONE);
        v.setViewVisibility(R.id.widget_list, compact || (small && height >= 150) ? View.VISIBLE : View.GONE);
        v.setViewVisibility(R.id.widget_summary_bar, !compact && small ? View.VISIBLE : View.GONE);
        v.removeAllViews(R.id.widget_sections);
        if (compact || small) {
            adapter(c, v, R.id.widget_list, id, compact ? "compact" : "mixed");
            for (String section : new String[]{"today", "overdue"}) {
                int count = content.groups.get(section).size(), shown = content.selected(section).size();
                int view = section.equals("today") ? R.id.widget_summary_today : R.id.widget_summary_overdue;
                v.setTextViewText(view, WidgetContent.label(section) + " (" + count + ")" + (count > shown ? " · +" + (count - shown) : ""));
                v.setOnClickPendingIntent(view, open(c, id, "section", section));
                v.setViewVisibility(view, s.limits[WidgetContent.index(section)] > 0 && (count > 0 || s.showEmpty) ? View.VISIBLE : View.GONE);
            }
        } else {
            for (String section : s.order) {
                int index = WidgetContent.index(section), count = content.groups.get(section).size(), shown = content.selected(section).size();
                if (s.limits[index] == 0 || (count == 0 && !s.showEmpty)) continue;
                boolean today = section.equals("today"), overdue = section.equals("overdue");
                int layout = today ? R.layout.widget_group_today : overdue ? R.layout.widget_group_overdue : R.layout.widget_group_tomorrow;
                int header = today ? R.id.widget_today_header : overdue ? R.id.widget_overdue_header : R.id.widget_tomorrow_header;
                int list = today ? R.id.widget_today_list : overdue ? R.id.widget_overdue_list : R.id.widget_tomorrow_list;
                RemoteViews group = new RemoteViews(c.getPackageName(), layout);
                group.setTextViewText(header, WidgetContent.label(section) + " (" + count + ")" + (!today && !overdue && count > shown ? " · +" + (count - shown) + " más" : ""));
                group.setTextColor(header, secondary); group.setOnClickPendingIntent(header, open(c, id, "section", section)); adapter(c, group, list, id, section);
                if (today || overdue) {
                    int more = today ? R.id.widget_today_more : R.id.widget_overdue_more;
                    group.setTextViewText(more, count > shown ? "+" + (count - shown) + " más" : ""); group.setTextColor(more, secondary);
                    group.setViewVisibility(more, count > shown ? View.VISIBLE : View.GONE); group.setOnClickPendingIntent(more, open(c, id, "section", section));
                }
                v.addView(R.id.widget_sections, group);
            }
        }
        int tomorrow = content.groups.get("tomorrow").size();
        v.setViewVisibility(R.id.widget_tomorrow_summary, !compact && small && s.limits[2] > 0 && (tomorrow > 0 || s.showEmpty) ? View.VISIBLE : View.GONE);
        v.setTextViewText(R.id.widget_tomorrow_summary, "Mañana · " + tomorrow + " tareas"); v.setOnClickPendingIntent(R.id.widget_tomorrow_summary, open(c, id, "section", "tomorrow"));
        int selected = compact ? content.all.size() : content.selected("today").size() + content.selected("overdue").size() + content.selected("tomorrow").size();
        v.setViewVisibility(R.id.widget_empty, selected == 0 ? View.VISIBLE : View.GONE);
        if (!compact && small && content.groups.get("today").isEmpty() && content.groups.get("overdue").isEmpty() && !s.showEmpty) v.setViewVisibility(R.id.widget_summary_bar, View.GONE);
        v.setTextViewText(R.id.widget_empty, content.all.isEmpty() ? "Sin pendientes. Pulsa + para crear una misión." : "Sin tareas en estos grupos. Toca Misiones para ver todas.");
        v.setOnClickPendingIntent(R.id.widget_empty, open(c, id, "tasks", null));
        int pending = WidgetRepository.pendingCount(c); v.setViewVisibility(R.id.widget_pending, pending > 0 && height >= 190 ? View.VISIBLE : View.GONE);
        if (pending > 0 && height < 190) { v.setTextViewText(R.id.widget_heading, "Misiones · ⟳"); v.setContentDescription(R.id.widget_heading, pending + " acciones pendientes de guardar en FocusMission"); }
        v.setTextViewText(R.id.widget_pending, pending + " completada(s) · abre FocusMission para guardar recompensas");
        return v;
    }
    static Intent rowAction(Context c, JSONObject task, String action) {
        return new Intent().putExtra("action", action).putExtra("taskId", task.optString("id")).putExtra("dueDate", task.optString("dueDate")).putExtra("source", task.optString("_widgetSource", WidgetRepository.source(c)));
    }
    static RemoteViews row(Context c, JSONObject task, WidgetSettings s) {
        RemoteViews row = new RemoteViews(c.getPackageName(), R.layout.widget_mission_row);
        row.setTextViewText(R.id.widget_row_title, task.optString("title", "Misión"));
        row.setTextColor(R.id.widget_row_title, text(c, s)); row.setTextColor(R.id.widget_row_check, muted(c, s));
        row.setInt(R.id.widget_row_root, "setMinimumHeight", ReminderCard.dp(c, s.rowHeight()));
        row.setTextViewText(R.id.widget_row_check, "☐"); row.setContentDescription(R.id.widget_row_check, "Completar " + task.optString("title"));
        Instant at = WidgetRules.instant(task.optString("dueDate")); String due = "Revisar fecha";
        if (at != null) {
            ZonedDateTime local = at.atZone(ZoneId.systemDefault());
            due = local.toLocalDate().equals(LocalDate.now()) ? android.text.format.DateFormat.getTimeFormat(c).format(Date.from(at)) : local.format(DateTimeFormatter.ofPattern("d MMM", Locale.getDefault()));
        }
        row.setTextViewText(R.id.widget_row_due, due); row.setTextColor(R.id.widget_row_due, at != null && at.isBefore(Instant.now()) ? 0xFFEF6464 : muted(c, s));
        row.setOnClickFillInIntent(R.id.widget_row_title, rowAction(c, task, "edit-task")); row.setOnClickFillInIntent(R.id.widget_row_due, rowAction(c, task, "edit-task"));
        row.setOnClickFillInIntent(R.id.widget_row_check, rowAction(c, task, "complete")); return row;
    }
}
