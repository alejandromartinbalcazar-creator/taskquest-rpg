package com.taskquest.rpg;
import com.getcapacitor.*;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.*;

@CapacitorPlugin(name = "WidgetData")
public class WidgetDataPlugin extends Plugin {
    static final String PREFS = "focusmission_widget", TASKS_KEY = "tasks";
    @PluginMethod public void syncTasks(PluginCall call) {
        try { JSONArray tasks = new JSONArray(call.getString("tasks", "[]"));
            WidgetRepository.sync(getContext(), call.getString("source", "device"), tasks); WidgetRefresh.all(getContext()); call.resolve();
        } catch (Exception e) { call.reject("No se pudo actualizar el widget", e); }
    }
    @PluginMethod public void actions(PluginCall call) {
        JSObject value = new JSObject(); value.put("actions", WidgetRepository.actions(getContext(), call.getString("source", "device"))); call.resolve(value);
    }
    @PluginMethod public void acknowledge(PluginCall call) {
        try {
            WidgetRepository.acknowledge(getContext(), call.getString("source", "device"), call.getArray("keys", new JSArray()), new JSONArray(call.getString("tasks", "[]")));
            WidgetRefresh.all(getContext()); call.resolve();
        } catch (Exception e) { call.reject("No se pudo confirmar el completado del widget", e); }
    }
}
