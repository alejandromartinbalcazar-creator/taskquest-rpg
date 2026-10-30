package com.taskquest.rpg;
import android.appwidget.AppWidgetManager;
import android.content.*;
import android.widget.*;
import org.json.JSONObject;
import java.util.*;

public class WidgetTaskRemoteViewsService extends RemoteViewsService {
    @Override public RemoteViewsFactory onGetViewFactory(Intent intent) { return new Factory(this, intent.getIntExtra("widgetId", -1), intent.getStringExtra("section")); }
    static class Factory implements RemoteViewsFactory {
        final Context context; final int id; final String section;
        WidgetSettings settings; ArrayList<JSONObject> rows = new ArrayList<>();
        Factory(Context context, int id, String section) { this.context = context; this.id = id; this.section = section == null ? "compact" : section; }
        public void onCreate() { onDataSetChanged(); }
        public void onDestroy() { rows.clear(); }
        public void onDataSetChanged() {
            settings = WidgetRepository.settings(context, id, WidgetRefresh.appearance(context, id));
            int height = AppWidgetManager.getInstance(context).getAppWidgetOptions(id).getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 300);
            rows = new WidgetContent(context, settings, height).rows(section);
        }
        public int getCount() { return rows.size(); }
        public long getItemId(int p) { return p; }
        public boolean hasStableIds() { return false; }
        public RemoteViews getViewAt(int p) { return p < 0 || p >= rows.size() ? null : WidgetRenderer.row(context, rows.get(p), settings); }
        public RemoteViews getLoadingView() { return null; }
        public int getViewTypeCount() { return 1; }
    }
}
