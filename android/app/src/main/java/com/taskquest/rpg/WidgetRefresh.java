package com.taskquest.rpg;

import android.appwidget.*;
import android.content.*;

final class WidgetRefresh {
    static String appearance(Context c, int id) {
        AppWidgetProviderInfo info = AppWidgetManager.getInstance(c).getAppWidgetInfo(id);
        String name = info == null ? "" : info.provider.getClassName();
        return name.contains("Minimal") ? "minimal" : name.contains("Aurora") ? "aurora" : "medieval";
    }
    static void one(Context c, int id) { new FocusMissionWidgetProvider().update(c, AppWidgetManager.getInstance(c), id); }
    static void all(Context c) {
        AppWidgetManager manager = AppWidgetManager.getInstance(c);
        for (Class<?> type : new Class<?>[]{FocusMissionWidgetProvider.class, FocusMissionMinimalWidgetProvider.class, FocusMissionAuroraWidgetProvider.class})
            for (int id : manager.getAppWidgetIds(new ComponentName(c, type))) one(c, id);
    }
}
