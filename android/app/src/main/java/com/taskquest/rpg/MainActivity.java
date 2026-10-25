package com.taskquest.rpg;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WidgetDataPlugin.class);
        registerPlugin(FullscreenPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
