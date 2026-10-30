# Recordatorios visibles sin abrir FocusMission

Estado: alcance aprobado; implementación y compilación realizadas. Aceptación física pendiente en Redmi.

## Necesidad
El recordatorio debe llamar la atención en el momento programado aunque el usuario esté en la pantalla de inicio del teléfono, usando otra aplicación o con el teléfono bloqueado. Abrir FocusMission no puede ser el requisito para que el aviso se vea.

## Punto de partida comprobado
- El usuario informa que la tarjeta solo apareció al entrar a FocusMission. La validación externa de la versión 002 no está aprobada.
- El código del receptor y del servicio de superposición descarta el aviso con el teléfono bloqueado. El receptor también lo descarta con la pantalla apagada.
- No hay una pantalla nativa de alarma ni una solicitud de autorización para avisos a pantalla completa.
- No se ha determinado por qué el aviso externo no apareció en el inicio u otra aplicación en el Redmi. Revisar programación, permisos, recepción y errores nativos sin atribuir una causa al teléfono sin evidencia.

## Experiencia propuesta para aprobar
| Situación | Resultado esperado a la hora elegida |
| --- | --- |
| Pantalla de inicio del teléfono | Tarjeta visible sobre el inicio, sin abrir FocusMission. |
| Otra aplicación abierta | Tarjeta visible sobre esa aplicación, sin necesidad de cambiar a FocusMission. |
| Teléfono bloqueado o pantalla apagada | Aviso nativo de tipo alarma que pueda encender la pantalla y mostrarse sobre el bloqueo con las autorizaciones de Android. No sustituir silenciosamente este objetivo por una notificación común y darlo por cumplido. |
| FocusMission abierta | Tarjeta dentro de la aplicación; es un caso adicional, no el criterio principal de éxito. |

El aviso presenta título de la misión, descripción breve y dos acciones: «Realizado» y «Cerrar». Cerrar no completa la misión. Realizado utiliza las reglas existentes de completado/redención y debe proteger la ocurrencia de las tareas recurrentes. Si Android exige desbloqueo para confirmar la acción, se solicita; no se elimina ni se evita el bloqueo de seguridad.

Ampliación puntual solicitada por el usuario: tocar el título, descripción o zona informativa abre directamente el detalle/editor de esa misión en FocusMission. Este toque cierra/detiene el aviso actual sin completar la tarea ni conceder recompensas. Los botones conservan sus acciones independientes. Desde el bloqueo se solicita desbloquear antes de abrir el detalle; cancelar el desbloqueo conserva la misión pendiente. El panel interno ofrece el mismo acceso con teclado y lector de pantalla. La prueba de recordatorio abre Misiones, sin intentar editar una tarea ficticia.

