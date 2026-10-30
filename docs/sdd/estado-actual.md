# Punto de partida del proyecto

Revisión inicial: 29 de octubre de 2026. Es un mapa para localizar código, no una certificación de que todas las funciones funcionen en todos los dispositivos. Revisar el código y la ejecución vigente antes de cada cambio.

| Área | Punto de partida observable | Dónde revisar |
| --- | --- | --- |
| App | React, TypeScript, Vite y Capacitor; proyecto Android incluido. | `package.json`, `capacitor.config.ts`, `android/` |
| Misiones | Creación y edición, fechas, frecuencia y recordatorios presentes en el código. | `src/components/TaskView.tsx`, `src/types/index.ts`, `src/services/taskRecurrence.ts` |
| Guardado | Almacenamiento local y sincronización opcional de una copia por usuario con Supabase. | `src/services/storageService.ts`, `src/hooks/useCloudSync.ts`, `src/services/cloudSaveService.ts`, `supabase/migrations/` |
| Concentración | Existe una vista de concentración; no se asume completada toda la visión del Santuario. | `src/components/ConcentrationTreeView.tsx` |
| Mazmorra | Tutorial, combate elemental y escenarios para niveles 1 y 2; hay estructuras para rutas y biomas. Comprobar la experiencia real antes de considerar listo un nivel. | `src/components/DungeonView.tsx`, `src/game/elementalEngine/`, `src/game/expedition/`, `src/game/levels/` |
| Android | Widget, pantalla completa y notificaciones locales mediante Capacitor. La entrega real y los permisos requieren prueba en dispositivo. | `android/app/src/main/`, `src/services/androidWidget.ts`, `src/services/taskReminders.ts` |
| Widgets 004 | Dos presets, configuración nativa por instancia, vista previa, apertura por título, creación y checkbox con cola local por perfil; reconciliación mediante completado compartido y diario recuperable. APK y pruebas automáticas correctos; launcher, aspecto, scroll y 4×2 pendientes en Redmi. | `specs/004-widgets-personalizables/`, `WidgetConfigurationActivity`, `WidgetRepository`, `src/services/taskCompletion.ts` |
| Recordatorios 005 | Alcance aprobado: anticipo más hora límite, Constante configurable hasta completar/detener, controles progresivos y parada por ocurrencia. Implementación y 50 pruebas Node correctas; revisión de formulario en navegador. APK/entrega física aún pendientes en esta revisión. | `specs/005-recordatorios-claros/`, `MissionReminderFields`, `reminderPlan`, `ReminderOverlayStore`, `ReminderRules` |
| Avisos destacados | La entrega externa de 002 falló en la prueba del usuario. El alcance 003 fue aprobado con sonido/vibración configurables; añade pantalla nativa de alarma, permisos diferenciados y prueba externa. La aceptación en Redmi sigue pendiente. | `specs/003-alarma-misiones/`, `src/services/reminderOverlay.ts`, `src/components/ReminderOverlaySettings.tsx`, `android/app/src/main/java/com/taskquest/rpg/Reminder*` |
| iOS | Objetivo de producto; no se observa un proyecto nativo `ios/` en esta revisión. | `capacitor.config.ts` |
| Calidad y APK | Hay pruebas Node y un flujo GitHub Actions que compila un APK de depuración. | `tests/`, `.github/workflows/build-apk.yml` |

El README histórico contiene afirmaciones que pueden no reflejar los cambios posteriores. Ante una discrepancia, verificar el código y actualizar los documentos pertinentes; no asumir que esta tabla ni el README sustituyen una prueba.

La carpeta `public/assets/pixel-crawler/` aparecía sin seguimiento en la revisión inicial. Preservarla y no incluirla automáticamente en commits: confirmar su procedencia y licencia antes de incorporarla al producto.
