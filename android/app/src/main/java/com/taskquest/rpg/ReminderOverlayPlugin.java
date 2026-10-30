package com.taskquest.rpg;

import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.app.NotificationManagerCompat;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.lang.ref.WeakReference;
import org.json.JSONArray;
import org.json.JSONObject;

@CapacitorPlugin(name = "ReminderOverlay")
public class ReminderOverlayPlugin extends Plugin {
    private static WeakReference<ReminderOverlayPlugin> instance = new WeakReference<>(null);
    @Override public void load() { instance = new WeakReference<>(this); }
    @Override protected void handleOnDestroy() { if (instance.get() == this) instance.clear(); }
    static void received(JSONObject row) {
        ReminderOverlayPlugin plugin = instance.get(); if (plugin == null) return;
        JSObject event = new JSObject(); event.put("taskId", row.optString("taskId")); event.put("dueDate", row.optString("dueDate")); event.put("eventId", row.optInt("id"));
        plugin.notifyListeners("reminderReceived", event, true);
    }
    private JSObject currentStatus() {
        ReminderAlarmNotice.channels(getContext());
        JSObject value = new JSObject();
        value.put("supported", Build.VERSION.SDK_INT >= 26); value.put("enabled", ReminderOverlayStore.enabled(getContext()));
        value.put("granted", Settings.canDrawOverlays(getContext())); value.put("exact", ReminderOverlayStore.exact(getContext()));
        value.put("notifications", NotificationManagerCompat.from(getContext()).areNotificationsEnabled());
        value.put("fullScreen", ReminderAlarmNotice.fullScreenAllowed(getContext())); value.put("alarmChannelReady", ReminderAlarmNotice.channelReady(getContext()));
        value.put("sound", ReminderOverlayStore.sound(getContext())); value.put("vibration", ReminderOverlayStore.vibration(getContext()));
        value.put("duration", ReminderOverlayStore.duration(getContext())); value.put("channelId", ReminderAlarmNotice.ordinaryChannel(getContext()));
        value.put("scheduledCount", ReminderOverlayStore.scheduledTaskIds(getContext()).length());
        try { value.put("lastEvent", new JSONObject(ReminderOverlayStore.prefs(getContext()).getString("lastEvent", "{}"))); } catch (Exception ignored) { }
        return value;
    }
    @PluginMethod public void status(PluginCall call) { call.resolve(currentStatus()); }
    @PluginMethod public void sync(PluginCall call) {
        JSArray rows = call.getArray("reminders"); if (rows == null) { call.reject("Faltan los recordatorios"); return; }
        ReminderOverlayStore.sync(getContext(), rows);
        JSObject result = new JSObject(); result.put("scheduledTaskIds", ReminderOverlayStore.scheduledTaskIds(getContext()));
        result.put("scheduledEventIds", ReminderOverlayStore.read(getContext(), "armed")); call.resolve(result);
    }
    @PluginMethod public void configure(PluginCall call) {
        if (Build.VERSION.SDK_INT < 26) { call.reject("El modo de alarma requiere Android 8 o posterior"); return; }
        SharedPreferences.Editor edit = ReminderOverlayStore.prefs(getContext()).edit();
        Boolean enabled = call.getBoolean("enabled"), sound = call.getBoolean("sound"), vibration = call.getBoolean("vibration");
        Integer duration = call.getInt("duration");
        if (enabled != null) edit.putBoolean("enabled", enabled);
        if (sound != null) edit.putBoolean("sound", sound);
        if (vibration != null) edit.putBoolean("vibration", vibration);
        if (duration != null) edit.putInt("duration", ReminderDeliveryPolicy.duration(duration));
        edit.commit();
        ReminderOverlayService.stopSignals(); ReminderAlarmActivity.stopSignal();
        ReminderOverlayStore.sync(getContext(), ReminderOverlayStore.read(getContext(), "reminders"));
        call.resolve(currentStatus());
    }
    @PluginMethod public void openSettings(PluginCall call) {
        String kind = call.getString("kind", "application");
        String packageName = getContext().getPackageName(); Intent intent;
        if ("overlay".equals(kind)) intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + packageName));
        else if ("fullScreen".equals(kind) && Build.VERSION.SDK_INT >= 34) intent = new Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, Uri.parse("package:" + packageName));
        else if ("channel".equals(kind) && Build.VERSION.SDK_INT >= 26) intent = new Intent(Settings.ACTION_CHANNEL_NOTIFICATION_SETTINGS)
            .putExtra(Settings.EXTRA_APP_PACKAGE, packageName).putExtra(Settings.EXTRA_CHANNEL_ID, ReminderOverlayStore.enabled(getContext()) ? ReminderAlarmNotice.ALARM_CHANNEL : ReminderAlarmNotice.ordinaryChannel(getContext()));
        else intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + packageName));
        try { getActivity().startActivity(intent); call.resolve(); }
        catch (Exception e) { call.reject("No se pudieron abrir los ajustes de Android", e); }
    }
    @PluginMethod public void test(PluginCall call) {
        if (!ReminderOverlayStore.enabled(getContext()) || !ReminderOverlayStore.permitted(getContext()) || !ReminderOverlayStore.exact(getContext())) { call.reject("Activa el modo de alarma, las notificaciones y las alarmas exactas para probar"); return; }
        try { ReminderOverlayStore.test(getContext()); call.resolve(); } catch (Exception e) { call.reject("No se pudo programar la prueba", e); }
    }
    @PluginMethod public void dismiss(PluginCall call) {
        String taskId = call.getString("taskId", ""), dueDate = call.getString("dueDate", "");
        Integer eventId = call.getInt("eventId");
        JSONArray rows = ReminderOverlayStore.read(getContext(), "reminders");
        for (int i = 0; i < rows.length(); i++) {
            JSONObject row = rows.optJSONObject(i);
            if (row != null && (eventId == null || eventId == row.optInt("id")) && row.optLong("lastDeliveredAt") > 0 && taskId.equals(row.optString("taskId")) && dueDate.equals(row.optString("dueDate"))) ReminderOverlayStore.dismiss(getContext(), row.optInt("id"));
        }
        call.resolve();
    }
    @PluginMethod public void pendingActions(PluginCall call) {
        JSObject value = new JSObject(); value.put("actions", ReminderOverlayStore.read(getContext(), "actions")); call.resolve(value);
    }
    @PluginMethod public void acknowledge(PluginCall call) {
        JSArray keys = call.getArray("keys"); if (keys != null) ReminderOverlayStore.acknowledge(getContext(), keys); call.resolve();
    }
}
