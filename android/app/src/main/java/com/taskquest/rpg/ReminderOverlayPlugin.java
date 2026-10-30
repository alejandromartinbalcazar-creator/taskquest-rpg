package com.taskquest.rpg;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ReminderOverlay")
public class ReminderOverlayPlugin extends Plugin {
    private JSObject currentStatus() {
        JSObject value = new JSObject();
        value.put("supported", Build.VERSION.SDK_INT >= 26);
        value.put("enabled", ReminderOverlayStore.enabled(getContext()));
        value.put("granted", Settings.canDrawOverlays(getContext()));
        value.put("exact", ReminderOverlayStore.exact(getContext()));
        return value;
    }
    @PluginMethod public void status(PluginCall call) { call.resolve(currentStatus()); }
    @PluginMethod public void sync(PluginCall call) {
        JSArray rows = call.getArray("reminders");
        if (rows == null) { call.reject("Faltan los recordatorios"); return; }
        ReminderOverlayStore.sync(getContext(), rows);
        call.resolve();
    }
    @PluginMethod public void configure(PluginCall call) {
        if (Build.VERSION.SDK_INT < 26) { call.reject("Los avisos superpuestos requieren Android 8 o posterior"); return; }
        boolean enabled = Boolean.TRUE.equals(call.getBoolean("enabled", false));
        ReminderOverlayStore.prefs(getContext()).edit().putBoolean("enabled", enabled).commit();
        ReminderOverlayStore.sync(getContext(), ReminderOverlayStore.read(getContext(), "reminders"));
        if (enabled && !Settings.canDrawOverlays(getContext())) {
            try {
                getActivity().startActivity(new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + getContext().getPackageName())));
            } catch (Exception e) { call.reject("No se pudieron abrir los ajustes de ventanas superpuestas", e); return; }
        }
        call.resolve(currentStatus());
    }
    @PluginMethod public void pendingActions(PluginCall call) {
        JSObject value = new JSObject();
        value.put("actions", ReminderOverlayStore.read(getContext(), "actions"));
        call.resolve(value);
    }
    @PluginMethod public void acknowledge(PluginCall call) {
        JSArray keys = call.getArray("keys");
        if (keys != null) ReminderOverlayStore.acknowledge(getContext(), keys);
        call.resolve();
    }
}
