package com.taskquest.rpg;

import android.app.KeyguardManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;
import org.json.JSONObject;
import java.util.ArrayDeque;

/** Exists only while a reminder is visible; ordinary notifications provide the fallback. */
public class ReminderOverlayService extends Service {
    private static volatile ReminderOverlayService running;
    private static final String CHANNEL = "focusmission-overlay-session";
    private static final int SERVICE_NOTICE = 2147483647;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final ArrayDeque<JSONObject> queue = new ArrayDeque<>();
    private WindowManager windows;
    private View card;
    private JSONObject current;
    private final Runnable dismissCurrent = this::next;

    static void refresh() {
        ReminderOverlayService service = running;
        if (service != null) service.handler.post(() -> {
            if (!ReminderOverlayStore.permitted(service)) service.stopSelf();
            else if (service.current != null && !service.valid(service.current)) service.next();
        });
    }
    private boolean valid(JSONObject row) {
        JSONObject saved = ReminderOverlayStore.find(this, row.optInt("id"));
        return saved != null && ReminderOverlayStore.key(saved).equals(ReminderOverlayStore.key(row));
    }
    @Override public void onCreate() {
        super.onCreate();
        running = this;
        windows = (WindowManager)getSystemService(WINDOW_SERVICE);
        // Hard lifetime budget, including successive alerts, below Android's shortService timeout.
        handler.postDelayed(this::stopSelf, 90000);
    }
    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        NotificationManager notifications = (NotificationManager)getSystemService(NOTIFICATION_SERVICE);
        notifications.createNotificationChannel(new NotificationChannel(CHANNEL, "Aviso de misión activo", NotificationManager.IMPORTANCE_LOW));
        PendingIntent open = PendingIntent.getActivity(this, 0, new Intent(this, MainActivity.class), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification notice = new Notification.Builder(this, CHANNEL).setSmallIcon(R.drawable.ic_mission_reminder)
            .setContentTitle("Recordatorio de FocusMission").setContentText("Hay un aviso de misión en pantalla")
            .setContentIntent(open).setOngoing(true).build();
        if (Build.VERSION.SDK_INT >= 34) startForeground(SERVICE_NOTICE, notice, ServiceInfo.FOREGROUND_SERVICE_TYPE_SHORT_SERVICE);
        else startForeground(SERVICE_NOTICE, notice);
        if (intent == null || !ReminderOverlayStore.permitted(this)) { stopSelf(); return START_NOT_STICKY; }
        JSONObject row = ReminderOverlayStore.find(this, intent.getIntExtra("id", -1));
        if (row != null && valid(row)) {
            boolean duplicate = current != null && ReminderOverlayStore.key(current).equals(ReminderOverlayStore.key(row));
            for (JSONObject pending : queue) if (ReminderOverlayStore.key(pending).equals(ReminderOverlayStore.key(row))) duplicate = true;
            if (!duplicate && queue.size() < 20) queue.add(row);
        }
        if (current == null) next();
        return START_NOT_STICKY;
    }
    private int dp(int value) { return Math.round(value * getResources().getDisplayMetrics().density); }
    private TextView text(String value, int size, int color, boolean bold) {
        TextView view = new TextView(this); view.setText(value); view.setTextSize(size); view.setTextColor(color);
        if (bold) view.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        view.setPadding(0, dp(5), 0, dp(5));
        return view;
    }
    private void removeCard() {
        handler.removeCallbacks(dismissCurrent);
        if (card != null) { try { windows.removeView(card); } catch (RuntimeException ignored) { } card = null; }
        current = null;
    }
    private void next() {
        removeCard();
        KeyguardManager keyguard = (KeyguardManager)getSystemService(KEYGUARD_SERVICE);
        if (!ReminderOverlayStore.permitted(this) || keyguard.isKeyguardLocked()) { stopSelf(); return; }
        JSONObject row;
        do { row = queue.poll(); } while (row != null && !valid(row));
        if (row == null) { stopSelf(); return; }
        current = row;
        JSONObject shown = row;
        LinearLayout layout = new LinearLayout(this); layout.setOrientation(LinearLayout.VERTICAL); layout.setPadding(dp(20), dp(16), dp(20), dp(20));
        GradientDrawable background = new GradientDrawable(); background.setColor(Color.rgb(23,19,53)); background.setCornerRadius(dp(22)); background.setStroke(dp(1), Color.rgb(167,139,250));
        layout.setBackground(background); layout.setElevation(dp(12));
        layout.addView(text("Recordatorio de misión", 14, Color.rgb(196,181,253), true));
        TextView title = text(row.optString("title"), 21, Color.WHITE, true); title.setMaxLines(3); layout.addView(title);
        TextView body = text(row.optString("body"), 15, Color.rgb(203,213,225), false); body.setMaxLines(3); layout.addView(body);
        LinearLayout actions = new LinearLayout(this);
        Button done = new Button(this); done.setText("Realizado"); done.setTextColor(Color.rgb(15,23,42)); done.setBackgroundTintList(android.content.res.ColorStateList.valueOf(Color.rgb(251,191,36)));
        Button close = new Button(this); close.setText("Cerrar"); close.setTextColor(Color.WHITE); close.setBackgroundTintList(android.content.res.ColorStateList.valueOf(Color.rgb(71,55,112)));
        LinearLayout.LayoutParams buttonParams = new LinearLayout.LayoutParams(0, dp(54), 1); buttonParams.setMargins(dp(3), dp(10), dp(3), 0);
        actions.addView(done, buttonParams); actions.addView(close, buttonParams); layout.addView(actions);
        done.setOnClickListener(view -> {
            done.setEnabled(false);
            if (valid(shown)) {
                ReminderOverlayStore.enqueue(this, shown);
                try { startActivity(new Intent(this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP)); }
                catch (RuntimeException e) { Toast.makeText(this, "Abre FocusMission para guardar la misión realizada", Toast.LENGTH_LONG).show(); }
            }
            next();
        });
        close.setOnClickListener(view -> next());
        int screenWidth = getResources().getDisplayMetrics().widthPixels;
        WindowManager.LayoutParams params = new WindowManager.LayoutParams(Math.min(screenWidth - dp(24), dp(480)), WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH,
            PixelFormat.TRANSLUCENT);
        params.gravity = Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL;
        params.y = dp(32);
        try {
            windows.addView(layout, params); card = layout;
            layout.setTranslationY(dp(80)); layout.setAlpha(0);
            layout.animate().translationY(0).alpha(1).setDuration(240).start();
            handler.postDelayed(dismissCurrent, 45000);
        } catch (RuntimeException e) { stopSelf(); }
    }
    @Override public void onTimeout(int startId) { stopSelf(); }
    @Override public void onDestroy() {
        handler.removeCallbacksAndMessages(null); removeCard(); running = null;
        stopForeground(STOP_FOREGROUND_REMOVE); super.onDestroy();
    }
    @Override public IBinder onBind(Intent intent) { return null; }
}
