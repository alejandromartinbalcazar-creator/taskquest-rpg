package com.taskquest.rpg;
import org.junit.Test;
import static org.junit.Assert.*;
import java.time.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

public class WidgetRulesTest {
    @Test public void sameRecurrenceFixturesAsTheApp() throws Exception {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(getClass().getResourceAsStream("/widget-recurrence.tsv"), StandardCharsets.UTF_8))) {
            String line; while ((line = reader.readLine()) != null) {
                if (line.trim().isEmpty()) continue;
                String[] f = line.split("\t"); int[] days = f[4].equals("-") ? new int[0] : Arrays.stream(f[4].split(",")).mapToInt(Integer::parseInt).toArray();
                String next = WidgetRules.next(f[2], f[1], days, Instant.parse(f[3]), ZoneId.of(f[0]));
                assertEquals(line, f[5].equals("null") ? null : f[5], next);
            }
        }
    }
    @Test public void largeOverdueBacklogCannotTakeTodaysAllocation() {
        int[] counts = WidgetRules.allocation(400, 48, 20, 1000, 30, new int[]{3,3,1});
        assertArrayEquals(new int[]{3,3,1}, counts);
    }
    @Test public void smallWidgetsKeepBothMainGroupsAndSummarizeTomorrow() {
        assertArrayEquals(new int[]{1,1,0}, WidgetRules.allocation(150, 48, 10, 100, 80, new int[]{3,3,1}));
    }
    @Test public void emptyGroupLendsSpaceAndZeroLimitReallyHidesIt() {
        assertArrayEquals(new int[]{0,3,1}, WidgetRules.allocation(400, 48, 0, 10, 5, new int[]{3,3,1}));
        assertArrayEquals(new int[]{0,3,1}, WidgetRules.allocation(400, 48, 10, 10, 5, new int[]{0,3,1}));
    }
    @Test public void localCalendarAndExpiredHoursAreDisjoint() {
        Instant now = Instant.parse("2026-10-31T02:00:00Z"); ZoneId lima = ZoneId.of("America/Lima");
        assertEquals("overdue", WidgetRules.section("2026-10-31T01:00:00Z", now, lima));
        assertEquals("today", WidgetRules.section("2026-10-31T03:00:00Z", now, lima));
        assertEquals("tomorrow", WidgetRules.section("2026-10-31T15:00:00Z", now, lima));
        assertEquals("later", WidgetRules.section("broken", now, lima));
    }
    @Test public void settingsAreIndependentObjectsAndBoundTheirLimits() {
        WidgetSettings first = new WidgetSettings(), second = new WidgetSettings(); first.limits[0] = 9; first.preset = "compact";
        assertEquals(3, second.limits[0]); assertEquals("overview", second.preset);
        assertEquals(0, WidgetSettings.limit(-1)); assertEquals(10, WidgetSettings.limit(999));
        assertTrue(second.rowHeight() >= 44);
    }
}
