package com.taskquest.rpg;

import org.junit.Test;
import static org.junit.Assert.*;
import java.io.*;
import java.nio.charset.StandardCharsets;

public class ReminderRulesTest {
    @Test public void sameIntervalFixturesAsTheApp() throws Exception {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(getClass().getResourceAsStream("/reminder-intervals.tsv"), StandardCharsets.UTF_8))) {
            String line; while ((line = reader.readLine()) != null) {
                if (line.trim().isEmpty()) continue;
                String[] f = line.split("\t");
                assertEquals(line, Long.parseLong(f[4]), ReminderRules.next(Long.parseLong(f[0]), Long.parseLong(f[1]), Long.parseLong(f[2]), Long.parseLong(f[3])));
            }
        }
    }
    @Test public void continuesAfterTheDeadlineWithoutReplayingMissedIntervals() {
        assertEquals(5400000L, ReminderRules.next(0, 1800000, 3600000, 3600001));
        assertEquals(86401800000L, ReminderRules.next(0, 1800000, 3600000, 86400000000L));
    }
    @Test(expected = IllegalArgumentException.class) public void rejectsUnboundedShortIntervals() {
        ReminderRules.next(0, 0, 10000, 0);
    }
}
