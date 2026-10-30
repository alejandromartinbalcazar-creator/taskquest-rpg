package com.taskquest.rpg;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;

public class MainActivity extends BridgeActivity {
    static volatile boolean isVisible = false;
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WidgetDataPlugin.class);
        registerPlugin(FullscreenPlugin.class);
        registerPlugin(ReminderOverlayPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override public void onResume() { super.onResume(); isVisible = true; ReminderOverlayStore.restore(this); }
    @Override public void onPause() { isVisible = false; super.onPause(); }
}
