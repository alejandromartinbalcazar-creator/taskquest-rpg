package com.taskquest.rpg;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "Fullscreen")
public class FullscreenPlugin extends Plugin {
  @PluginMethod public void setImmersive(PluginCall call) {
    boolean enabled = call.getBoolean("enabled", false);
    getActivity().runOnUiThread(() -> {
      WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getActivity().getWindow(), getActivity().getWindow().getDecorView());
      if (enabled) { controller.hide(WindowInsetsCompat.Type.systemBars()); controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE); }
      else controller.show(WindowInsetsCompat.Type.systemBars());
      call.resolve();
    });
  }
}
