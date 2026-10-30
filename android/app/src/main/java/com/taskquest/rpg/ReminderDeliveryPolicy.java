package com.taskquest.rpg;

/** Platform-independent decisions, tested without an Android device. */
final class ReminderDeliveryPolicy {
    enum Route { IN_APP, OVERLAY, ALARM }
    static Route route(boolean foreground, boolean locked, boolean interactive, boolean overlayAllowed) {
        if (locked || !interactive) return Route.ALARM;
        if (foreground) return Route.IN_APP;
        return overlayAllowed ? Route.OVERLAY : Route.ALARM;
    }
    static int duration(int seconds) { return seconds == 15 || seconds == 60 ? seconds : 30; }
}
