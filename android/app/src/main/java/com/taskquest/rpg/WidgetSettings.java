package com.taskquest.rpg;

final class WidgetSettings {
    String preset = "overview", appearance = "minimal", palette = "auto", density = "balanced", sort = "ascending";
    boolean overdueFirst = true, showEmpty = false;
    String[] order = {"today", "overdue", "tomorrow"};
    int[] limits = {3, 3, 1};
    int rowHeight() { return density.equals("comfortable") ? 56 : density.equals("compact") ? 44 : 48; }
    static int limit(int value) { return Math.max(0, Math.min(10, value)); }
}