Implementación de esta ampliación: `ReminderCard`, `ReminderOverlayService`, `ReminderAlarmActivity`, `MissionReminderSheet` y navegación de `App`. Se conserva la identidad del aviso tocado durante el desbloqueo. Build web y 41 pruebas Node correctos. APK y tarea de pruebas nativas compilados correctamente en [Actions 41063656224](https://github.com/alejandromartinbalcazar-creator/taskquest-rpg/actions/runs/41063656224), commit `3e30c86`, artefacto `FocusMission-APK`. Pendiente la comprobación física del toque de título/descripción, cancelación del desbloqueo y conservación de las acciones Realizado/Cerrar en el Redmi. El usuario confirmó previamente que los botones funcionan; eso no valida todavía este acceso nuevo.

## Decisiones incluidas en la revisión
- El aspecto en el bloqueo puede ser una pantalla de alarma, no necesariamente la misma tarjeta inferior de la app.
- Preferencias del usuario en la app: sonido activado/desactivado, vibración activada/desactivada y duración de la señal/aviso de 15, 30 o 60 segundos. Por defecto se proponen 30 segundos, sonido y vibración activados al habilitar expresamente el modo de alarma. Los ajustes se conservan localmente por teléfono y se aplican a los avisos futuros. Android y No molestar pueden restringir la señal; no se altera su volumen ni se fuerza sonido en modo silencio.
- Los permisos se explican antes de activarlos. Si faltan, la app muestra qué capacidad no está disponible y ofrece una prueba de aviso externo. No afirmar «activado» si solo funciona el panel interno.
- La aparición del aviso no requiere abrir FocusMission. El comportamiento de guardar «Realizado» puede requerir abrir/desbloquear la app según el sistema actual; esto debe explicarse en la revisión del plan y no confundirse con la entrega del aviso.

## Límites reales por verificar
Android distingue superposición sobre aplicaciones y avisos de alarma a pantalla completa. El permiso de superposición no equivale al de pantalla completa. En Android reciente, este último necesita comprobar su autorización; Google Play restringe su concesión automática a usos admitidos. No se presupone que FocusMission cumpla los requisitos de publicación por añadir un permiso al manifiesto.

No se puede prometer entrega universal con «Forzar detención», permisos denegados, restricciones del fabricante o ajustes de No molestar. Debe indicarse cuándo la configuración impide el comportamiento solicitado. El usuario puede desactivar este modo.

## Criterios de aceptación
1. En el Redmi Note 14 Pro, programar recordatorios futuros distintos y probar: inicio del teléfono, otra aplicación, pantalla bloqueada y pantalla apagada.
2. En los cuatro casos externos, el aviso se ve a la hora sin entrar previamente a FocusMission. Registrar versión de Android/HyperOS y permisos usados.
3. Verificar «Realizado» y «Cerrar», incluyendo una tarea recurrente y una misión vencida. No duplicar recompensas ni completar la siguiente ocurrencia.
4. Editar, completar o eliminar una misión cancela el aviso anterior; reiniciar el teléfono conserva los avisos futuros cuando el sistema lo permite.
5. Probar permisos denegados y limitaciones; la app informa qué falta y no declara un éxito inexistente.
6. Compilación y pruebas automáticas correctas son necesarias, pero no sustituyen los cuatro ensayos externos. Si solo funciona con FocusMission abierta, la función no se acepta como terminada.

## Revisión antes de programar
El usuario respondió «Sí» al alcance y pidió que sonido y vibración fueran configurables para cada usuario. Esta respuesta aprueba la implementación con esa personalización. La viabilidad final y la entrega todavía requieren pruebas en Android. La aceptación externa queda pendiente aunque compile el APK.

## Fuentes
- [Android: avisos urgentes y comportamiento en pantalla bloqueada](https://developer.android.com/develop/ui/compose/notifications/create-notification).
- [Android 14: autorización de avisos a pantalla completa](https://developer.android.com/about/versions/14/behavior-changes-14).
- [Android: ventanas de superposición](https://developer.android.com/reference/android/view/WindowManager.LayoutParams).

## Resultado de implementación y evidencia
Implementados ajustes locales de sonido, vibración y duración (15/30/60 segundos), controles de permisos separados, prueba externa a 10 segundos y diagnóstico local. El modo de alarma tiene un solo planificador nativo; se cancelan los avisos duplicados de Capacitor al activarlo. El bloqueo y la pantalla apagada solicitan una actividad nativa de alarma; ya no se descartan expresamente como en 002.

Compilación web y 34 pruebas Node correctas. Compilación Android y tarea de pruebas unitarias nativas correctas en [Actions 40995806350](https://github.com/alejandromartinbalcazar-creator/taskquest-rpg/actions/runs/40995806350), commit `7778b2b`. Estas pruebas verifican lógica y compilación, no la entrega visual en un dispositivo. No se ha realizado la prueba en Redmi ni se ha confirmado el cumplimiento de los cuatro casos externos.

Los ajustes ordinarios usan un conjunto acotado de canales de Android (con/sin sonido y con/sin vibración). Los cambios que el usuario haga directamente en Android prevalecen sobre los valores iniciales de esos canales. La señal nativa respeta silencio y No molestar; en Android 8 el tono puede sonar una sola vez porque la repetición de Ringtone requiere Android 9+. La señal se detiene al cerrar/completar o al alcanzar su duración. El panel interno puede permanecer disponible hasta que se responda.

Si la pantalla completa no está autorizada, se solicita el aviso urgente disponible y la configuración indica que falta permiso. Esto no satisface por sí mismo el criterio de pantalla de alarma en bloqueo. La función permanece pendiente de aceptación física aunque el APK esté disponible.
