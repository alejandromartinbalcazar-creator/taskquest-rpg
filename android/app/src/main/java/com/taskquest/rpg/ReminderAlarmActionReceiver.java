package com.taskquest.rpg;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import org.json.JSONObject;

/** Notification dismissal requires no activity or unlocked WebView. */
public class ReminderAlarmActionReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context, Intent intent) {
        int id = intent.getIntExtra("id", 0);
        JSONObject row = ReminderOverlayStore.find(context, id);
        if (row != null && ReminderOverlayStore.key(row).equals(intent.getStringExtra("key"))) ReminderOverlayStore.dismiss(context, id);
    }
}
