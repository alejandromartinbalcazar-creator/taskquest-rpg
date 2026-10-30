package com.taskquest.rpg;

import android.app.KeyguardManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.PowerManager;
import androidx.core.content.ContextCompat;
import org.json.JSONObject;

public class ReminderOverlayReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context, Intent intent) {
        if (!"focusmission.reminder".equals(intent.getAction())) {
            ReminderOverlayStore.restore(context);
            return;
        }
        JSONObject row = ReminderOverlayStore.fire(context, intent.getIntExtra("id", -1));
        if (row == null || !ReminderOverlayStore.permitted(context) || MainActivity.isVisible) return;
        KeyguardManager keyguard = (KeyguardManager)context.getSystemService(Context.KEYGUARD_SERVICE);
        PowerManager power = (PowerManager)context.getSystemService(Context.POWER_SERVICE);
        if (keyguard.isKeyguardLocked() || !power.isInteractive()) return;
        try {
            ContextCompat.startForegroundService(context, new Intent(context, ReminderOverlayService.class).putExtra("id", row.optInt("id")));
        } catch (RuntimeException ignored) { /* Android restrictions: retain the local notification as fallback. */ }
    }
}
