package com.taskquest.rpg;

import android.app.NotificationManager;
import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;

/** Respects silence and DND; never changes the device's volume or notification policy. */
final class ReminderSignal {
    private final Handler handler = new Handler(Looper.getMainLooper());
    private Ringtone ringtone;
    private Vibrator vibrator;
    void start(Context c) {
        stop();
        AudioManager audio = (AudioManager)c.getSystemService(Context.AUDIO_SERVICE);
        NotificationManager manager = (NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (audio.getRingerMode() == AudioManager.RINGER_MODE_SILENT || manager.getCurrentInterruptionFilter() != NotificationManager.INTERRUPTION_FILTER_ALL) return;
        try {
            AudioAttributes attributes = new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION).build();
            if (ReminderOverlayStore.sound(c) && audio.getRingerMode() == AudioManager.RINGER_MODE_NORMAL) {
                ringtone = RingtoneManager.getRingtone(c, RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION));
                if (ringtone != null) {
                    ringtone.setAudioAttributes(attributes);
                    if (Build.VERSION.SDK_INT >= 28) ringtone.setLooping(true);
                    ringtone.play();
                }
            }
            if (ReminderOverlayStore.vibration(c)) {
                vibrator = (Vibrator)c.getSystemService(Context.VIBRATOR_SERVICE);
                if (vibrator != null && vibrator.hasVibrator()) {
                    long[] pattern = {0, 180, 620};
                    if (Build.VERSION.SDK_INT >= 26) vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0), attributes);
                    else vibrator.vibrate(pattern, 0, attributes);
                }
            }
            handler.postDelayed(this::stop, ReminderOverlayStore.duration(c) * 1000L);
        } catch (RuntimeException e) { stop(); ReminderOverlayStore.event(c, "signal_error", e.getClass().getSimpleName()); }
    }
    void stop() {
        handler.removeCallbacksAndMessages(null);
        if (ringtone != null) { ringtone.stop(); ringtone = null; }
        if (vibrator != null) { vibrator.cancel(); vibrator = null; }
    }
}
