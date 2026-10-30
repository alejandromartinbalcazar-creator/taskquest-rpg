# Plan

1. Conservar el canal de notificaciones existente y añadir una presentación dentro de la app con acciones reutilizando el completado normal.
2. Diseñar la superposición Android como componente nativo independiente de Capacitor, con permiso explícito y notificación como respaldo. Debe recibir la identidad y la ocurrencia de la tarea; no debe modificar directamente el almacenamiento web ni conceder recompensas por su cuenta.
3. Sincronizar altas, cambios, cancelaciones, reinicio del teléfono y eventos entre programación nativa y notificaciones sin perder alarmas. Evitar que avisos antiguos completen nuevas ocurrencias.
4. Comprobar compilación, pruebas y casos en dispositivo físico; registrar límites y resultados.

La ventana superpuesta utiliza `ReminderOverlayPlugin`, un receptor de alarmas y `ReminderOverlayService` con tipo `shortService`, permiso `SYSTEM_ALERT_WINDOW` y una ventana `TYPE_APPLICATION_OVERLAY`. El servicio dura como máximo 90 segundos y no queda funcionando permanentemente. El receptor restaura las alarmas futuras tras reinicio/actualización. La alarma exacta solicitada por el usuario permite iniciar el servicio desde segundo plano; si Android lo rechaza, permanece la notificación original.

El complemento conserva un espejo privado de los avisos programados, su identidad y ocurrencia. Las acciones se reconocen después de aplicar el completado en React. Las fechas distintas impiden completar la siguiente recurrencia desde un aviso viejo. El guardado del proyecto usa claves locales separadas para jugador y misiones; este cambio no introduce una transacción atómica entre ellas.

Referencias consultadas: [restricciones de servicios en segundo plano](https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start), [shortService](https://developer.android.com/develop/background-work/services/fgs/service-types) y [cambios Android 15](https://developer.android.com/about/versions/15/behavior-changes-15). Una compilación web no demuestra su funcionamiento en segundo plano.
