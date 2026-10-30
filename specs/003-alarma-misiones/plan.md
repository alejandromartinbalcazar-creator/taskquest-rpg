# Plan técnico

## Dependencias y riesgos
Se conserva Capacitor y el motor existente de completar misiones. No se añaden servidores ni dependencias de pago. Los avisos Android se programan de forma nativa y no dependen de que el WebView esté abierto. Se comprobarán permiso de notificaciones, alarmas exactas, superposición y avisos de pantalla completa por separado.

## Incrementos
1. Guardar preferencias nativas por dispositivo: sonido, vibración y duración; exponer estado real, ajustes del sistema y prueba externa desde la app.
2. Cuando el modo de alarma esté activo, usar un único planificador nativo para cada recordatorio; cancelar los avisos duplicados de Capacitor. Con el modo desactivado mantener notificaciones locales normales, con canales coherentes con las preferencias.
3. Añadir una notificación nativa de alta importancia y una actividad de alarma con `showWhenLocked`/`turnScreenOn`, pendiente de permiso de pantalla completa. En el inicio/otra aplicación usar la superposición existente cuando sea posible, conservando el aviso urgente si Android impide la ventana.
4. Centralizar sonido/vibración en una señal nativa limitada a la duración elegida, respetando los ajustes del sistema, y detenerla al responder. Las acciones persistidas siguen utilizando el completado/redención existente y la fecha de ocurrencia.
5. Registrar programación, recepción e incidencias de entrega en un diagnóstico local sin credenciales. No consumir un recordatorio como exitoso sin registrar el resultado de presentación.
6. Añadir pruebas de planificación/cancelación, preferencias y acciones; compilar web y APK; documentar explícitamente la prueba pendiente en Redmi.

## Límites y publicación
El permiso de pantalla completa es independiente del de superposición y debe comprobarse en Android 14+. La distribución por Google Play necesitará revisar la elegibilidad de la función de alarma, sin presumir aprobación. El modo de prueba usa el mismo receptor y las mismas preferencias, se dispara después de 10 segundos y no completa tareas ni concede recompensas.

## Archivos principales
`ReminderOverlayStore`, `ReminderOverlayPlugin`, `ReminderOverlayReceiver`, `ReminderOverlayService`, nueva actividad/gestor de alarma; `reminderOverlay.ts`, `taskReminders.ts`, `ReminderOverlaySettings.tsx`, `App.tsx` y pruebas.
