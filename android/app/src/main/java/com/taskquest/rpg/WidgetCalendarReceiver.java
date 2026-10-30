package com.taskquest.rpg;
import android.content.*;
public class WidgetCalendarReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context c, Intent intent) { WidgetRefresh.all(c); }
}
