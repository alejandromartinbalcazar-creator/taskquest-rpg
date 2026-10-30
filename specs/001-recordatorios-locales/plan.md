# Plan retrospectivo: recordatorios locales

Este documento registra el enfoque aplicado hasta `2e4b6e7`; no sustituye una nueva evaluación si se cambian los requisitos.

## Estado previo y dependencias

La app ya tenía tareas, fechas, opciones de recordatorio relativas al vencimiento y el complemento `@capacitor/local-notifications`. El incremento añadió una hora independiente y conectó el ciclo de vida del aviso a las misiones.

## Enfoque aplicado

- `src/types/index.ts` y `src/services/reminderPlan.ts`: representar la hora independiente y calcular fechas.
- `src/components/TaskView.tsx`: opciones rápidas, selector de fecha, permisos y estado visible.
- `src/services/taskReminders.ts`: registrar, actualizar y cancelar notificaciones locales; distinguir alarmas exactas de aproximadas y preservar avisos de otras funciones.
- `src/App.tsx`: sincronizar con misiones, responder al toque y tratar la siguiente ocurrencia de una tarea recurrente.
- `capacitor.config.ts` y `android/app/src/main/res/drawable/ic_stat_reminder.xml`: icono de notificación. La sincronización de Capacitor registra el complemento en Android.

## Riesgos y compatibilidad

Los permisos de notificaciones y de alarmas exactas pueden estar desactivados. El ahorro de energía puede retrasar entregas. La sincronización de datos entre dispositivos no equivale a compartir alarmas nativas; cada dispositivo programa sus propias alertas. La prueba de funcionamiento con la app cerrada debe realizarse sin forzar su detención y documentar los ajustes del teléfono.

## Validación

- Automatizada: `node --test tests/task-reminders.test.mjs` para el servicio con complemento simulado; `node --test tests/*.test.mjs` y `npm run build` para regresiones y compilación.
- Android: instalar el APK, conceder permisos, crear un aviso cercano, cerrar la app normalmente, apagar pantalla y comprobar recepción y toque. Repetir con completar, borrar y editar antes del aviso; comprobar permisos denegados y ajustes de batería.
- Pendiente: ejecución y evidencia en Redmi Note 14 Pro; no hay validación real de iOS ni PWA.
