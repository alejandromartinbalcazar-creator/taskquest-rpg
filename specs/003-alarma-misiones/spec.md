# Recordatorios visibles sin abrir FocusMission

Estado: alcance aprobado por el usuario con personalización de sonido y vibración. Implementación y pruebas pendientes.

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
