package com.taskquest.rpg;

import android.content.Context;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import org.json.JSONObject;

final class ReminderCard {
    static int dp(Context c, int value) { return Math.round(value * c.getResources().getDisplayMetrics().density); }
    private static TextView text(Context c, String value, int size, int color, boolean bold) {
        TextView view = new TextView(c); view.setText(value); view.setTextSize(size); view.setTextColor(color);
        if (bold) view.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        view.setPadding(0, dp(c, 5), 0, dp(c, 5)); return view;
    }
    static LinearLayout build(Context c, JSONObject row, Runnable done, Runnable close, Runnable open) {
        LinearLayout layout = new LinearLayout(c); layout.setOrientation(LinearLayout.VERTICAL); layout.setPadding(dp(c, 20), dp(c, 16), dp(c, 20), dp(c, 20));
        GradientDrawable bg = new GradientDrawable(); bg.setColor(Color.rgb(23, 19, 53)); bg.setCornerRadius(dp(c, 22)); bg.setStroke(dp(c, 1), Color.rgb(167, 139, 250));
        layout.setBackground(bg); layout.setElevation(dp(c, 12));
        LinearLayout content = new LinearLayout(c); content.setOrientation(LinearLayout.VERTICAL);
        content.setFocusable(true); content.setContentDescription("Ver detalle de " + row.optString("title"));
        content.setOnClickListener(view -> open.run());
        layout.setOnClickListener(view -> open.run()); layout.setFocusable(false);
        String heading = "due".equals(row.optString("kind")) ? "Llegó la hora límite" : row.optLong("dueAt", Long.MAX_VALUE) < System.currentTimeMillis() ? "Tu misión sigue pendiente" : "Tu misión se acerca";
        content.addView(text(c, row.optBoolean("test") ? "Prueba de recordatorio" : heading, 14, Color.rgb(196, 181, 253), true));
        TextView title = text(c, row.optString("title"), 23, Color.WHITE, true); title.setMaxLines(3); content.addView(title);
        TextView body = text(c, row.optString("body"), 16, Color.rgb(203, 213, 225), false); body.setMaxLines(4); content.addView(body);
        layout.addView(content);
        LinearLayout actions = new LinearLayout(c);
        Button complete = new Button(c); complete.setText("Realizado"); complete.setTextColor(Color.rgb(15, 23, 42)); complete.setBackgroundTintList(ColorStateList.valueOf(Color.rgb(251, 191, 36)));
        Button dismiss = new Button(c); dismiss.setText("Cerrar"); dismiss.setTextColor(Color.WHITE); dismiss.setBackgroundTintList(ColorStateList.valueOf(Color.rgb(71, 55, 112)));
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(0, dp(c, 56), 1); params.setMargins(dp(c, 3), dp(c, 10), dp(c, 3), 0);
        actions.addView(complete, params); actions.addView(dismiss, params); layout.addView(actions);
        complete.setOnClickListener(view -> { complete.setEnabled(false); done.run(); });
        dismiss.setOnClickListener(view -> close.run()); return layout;
    }
}
