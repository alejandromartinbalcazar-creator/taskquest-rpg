package com.taskquest.rpg;

import android.appwidget.*;
import android.content.*;
import android.widget.Toast;

public class WidgetActionReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context c, Intent intent) {
        int id = intent.getIntExtra("widgetId", -1);
        AppWidgetProviderInfo info = AppWidgetManager.getInstance(c).getAppWidgetInfo(id);
        if (info == null || !c.getPackageName().equals(info.provider.getPackageName())) return;
        String source = intent.getStringExtra("source");
        if (source == null || !source.equals(WidgetRepository.source(c))) return;
        String action = intent.getStringExtra("action"), taskId = intent.getStringExtra("taskId");
        if ("complete".equals(action)) {
            boolean completed = WidgetRepository.complete(c, source, taskId, intent.getStringExtra("dueDate"));
            Toast.makeText(c, completed ? "Misión realizada. Recompensas pendientes de guardar en FocusMission." : "La misión cambió o hay acciones pendientes. Abre FocusMission para actualizar.", Toast.LENGTH_SHORT).show();
            WidgetRefresh.all(c);
        } else if ("edit-task".equals(action)) c.startActivity(WidgetRenderer.link(c, "edit-task", taskId, null));
    }
}
