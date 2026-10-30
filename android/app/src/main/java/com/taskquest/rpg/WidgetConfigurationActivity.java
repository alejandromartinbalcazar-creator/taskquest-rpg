package com.taskquest.rpg;

import android.app.*;
import android.appwidget.*;
import android.content.*;
import android.os.Bundle;
import android.graphics.Color;
import android.view.*;
import android.widget.*;
import org.json.JSONObject;

/** The same per-instance editor is used by the launcher and the widget menu. */
public class WidgetConfigurationActivity extends Activity {
    private int widgetId;
    private WidgetSettings draft;
    private LinearLayout preview;
    private LinearLayout body;
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        widgetId = getIntent().getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID);
        setResult(RESULT_CANCELED);
        AppWidgetProviderInfo info = AppWidgetManager.getInstance(this).getAppWidgetInfo(widgetId);
        if (widgetId == AppWidgetManager.INVALID_APPWIDGET_ID || info == null || !getPackageName().equals(info.provider.getPackageName())) { finish(); return; }
        draft = WidgetRepository.settings(this, widgetId, WidgetRefresh.appearance(this, widgetId));
        if (getIntent().getBooleanExtra("menu", false)) menu(); else editor();
    }
    private void menu() {
        new AlertDialog.Builder(this).setTitle("Este widget").setItems(new String[]{"Personalizar widget", "Actualizar", "Abrir Misiones"}, (dialog, which) -> {
            if (which == 0) editor();
            else if (which == 1) { WidgetRefresh.one(this, widgetId); finish(); }
            else { startActivity(WidgetRenderer.link(this, "tasks", null, null)); finish(); }
        }).setOnCancelListener(dialog -> finish()).show();
    }
    private TextView label(String value, int size) {
        TextView text = new TextView(this); text.setText(value); text.setTextSize(size); text.setPadding(0, dp(10), 0, dp(5)); return text;
    }
    private int dp(int value) { return ReminderCard.dp(this, value); }
    private interface Selection { void set(int index); }
    private void select(String title, String[] choices, int selected, Selection change) {
        body.addView(label(title, 15)); Spinner spinner = new Spinner(this);
        ArrayAdapter<String> adapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, choices); adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinner.setAdapter(adapter); spinner.setSelection(Math.max(0, selected)); body.addView(spinner, new LinearLayout.LayoutParams(-1, dp(48)));
        spinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            public void onNothingSelected(AdapterView<?> parent) { }
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) { change.set(position); updatePreview(); }
        });
    }
    private int position(String value, String[] values) { for (int i = 0; i < values.length; i++) if (values[i].equals(value)) return i; return 0; }
    private void editor() {
        ScrollView scroll = new ScrollView(this); body = new LinearLayout(this); body.setOrientation(LinearLayout.VERTICAL); body.setPadding(dp(18), dp(24), dp(18), dp(30)); scroll.addView(body);
        scroll.setOnApplyWindowInsetsListener((view, insets) -> { view.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(), insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom()); return insets; });
        setContentView(scroll);
        body.addView(label("Personalizar widget", 24));
        body.addView(label("Los cambios solo afectan a este widget. Guarda para aplicarlos.", 13));
        preview = new LinearLayout(this); preview.setOrientation(LinearLayout.VERTICAL); preview.setPadding(dp(10), dp(4), dp(10), dp(10));
        body.addView(label("1. Elegir diseño", 19));
        RadioGroup presets = new RadioGroup(this);
        for (int i = 0; i < 2; i++) {
            RadioButton radio = new RadioButton(this); radio.setId(100 + i);
            radio.setText(i == 0 ? "Todo en uno\nHoy y Vencidas equilibrados; Mañana compacto" : "Lista compacta\nTodas las pendientes en una lista desplazable");
            radio.setPadding(0, dp(10), 0, dp(10)); presets.addView(radio);
        }
        presets.check(draft.preset.equals("compact") ? 101 : 100); presets.setOnCheckedChangeListener((group, checked) -> { draft.preset = checked == 101 ? "compact" : "overview"; updatePreview(); }); body.addView(presets);
        body.addView(label("2. Contenido", 19));
        select("Orden de las tareas", new String[]{"Fecha próxima primero", "Fecha más lejana primero"}, draft.sort.equals("descending") ? 1 : 0, index -> draft.sort = index == 1 ? "descending" : "ascending");
        CheckBox overdue = new CheckBox(this); overdue.setText("Vencidas primero en Lista compacta"); overdue.setChecked(draft.overdueFirst);
        overdue.setOnCheckedChangeListener((button, checked) -> { draft.overdueFirst = checked; updatePreview(); }); body.addView(overdue);
        CheckBox empty = new CheckBox(this); empty.setText("Mostrar secciones vacías"); empty.setChecked(draft.showEmpty);
        empty.setOnCheckedChangeListener((button, checked) -> { draft.showEmpty = checked; updatePreview(); }); body.addView(empty);
        for (int order = 0; order < 3; order++) {
            final int at = order; final String section = draft.order[order]; final int slot = WidgetContent.index(section);
            LinearLayout heading = new LinearLayout(this); heading.setGravity(Gravity.CENTER_VERTICAL);
            TextView name = label(WidgetContent.label(section), 16); heading.addView(name, new LinearLayout.LayoutParams(0, -2, 1));
            for (int direction : new int[]{-1, 1}) {
                Button move = new Button(this); move.setText(direction < 0 ? "↑" : "↓"); move.setContentDescription("Mover " + WidgetContent.label(section) + (direction < 0 ? " arriba" : " abajo"));
                move.setEnabled(at + direction >= 0 && at + direction < 3); heading.addView(move, new LinearLayout.LayoutParams(dp(52), dp(48)));
                move.setOnClickListener(view -> { String other = draft.order[at + direction]; draft.order[at + direction] = section; draft.order[at] = other; editor(); });
            }
            body.addView(heading);
            select("Límite de tareas · 0 oculta la sección", new String[]{"0 · Oculta", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"}, draft.limits[slot], index -> draft.limits[slot] = index);
        }
        body.addView(label("Hoy y Vencidas comparten el espacio principal. Mañana sigue siendo una franja compacta. Los límites no afectan a Lista compacta.", 12));
        body.addView(label("3. Apariencia", 19));
        String[] appearances = {"minimal", "medieval", "aurora"}, palettes = {"auto", "light", "dark"}, densities = {"comfortable", "balanced", "compact"};
        select("Estilo", new String[]{"Minimal", "Medieval", "Aurora"}, position(draft.appearance, appearances), index -> draft.appearance = appearances[index]);
        select("Tema de Minimal", new String[]{"Según el sistema", "Claro", "Oscuro"}, position(draft.palette, palettes), index -> draft.palette = palettes[index]);
        select("Densidad", new String[]{"Cómoda", "Equilibrada", "Compacta"}, position(draft.density, densities), index -> draft.density = densities[index]);
        body.addView(label("4. Vista previa", 19)); body.addView(preview);
        body.addView(label("Vista orientativa con tus tareas. El tamaño real y los tiradores dependen del inicio de Android. Redimensiona manteniendo pulsado el widget.", 12));
        Button save = new Button(this); save.setText("Guardar widget"); body.addView(save, new LinearLayout.LayoutParams(-1, dp(54)));
        save.setOnClickListener(view -> {
            WidgetRepository.saveSettings(this, widgetId, draft); WidgetRefresh.one(this, widgetId);
            setResult(RESULT_OK, new Intent().putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, widgetId)); finish();
        });
        Button reset = new Button(this); reset.setText("Restablecer preset"); body.addView(reset);
        reset.setOnClickListener(view -> new AlertDialog.Builder(this).setTitle("¿Restablecer este diseño?").setMessage("Se restablecen los ajustes de esta instancia. Los otros widgets y tus tareas se conservan.")
            .setNegativeButton("Cancelar", null).setPositiveButton("Restablecer", (dialog, which) -> { String preset = draft.preset, appearance = draft.appearance; draft = new WidgetSettings(); draft.preset = preset; draft.appearance = appearance; editor(); }).show());
        Button cancel = new Button(this); cancel.setText("Cancelar"); cancel.setOnClickListener(view -> finish()); body.addView(cancel); updatePreview();
    }
    private void updatePreview() {
        if (preview == null) return;
        preview.removeAllViews();
        int bg = draft.appearance.equals("medieval") ? R.drawable.widget_panel_medieval : draft.appearance.equals("aurora") ? R.drawable.widget_panel_aurora : WidgetRenderer.dark(this, draft) ? R.drawable.widget_panel_dark : R.drawable.widget_panel_light;
        preview.setBackgroundResource(bg);
        TextView header = label("Misiones                         ＋  ⋮", 18); header.setTextColor(WidgetRenderer.text(this, draft)); preview.addView(header);
        WidgetContent content = new WidgetContent(this, draft, 330);
        if (content.all.isEmpty()) { TextView message = label("Sin misiones. Este espacio mostrará tus tareas al crearlas.", 14); message.setTextColor(WidgetRenderer.muted(this, draft)); preview.addView(message); return; }
        if (draft.preset.equals("compact")) {
            for (int i = 0; i < Math.min(6, content.all.size()); i++) preview.addView(WidgetRenderer.row(this, content.all.get(i), draft).apply(this, preview));
        } else for (String section : draft.order) {
            if (draft.limits[WidgetContent.index(section)] == 0) continue;
            int total = content.groups.get(section).size(); if (total == 0 && !draft.showEmpty) continue;
            TextView heading = label(WidgetContent.label(section) + " (" + total + ")", 13); heading.setTextColor(WidgetRenderer.muted(this, draft)); preview.addView(heading);
            java.util.ArrayList<JSONObject> rows = content.selected(section);
            for (JSONObject task : rows) preview.addView(WidgetRenderer.row(this, task, draft).apply(this, preview));
            if (total > rows.size()) { TextView more = label("+" + (total - rows.size()) + " más", 12); more.setTextColor(WidgetRenderer.muted(this, draft)); preview.addView(more); }
        }
        if (preview.getChildCount() == 1) { TextView message = label("Sin tareas en las secciones seleccionadas. Tus otras misiones siguen en la app.", 13); message.setTextColor(WidgetRenderer.muted(this, draft)); preview.addView(message); }
    }
}
