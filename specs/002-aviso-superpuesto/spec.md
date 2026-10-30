# Aviso destacado de misiones

## Objetivo
Al llegar un recordatorio, mostrar un aviso legible con la misión y las acciones «Realizado» y «Cerrar». Realizado utiliza el mismo proceso y recompensas que completar desde Misiones; Cerrar no modifica la misión.

## Decisión de experiencia
En Android se desea mostrar una ventana sobre otras aplicaciones, con permiso especial concedido de forma voluntaria. La notificación local sigue siendo el respaldo cuando no se pueda mostrar la ventana. Cuando FocusMission está abierta, el aviso debe aparecer dentro de la aplicación. La entrega con el dispositivo bloqueado depende de Android y de los ajustes del fabricante; no se garantiza antes de la prueba.

## Comportamiento implementado
- En Misiones, «Avisos sobre otras aplicaciones» permite activar/desactivar la función; al activarla se abren los ajustes del permiso si falta.
- Requiere Android 8 o posterior, notificaciones autorizadas y permiso «Alarmas y recordatorios». Sin estos permisos queda la notificación ordinaria según los permisos disponibles.
- Con otra aplicación abierta y el dispositivo desbloqueado, una ventana nativa aparece desde abajo con el título, descripción y dos acciones. Desaparece a los 45 segundos si no se responde; la notificación original permanece disponible. Varias alertas se presentan en cola durante una sesión de hasta 90 segundos; las restantes conservan sus notificaciones.
- «Realizado» registra una acción pendiente y abre FocusMission para aplicar el completado normal; «Cerrar» descarta la ventana sin completar la tarea.
- Una misión vencida sigue siendo accionable; si tiene Deuda de Honor se utiliza la misma redención que en su tarjeta, conservando las reglas y recompensas existentes.
- Con FocusMission visible, la notificación presenta un panel dentro de la aplicación. La pulsación de una notificación nueva también abre ese panel; los avisos antiguos sin metadatos mantienen su apertura del editor.
- Con el teléfono bloqueado se utiliza la notificación habitual. No se solicita permiso de pantalla completa ni se intenta desbloquear el teléfono.
- La implementación es local y no añade servicios de pago.

## Seguridad y casos límite
- Los recordatorios de tareas eliminadas, terminadas o de una ocurrencia anterior no deben completar otra ocurrencia ni conceder recompensas duplicadas.
- Mantener la programación, cancelación y sincronización de los recordatorios existentes.
- No exigir el permiso de superposición para crear misiones.
- No afirmar compatibilidad con iOS o navegadores para la superposición nativa Android.

## Validación pendiente
Probar aplicación en primer plano, otra aplicación abierta, aplicación cerrada, pantalla bloqueada, permisos denegados, misión recurrente, edición y cancelación en un Redmi. Comprobar además la política vigente antes de publicar.

## Evidencia
La compilación web y 30 pruebas Node pasan. Las pruebas incluyen la fecha de ocurrencia, el reemplazo/cancelación del espejo nativo, el rechazo de acciones de tareas terminadas, eliminadas o de otra recurrencia y el respaldo de la notificación si falla el complemento de superposición. No prueban la ventana Android, su animación ni la entrega en el dispositivo. La compilación APK final pasó en [GitHub Actions, commit 0844f7d](https://github.com/alejandromartinbalcazar-creator/taskquest-rpg/actions/runs/40991533895) y produjo el artefacto `FocusMission-APK`. Este equipo no dispone de JDK/SDK configurados.

Las restricciones de Android y los ajustes de HyperOS pueden impedir una ventana aun con permisos; la notificación es el respaldo. El usuario debe volver a abrir la app después de un «Forzar detención». La entrega exacta tampoco está garantizada por la mera compilación.
