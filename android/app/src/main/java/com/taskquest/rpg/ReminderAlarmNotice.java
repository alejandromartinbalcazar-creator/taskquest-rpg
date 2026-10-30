package com.taskquest.rpg;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import org.json.JSONObject;

final class ReminderAlarmNotice {
    static final String TAG = "focusmission-mission-alarm";
    static final String ALARM_CHANNEL = "focusmission-mission-alarm-v1";
    static String ordinaryChannel(Context c) {
        return "focusmission-reminder-v1-" + (ReminderOverlayStore.sound(c) ? "sound" : "silent") + (ReminderOverlayStore.vibration(c) ? "-vibrate" : "-still");
    }
    static void channels(Context c) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager manager = (NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE);
        NotificationChannel alarm = new NotificationChannel(ALARM_CHANNEL, "Alarmas de misiones", NotificationManager.IMPORTANCE_HIGH);
        alarm.setDescription("Pantalla de alarma. La señal se configura en FocusMission.");
        alarm.setSound(null, null); alarm.enableVibration(false); manager.createNotificationChannel(alarm);
        for (boolean sound : new boolean[]{false, true}) for (boolean vibration : new boolean[]{false, true}) {
            String id = "focusmission-reminder-v1-" + (sound ? "sound" : "silent") + (vibration ? "-vibrate" : "-still");
            NotificationChannel channel = new NotificationChannel(id, "Misiones · " + (sound ? "con sonido" : "sin sonido") + (vibration ? " y vibración" : ""), NotificationManager.IMPORTANCE_HIGH);
            channel.setSound(sound ? RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION) : null,
                new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION).build());
            channel.enableVibration(vibration);
            if (vibration) channel.setVibrationPattern(new long[]{0, 200, 150, 200});
            manager.createNotificationChannel(channel);
        }
    }
    static boolean fullScreenAllowed(Context c) {
        return Build.VERSION.SDK_INT < 34 || ((NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE)).canUseFullScreenIntent();
    }
    static boolean channelReady(Context c) {
        channels(c);
        return Build.VERSION.SDK_INT >= 26 && ((NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE)).getNotificationChannel(ALARM_CHANNEL).getImportance() >= NotificationManager.IMPORTANCE_HIGH;
    }
    static Intent openIntent(Context c, JSONObject row, boolean done) {
        Intent intent = new Intent(c, ReminderAlarmActivity.class).setData(Uri.parse("focusmission-reminder://" + (done ? "done/" : "view/") + row.optInt("id")))
            .putExtra("id", row.optInt("id")).putExtra("key", ReminderOverlayStore.key(row)).putExtra("done", done)
            .putExtra("openDetail", !done && !ReminderOverlayStore.enabled(c))
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return intent;
    }
    static PendingIntent open(Context c, JSONObject row, boolean done) {
        return PendingIntent.getActivity(c, row.optInt("id"), openIntent(c, row, done), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
    static void post(Context c, JSONObject row, boolean fullScreen, boolean systemSignal) {
        channels(c);
        Intent dismiss = new Intent(c, ReminderAlarmActionReceiver.class).setData(Uri.parse("focusmission-reminder://close/" + row.optInt("id")))
            .putExtra("id", row.optInt("id")).putExtra("key", ReminderOverlayStore.key(row));
        PendingIntent close = PendingIntent.getBroadcast(c, row.optInt("id"), dismiss, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder builder = new Notification.Builder(c, systemSignal ? ordinaryChannel(c) : ALARM_CHANNEL)
            .setSmallIcon(R.drawable.ic_mission_reminder).setContentTitle(row.optString("title")).setContentText(row.optString("body"))
            .setStyle(new Notification.BigTextStyle().bigText(row.optString("body"))).setCategory(Notification.CATEGORY_ALARM)
            .setVisibility(Notification.VISIBILITY_PRIVATE).setContentIntent(open(c, row, false)).setDeleteIntent(close).setAutoCancel(false).setOnlyAlertOnce(false)
            .addAction(new Notification.Action.Builder(null, "Realizado", open(c, row, true)).build())
            .addAction(new Notification.Action.Builder(null, "Cerrar", close).build());
        if (fullScreen) builder.setFullScreenIntent(open(c, row, false), true);
        try {
            ((NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE)).notify(TAG, row.optInt("id"), builder.build());
            if (fullScreen) ReminderOverlayStore.event(c, fullScreenAllowed(c) ? "alarm_requested" : "full_screen_missing", "");
        } catch (RuntimeException e) { ReminderOverlayStore.event(c, "notification_error", e.getClass().getSimpleName()); }
    }
    static void cancel(Context c, int id) { ((NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE)).cancel(TAG, id); }
}
