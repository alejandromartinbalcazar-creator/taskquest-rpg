package com.taskquest.rpg;

import android.content.Context; import android.content.Intent; import android.widget.RemoteViews; import android.widget.RemoteViewsService;
import org.json.JSONArray; import org.json.JSONObject; import java.util.*;

public class WidgetTaskRemoteViewsService extends RemoteViewsService {
  @Override public RemoteViewsFactory onGetViewFactory(Intent intent) { return new Factory(this, intent.getStringExtra("theme")); }
  static class Factory implements RemoteViewsFactory {
    final Context context; final String theme; final ArrayList<JSONObject> tasks = new ArrayList<>();
    Factory(Context context, String theme) { this.context = context; this.theme = theme == null ? "medieval" : theme; }
    public void onCreate() {} public void onDestroy() { tasks.clear(); }
    public void onDataSetChanged() { tasks.clear(); try { JSONArray data = new JSONArray(context.getSharedPreferences(WidgetDataPlugin.PREFS, 0).getString(WidgetDataPlugin.TASKS_KEY, "[]")); for(int i=0;i<data.length();i++) { JSONObject t=data.getJSONObject(i); if(!t.optBoolean("completed")) tasks.add(t); } Collections.sort(tasks, (a,b) -> Long.compare(time(a), time(b))); } catch(Exception ignored){} }
    long time(JSONObject t) { try { return java.time.Instant.parse(t.optString("dueDate")).toEpochMilli(); } catch(Exception e) { return Long.MAX_VALUE; } }
    public int getCount() { return tasks.size(); } public long getItemId(int p) { return p; } public boolean hasStableIds() { return false; }
    public RemoteViews getViewAt(int p) { if(p<0||p>=tasks.size()) return null; JSONObject t=tasks.get(p); RemoteViews v=new RemoteViews(context.getPackageName(), R.layout.widget_task_item); boolean overdue=time(t)<System.currentTimeMillis(); v.setTextViewText(R.id.widget_item_title, t.optString("title", "Misión")); v.setTextViewText(R.id.widget_item_due, overdue ? "VENCIDA" : "Próxima misión"); int c=overdue?0xFFEF4444:0xFFE9D5FF; v.setTextColor(R.id.widget_item_title,c); v.setTextColor(R.id.widget_item_due,c); Intent fill=new Intent(Intent.ACTION_VIEW, android.net.Uri.parse("com.taskquest.rpg://widget?action=edit-task&taskId=" + t.optString("id"))); v.setOnClickFillInIntent(R.id.widget_item_root,fill); return v; }
    public RemoteViews getLoadingView() { return null; } public int getViewTypeCount() { return 1; }
  }
}
