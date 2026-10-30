package com.taskquest.rpg;

import android.app.KeyguardManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.provider.Settings;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import org.json.JSONObject;
import java.util.ArrayDeque;

/** A bounded native session presents reminders even without the WebView. */
public class ReminderOverlayService extends Service {
    private static volatile ReminderOverlayService running;
    private static final int SERVICE_NOTICE = Integer.MAX_VALUE;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final ArrayDeque<JSONObject> queue = new ArrayDeque<>();
    private final ReminderSignal signal = new ReminderSignal();
    private final Runnable advance = this::next;
    private WindowManager windows;
    private View card;
    private JSONObject current;
    static boolean isRunning() { return running != null; }
    static void stopSignals() { ReminderOverlayService service = running; if (service != null) service.handler.post(service.signal::stop); }
    static void dismiss(int id) {
        ReminderOverlayService service = running;
        if (service != null) service.handler.post(() -> { if (service.current != null && service.current.optInt("id") == id) service.next(); });
    }
    static void refresh() {
        ReminderOverlayService service = running;
        if (service != null) service.handler.post(() -> {
            if (!ReminderOverlayStore.permitted(service)) service.stopSelf();
            else if (service.current != null && !service.valid(service.current)) service.next();
        });
    }
    private boolean valid(JSONObject row) {
        JSONObject saved = ReminderOverlayStore.find(this, row.optInt("id"));
        return saved != null && !saved.optBoolean("dismissed") && ReminderOverlayStore.key(saved).equals(ReminderOverlayStore.key(row));
    }
    @Override public void onCreate() {
        super.onCreate(); running = this;
        windows = (WindowManager)getSystemService(WINDOW_SERVICE);
        handler.postDelayed(this::stopSelf, 120000); // Below shortService's three-minute budget.
    }
    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        try {
            NotificationManager notifications = (NotificationManager)getSystemService(NOTIFICATION_SERVICE);
            String channel = "focusmission-overlay-session";
            notifications.createNotificationChannel(new NotificationChannel(channel, "Aviso de misión activo", NotificationManager.IMPORTANCE_LOW));
            PendingIntent open = PendingIntent.getActivity(this, 0, new Intent(this, MainActivity.class), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            Notification notice = new Notification.Builder(this, channel).setSmallIcon(R.drawable.ic_mission_reminder)
                .setContentTitle("Recordatorio de FocusMission").setContentText("Un aviso de misión está activo").setContentIntent(open).setOngoing(true).build();
            if (Build.VERSION.SDK_INT >= 34) startForeground(SERVICE_NOTICE, notice, ServiceInfo.FOREGROUND_SERVICE_TYPE_SHORT_SERVICE);
            else startForeground(SERVICE_NOTICE, notice);
        } catch (RuntimeException e) {
            JSONObject row = intent == null ? null : ReminderOverlayStore.find(this, intent.getIntExtra("id", 0));
            if (row != null) ReminderAlarmNotice.post(this, row, true, true);
            ReminderOverlayStore.event(this, "service_blocked", e.getClass().getSimpleName()); stopSelf(); return START_NOT_STICKY;
        }
        if (intent == null || !ReminderOverlayStore.permitted(this)) { stopSelf(); return START_NOT_STICKY; }
        JSONObject row = ReminderOverlayStore.find(this, intent.getIntExtra("id", 0));
        if (row != null && valid(row)) {
            boolean duplicate = current != null && ReminderOverlayStore.key(current).equals(ReminderOverlayStore.key(row));
            for (JSONObject pending : queue) if (ReminderOverlayStore.key(pending).equals(ReminderOverlayStore.key(row))) duplicate = true;
            if (!duplicate) {
                // All due missions immediately receive a notification, even if
                // this bounded visual session cannot display the entire queue.
                if (current != null || queue.size() >= 20) ReminderAlarmNotice.post(this, row, false, false);
                if (queue.size() < 20) queue.add(row);
            }
        }
        if (current == null) next();
        return START_NOT_STICKY;
    }
    private void removeCard() {
        handler.removeCallbacks(advance); signal.stop();
        if (card != null) { try { windows.removeView(card); } catch (RuntimeException ignored) { } card = null; }
        current = null;
    }
    private void next() {
        removeCard();
        if (!ReminderOverlayStore.permitted(this)) { stopSelf(); return; }
        JSONObject row;
        do { row = queue.poll(); } while (row != null && !valid(row));
        if (row == null) { stopSelf(); return; }
        current = row;
        KeyguardManager lock = (KeyguardManager)getSystemService(KEYGUARD_SERVICE);
        PowerManager power = (PowerManager)getSystemService(POWER_SERVICE);
        ReminderDeliveryPolicy.Route route = ReminderDeliveryPolicy.route(MainActivity.isVisible, lock.isKeyguardLocked(), power.isInteractive(), Settings.canDrawOverlays(this));
        ReminderAlarmNotice.post(this, row, route == ReminderDeliveryPolicy.Route.ALARM, false);
        if (ReminderAlarmNotice.channelReady(this)) signal.start(this);
        if (route == ReminderDeliveryPolicy.Route.IN_APP) {
            if (row.optBoolean("test")) {
                // The test must work in native code; it has no real task to open.
                try { startActivity(ReminderAlarmNotice.openIntent(this, row, false)); } catch (Exception e) { ReminderOverlayStore.event(this, "screen_error", e.getClass().getSimpleName()); }
            } else ReminderOverlayPlugin.received(row);
            ReminderOverlayStore.event(this, "in_app", "");
        } else if (route == ReminderDeliveryPolicy.Route.OVERLAY) showOverlay(row);
        handler.postDelayed(advance, ReminderOverlayStore.duration(this) * 1000L);
    }
    private void showOverlay(JSONObject row) {
        View layout = ReminderCard.build(this, row, () -> {
            // Open the native action surface, which handles unlock if required.
            signal.stop();
            try { startActivity(ReminderAlarmNotice.openIntent(this, row, true)); }
            catch (Exception e) { ReminderOverlayStore.event(this, "screen_error", e.getClass().getSimpleName()); }
        }, () -> ReminderOverlayStore.dismiss(this, row.optInt("id")));
        WindowManager.LayoutParams params = new WindowManager.LayoutParams(Math.min(getResources().getDisplayMetrics().widthPixels - ReminderCard.dp(this, 24), ReminderCard.dp(this, 480)), WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY, WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE, PixelFormat.TRANSLUCENT);
        params.gravity = Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL; params.y = ReminderCard.dp(this, 32);
        try {
            windows.addView(layout, params); card = layout; layout.setTranslationY(ReminderCard.dp(this, 80)); layout.setAlpha(0);
            layout.animate().translationY(0).alpha(1).setDuration(240).start(); ReminderOverlayStore.event(this, "overlay_shown", "");
        } catch (RuntimeException e) {
            ReminderAlarmNotice.post(this, row, true, false); ReminderOverlayStore.event(this, "overlay_blocked", e.getClass().getSimpleName());
        }
    }
    @Override public void onTimeout(int startId) { stopSelf(); }
    @Override public void onDestroy() {
        // Alerts still queued remain actionable through their notifications.
        if (ReminderOverlayStore.permitted(this)) for (JSONObject row : queue) if (valid(row)) ReminderAlarmNotice.post(this, row, false, false);
        handler.removeCallbacksAndMessages(null); removeCard(); running = null;
        stopForeground(STOP_FOREGROUND_REMOVE); super.onDestroy();
    }
    @Override public IBinder onBind(Intent intent) { return null; }
}
