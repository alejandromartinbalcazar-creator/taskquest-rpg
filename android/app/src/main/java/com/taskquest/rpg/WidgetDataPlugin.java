package com.taskquest.rpg;

import android.content.Context;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Puente pequeño: el widget nativo no puede leer directamente localStorage del WebView. */
@CapacitorPlugin(name = "WidgetData")
public class WidgetDataPlugin extends Plugin {
    static final String PREFS = "focusmission_widget";
    static final String TASKS_KEY = "tasks";

    @PluginMethod
    public void syncTasks(PluginCall call) {
        String tasks = call.getString("tasks", "[]");
        getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit().putString(TASKS_KEY, tasks).apply();
        AppWidgetManager manager = AppWidgetManager.getInstance(getContext());
        refresh(manager, FocusMissionWidgetProvider.class, new FocusMissionWidgetProvider());
        refresh(manager, FocusMissionMinimalWidgetProvider.class, new FocusMissionMinimalWidgetProvider());
        refresh(manager, FocusMissionAuroraWidgetProvider.class, new FocusMissionAuroraWidgetProvider());
        call.resolve();
    }

    private void refresh(AppWidgetManager manager, Class<?> type, FocusMissionWidgetProvider provider) {
        int[] ids = manager.getAppWidgetIds(new ComponentName(getContext(), type));
        provider.onUpdate(getContext(), manager, ids);
    }
}
