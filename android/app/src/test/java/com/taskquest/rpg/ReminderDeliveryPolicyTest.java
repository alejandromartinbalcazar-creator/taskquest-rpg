package com.taskquest.rpg;

import org.junit.Test;
import static org.junit.Assert.assertEquals;

public class ReminderDeliveryPolicyTest {
    @Test public void homeAndOtherAppsUseOverlayWhenGranted() {
        assertEquals(ReminderDeliveryPolicy.Route.OVERLAY, ReminderDeliveryPolicy.route(false, false, true, true));
    }
    @Test public void lockedDeviceUsesAlarmEvenWithOverlayPermission() {
        assertEquals(ReminderDeliveryPolicy.Route.ALARM, ReminderDeliveryPolicy.route(false, true, true, true));
    }
    @Test public void screenOffUsesAlarmInsteadOfDroppingReminder() {
        assertEquals(ReminderDeliveryPolicy.Route.ALARM, ReminderDeliveryPolicy.route(false, false, false, true));
        assertEquals(ReminderDeliveryPolicy.Route.ALARM, ReminderDeliveryPolicy.route(true, true, false, true));
    }
    @Test public void missingOverlayPermissionStillRequestsAnAlarm() {
        assertEquals(ReminderDeliveryPolicy.Route.ALARM, ReminderDeliveryPolicy.route(false, false, true, false));
    }
    @Test public void openAppIsOnlyTheForegroundCase() {
        assertEquals(ReminderDeliveryPolicy.Route.IN_APP, ReminderDeliveryPolicy.route(true, false, true, true));
    }
    @Test public void durationIsBoundedToTheUserChoices() {
        assertEquals(15, ReminderDeliveryPolicy.duration(15));
        assertEquals(30, ReminderDeliveryPolicy.duration(30));
        assertEquals(60, ReminderDeliveryPolicy.duration(60));
        assertEquals(30, ReminderDeliveryPolicy.duration(-1));
        assertEquals(30, ReminderDeliveryPolicy.duration(10000));
    }
}
