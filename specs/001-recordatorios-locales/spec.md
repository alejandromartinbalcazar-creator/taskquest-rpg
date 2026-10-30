# Recordatorios locales para misiones

- Estado: implementado; validación en Android pendiente.
- Tipo: registro retrospectivo de la petición del usuario, no una función nueva.
- Base revisada: cambios hasta `2e4b6e7` en la rama de trabajo.
- Referencia: historia de usuario «Recordatorios y Notificaciones Locales para Misiones Pendientes», compartida en esta conversación.

## Problema y objetivo

Una persona necesita recordar una misión pendiente aunque FocusMission esté cerrada, sin depender de un servidor de notificaciones de pago. La misión puede tener una hora de aviso independiente de su vencimiento.

## Experiencia esperada

1. Al crear o editar una misión, elegir «En 1 hora», «En 2 horas», «En 4 horas», una fecha y hora del aviso, o una de las opciones relativas al vencimiento existentes.
2. Al guardar, conceder permiso de notificaciones si Android lo solicita. La tarjeta comunica si el aviso está programado o no.
3. Al llegar la hora, Android muestra el título de la misión y su descripción o un mensaje predeterminado. Al pulsar el aviso, se abre la misión en Misiones.
4. Si la misión se completa o elimina antes del aviso, se cancela su alarma. Una misión recurrente conserva los avisos relativos al vencimiento para su siguiente ocurrencia; un aviso de fecha independiente corresponde solo a la ocurrencia completada.

## Criterios de aceptación

- [ ] CA-01: Crear y editar desde el formulario un aviso de 1, 2 o 4 horas y uno de fecha y hora independiente; comprobar en la tarjeta la fecha y el estado real.
- [ ] CA-02: Con permisos concedidos, recibir el aviso local en Android con la app cerrada normalmente y la pantalla apagada; comprobar que muestre el nombre y la descripción o el texto predeterminado.
- [ ] CA-03: Al tocar el aviso, abrir la misión correspondiente tanto con la app abierta como al iniciarla desde el aviso.
- [ ] CA-04: Completar o borrar antes de la hora cancela el aviso; editarlo cambia la hora y el contenido sin dejar una alarma anterior.
- [ ] CA-05: Sin permiso de notificaciones, informar que el aviso no está activo. Sin permiso de alarmas exactas, informar que puede ser aproximado y ofrecer acceso a los ajustes.

Las casillas permanecen abiertas hasta realizar el recorrido en Android. No indican que falte implementar el código.

## Casos límite y restricciones

- La fecha independiente debe ser futura al crearla; un aviso pasado no debe volver a dispararse automáticamente.
- Los avisos locales dependen de permisos y de la gestión de energía de Android; no se garantiza un minuto exacto bajo todas las condiciones ni después de forzar la detención de la app.
- Los datos de la misión se conservan en el guardado existente; no agregar secretos ni servicio de pago.
- El comportamiento de Android en el Redmi Note 14 Pro, incluidos pantalla apagada, ajustes de batería y arranque desde una notificación, está pendiente de prueba real.
- La función empaquetada como PWA/navegador y la publicación iOS no están validadas por esta especificación.

## Fuera de alcance

Notificaciones push remotas, servidor propio de avisos, sincronización de alarmas entre dispositivos como garantía, y cambios del sistema de recompensas.

## Evidencia y validación

| Criterio | Evidencia disponible | Estado |
| --- | --- | --- |
| CA-01 | `TaskView.tsx`, `reminderPlan.ts`; pruebas de fechas y programación simulada. | Implementación presente; UI real pendiente. |
| CA-02 | `taskReminders.ts`, complemento nativo y compilación APK de GitHub Actions para `2e4b6e7`. | APK compilado; entrega real pendiente. |
| CA-03 | Listener en `App.tsx`, identificador de tarea y apertura del editor en `TaskView.tsx`; prueba de extracción de identificador. | Inicio y toque en dispositivo pendientes. |
| CA-04 | `tests/task-reminders.test.mjs`: edición, finalización, eliminación y secuencia rápida con complemento simulado. | Automatizado con simulación; dispositivo pendiente. |
| CA-05 | `TaskView.tsx` y pruebas de permisos simulados. | Flujos reales de permisos pendientes. |

Última evidencia registrada en la conversación: `node --test tests/*.test.mjs` pasó 28 pruebas; `npm run build` pasó; [GitHub Actions compiló el APK de depuración](https://github.com/alejandromartinbalcazar-creator/taskquest-rpg/actions/runs/40633419178). Estas pruebas no prueban por sí solas que Android entregue el aviso a tiempo.
