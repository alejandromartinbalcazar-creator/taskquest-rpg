package com.taskquest.rpg;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import androidx.core.content.ContextCompat;
import org.json.JSONObject;

public class ReminderOverlayReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context, Intent intent) {
        if (!"focusmission.reminder".equals(intent.getAction())) {
            ReminderOverlayStore.restore(context);
            return;
        }
        JSONObject row = ReminderOverlayStore.fire(context, intent.getIntExtra("id", -1));
        if (row == null) return;
        ReminderOverlayStore.event(context, "alarm_received", "");
        if (!ReminderOverlayStore.permitted(context)) { ReminderOverlayStore.event(context, "notifications_missing", ""); return; }
        try {
            ContextCompat.startForegroundService(context, new Intent(context, ReminderOverlayService.class).putExtra("id", row.optInt("id")));
        } catch (RuntimeException e) {
            ReminderAlarmNotice.post(context, row, true, true);
            ReminderOverlayStore.event(context, "service_blocked", e.getClass().getSimpleName());
        }
    }
}
