# Tareas y evidencia

- [x] Presentar alcance al usuario y recoger aprobación con personalización de sonido/vibración.
- [x] Implementar preferencias persistentes y permisos diferenciados en la app; verificación física pendiente.
- [x] Implementar planificador nativo independiente, con cancelación del plan de Capacitor al migrar al modo de alarma.
- [x] Implementar pantalla nativa de alarma en bloqueo/pantalla apagada y señal configurable; no aceptada aún en dispositivo.
- [x] Implementar prueba externa a 10 segundos, diagnóstico y acciones con validación de ocurrencia.
- [x] `npm run build`: correcto. `node --test tests/*.test.mjs`: 34 pruebas correctas, incluyendo migración de planificador, canales de preferencias, cancelación y fallos de entrega.
- [x] Compilación APK y tarea `testDebugUnitTest` correctas en [GitHub Actions 40995806350](https://github.com/alejandromartinbalcazar-creator/taskquest-rpg/actions/runs/40995806350), commit `7778b2b`. Se añadieron 6 pruebas JUnit de selección de superficie y duración. Artefacto `FocusMission-APK` disponible.
- [ ] Validación física: inicio, otra app, bloqueo y pantalla apagada en Redmi. Pendiente del dispositivo; no declarar satisfecha por una compilación.
- [x] Implementar apertura del detalle al tocar título/descripción/zona informativa sin completar la tarea. Build web y 41 pruebas Node correctos; compilación APK con pruebas nativas en Actions `41063656224`.
- [ ] Probar físicamente el nuevo toque al detalle, su desbloqueo y que los botones Realizado/Cerrar conserven sus acciones.
