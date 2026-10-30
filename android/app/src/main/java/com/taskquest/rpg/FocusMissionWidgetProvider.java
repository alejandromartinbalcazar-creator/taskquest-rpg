package com.taskquest.rpg;
import android.appwidget.*;
import android.content.Context;
import android.os.Bundle;

public class FocusMissionWidgetProvider extends AppWidgetProvider {
    protected int layoutId() { return R.layout.widget_dashboard; }
    protected String theme() { return "medieval"; }
    @Override public void onUpdate(Context c, AppWidgetManager m, int[] ids) { for (int id : ids) update(c, m, id); }
    @Override public void onAppWidgetOptionsChanged(Context c, AppWidgetManager m, int id, Bundle options) { update(c, m, id); }
    @Override public void onDeleted(Context c, int[] ids) { for (int id : ids) WidgetRepository.prefs(c).edit().remove("config_" + id).apply(); }
    protected void update(Context c, AppWidgetManager m, int id) {
        WidgetSettings s = WidgetRepository.settings(c, id, WidgetRefresh.appearance(c, id));
        if (!WidgetRepository.prefs(c).contains("config_" + id)) WidgetRepository.saveSettings(c, id, s);
        int height = m.getAppWidgetOptions(id).getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 300);
        m.updateAppWidget(id, WidgetRenderer.render(c, id, s, height));
        for (int list : new int[]{R.id.widget_list, R.id.widget_today_list, R.id.widget_overdue_list, R.id.widget_tomorrow_list}) m.notifyAppWidgetViewDataChanged(id, list);
    }
}
