# Desarrollo guiado por especificaciones en FocusMission

SDD significa acordar y conservar una descripción comprobable de lo que se quiere conseguir, relacionarla con un plan y usarla para verificar el resultado. La especificación se actualiza si cambian las decisiones: no basta con escribirla una vez.

## Flujo para una función o cambio relevante

1. **Entender:** revisar el código afectado y anotar el problema, la experiencia deseada y las dudas. Separar lo existente de lo propuesto.
2. **Especificar:** crear `specs/NNN-nombre/spec.md` usando la plantilla. Describir qué verá y podrá hacer el usuario, criterios observables, casos límite y qué queda fuera. Aclarar con el usuario las decisiones que cambien materialmente el resultado.
3. **Planificar:** completar `plan.md` con archivos involucrados, datos, compatibilidad, riesgos, permisos, pruebas y pasos pequeños. La especificación describe el resultado; el plan explica cómo alcanzarlo.
4. **Dividir:** preparar `tasks.md` con tareas ordenadas, verificables y asociadas a los criterios. No marcar ninguna como terminada antes de comprobarla.
5. **Construir y comprobar:** implementar por incrementos; ejecutar compilación y pruebas pertinentes. Para apariencia y controles, probar en la aplicación; para capacidades nativas, probar en el dispositivo o declarar la prueba pendiente.
6. **Cerrar y mantener:** contrastar criterios, código y resultados; documentar evidencias y limitaciones. Si algo cambió, actualizar los documentos. Registrar en el PR lo necesario para revisar el resultado, cuando corresponda.

Para un bug pequeño, normalmente basta con registrar causa, corrección y comprobación en el PR o en la especificación existente. Para una idea todavía no decidida, primero evaluar alternativas y preguntas: no crear una solución como si ya estuviera aprobada.

## Plantillas y ejemplo

- Plantillas: `docs/sdd/templates/spec.md`, `plan.md` y `tasks.md`.
- Ejemplo retrospectivo: `specs/001-recordatorios-locales/`. Describe el cambio existente y separa las pruebas automáticas del test pendiente en Android.
- Crear un número y nombre nuevos por funcionalidad, por ejemplo `specs/002-mejorar-santuario/`. No reutilizar `001`.

No es necesario instalar una herramienta adicional para usar este flujo. Está inspirado en el proceso general de [GitHub Spec Kit](https://github.com/github/spec-kit); este repositorio usa documentos propios y no incluye sus comandos ni requiere una cuenta de pago adicional.
