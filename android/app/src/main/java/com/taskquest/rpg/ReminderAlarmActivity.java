package com.taskquest.rpg;

import android.app.Activity;
import android.app.KeyguardManager;
import android.content.Intent;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.Toast;
import org.json.JSONObject;
import java.lang.ref.WeakReference;

/** A native alarm surface. It does not load or wait for the game's WebView. */
public class ReminderAlarmActivity extends Activity {
    private static WeakReference<ReminderAlarmActivity> visible = new WeakReference<>(null);
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final ReminderSignal signal = new ReminderSignal();
    private int reminderId;
    private boolean completing;
    static void close(int id) {
        ReminderAlarmActivity activity = visible.get();
        if (activity != null && activity.reminderId == id) activity.runOnUiThread(activity::finish);
    }
    static void stopSignal() { ReminderAlarmActivity activity = visible.get(); if (activity != null) activity.runOnUiThread(activity.signal::stop); }
    @Override public void onCreate(Bundle state) {
        super.onCreate(state); visible = new WeakReference<>(this);
        if (Build.VERSION.SDK_INT >= 27) { setShowWhenLocked(true); setTurnScreenOn(true); }
        else getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        showReminder();
    }
    @Override protected void onNewIntent(Intent intent) { super.onNewIntent(intent); setIntent(intent); completing = false; showReminder(); }
    private void showReminder() {
        handler.removeCallbacksAndMessages(null); signal.stop();
        reminderId = getIntent().getIntExtra("id", 0);
        JSONObject row = ReminderOverlayStore.find(this, reminderId);
        if (row == null || row.optBoolean("completed") || row.optBoolean("dismissed") || !ReminderOverlayStore.key(row).equals(getIntent().getStringExtra("key"))) { finish(); return; }
        FrameLayout container = new FrameLayout(this); container.setBackgroundColor(Color.rgb(8, 11, 32));
        LinearLayout card = ReminderCard.build(this, row, () -> navigate(row, true), () -> { ReminderOverlayStore.dismiss(this, row.optInt("id")); finish(); }, () -> navigate(row, false));
        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(Math.min(getResources().getDisplayMetrics().widthPixels - ReminderCard.dp(this, 32), ReminderCard.dp(this, 500)), FrameLayout.LayoutParams.WRAP_CONTENT, Gravity.CENTER);
        container.addView(card, params); setContentView(container);
        // Service owns the signal when running; notification taps after it stops
        // may show the task, but must not start a fresh round of alarm sound.
        if (ReminderOverlayStore.enabled(this) && !ReminderOverlayService.isRunning() && System.currentTimeMillis() - row.optLong("lastDeliveredAt", row.optLong("at")) < ReminderOverlayStore.duration(this) * 1000L) signal.start(this);
        handler.postDelayed(() -> { signal.stop(); finish(); }, ReminderOverlayStore.duration(this) * 1000L);
        if (getIntent().getBooleanExtra("done", false)) { getIntent().putExtra("done", false); navigate(row, true); }
        else if (getIntent().getBooleanExtra("openDetail", false)) { getIntent().putExtra("openDetail", false); navigate(row, false); }
    }
    @Override public void onWindowFocusChanged(boolean focused) {
        super.onWindowFocusChanged(focused);
        if (focused) ReminderOverlayStore.event(this, "alarm_shown", "");
    }
    private void navigate(JSONObject row, boolean complete) {
        if (completing) return;
        completing = true; signal.stop(); ReminderOverlayService.stopSignals();
        if (row.optBoolean("test")) {
            ReminderOverlayStore.dismiss(this, row.optInt("id"));
            if (!complete) startActivity(WidgetRenderer.link(this, "tasks", null, null));
            finish(); return;
        }
        KeyguardManager keyguard = (KeyguardManager)getSystemService(KEYGUARD_SERVICE);
        if (keyguard.isKeyguardLocked() && Build.VERSION.SDK_INT >= 26) {
            keyguard.requestDismissKeyguard(this, new KeyguardManager.KeyguardDismissCallback() {
                @Override public void onDismissSucceeded() { saveAndOpen(row, complete); }
                @Override public void onDismissCancelled() { completing = false; showReminder(); }
                @Override public void onDismissError() { completing = false; showReminder(); Toast.makeText(ReminderAlarmActivity.this, complete ? "Desbloquea el teléfono para guardar la misión realizada" : "Desbloquea el teléfono para ver la misión", Toast.LENGTH_LONG).show(); }
            });
        } else saveAndOpen(row, complete);
    }
    private void saveAndOpen(JSONObject row, boolean complete) {
        int selectedId = row.optInt("id");
        JSONObject current = ReminderOverlayStore.find(this, selectedId);
        boolean valid = current != null && !current.optBoolean("completed") && !current.optBoolean("dismissed") && ReminderOverlayStore.key(current).equals(ReminderOverlayStore.key(row));
        if (complete && valid) ReminderOverlayStore.enqueue(this, row);
        ReminderOverlayStore.dismiss(this, selectedId);
        try { startActivity(!complete && valid ? WidgetRenderer.link(this, "edit-task", row.optString("taskId"), null)
            : new Intent(this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP)); }
        catch (RuntimeException e) { Toast.makeText(this, complete ? "Abre FocusMission para guardar la misión realizada" : "Abre FocusMission para ver la misión", Toast.LENGTH_LONG).show(); }
        finish();
    }
    @Override protected void onDestroy() {
        handler.removeCallbacksAndMessages(null); signal.stop();
        if (visible.get() == this) visible.clear(); super.onDestroy();
    }
}
