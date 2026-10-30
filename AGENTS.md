# Instrucciones para trabajar en FocusMission

Estas instrucciones se aplican a este repositorio. Las peticiones actuales del usuario y las instrucciones de mayor prioridad prevalecen sobre esta guía.

## Antes de cambiar el proyecto

- Revisar el estado de Git y preservar cambios existentes y recursos del usuario. No reiniciar ni borrar trabajo ajeno.
- Consultar `docs/sdd/vision.md` y `docs/sdd/estado-actual.md`; contrastar el estado descrito con el código relevante antes de afirmarlo.
- Para una funcionalidad nueva, un cambio de comportamiento o un rediseño relevante, seguir `docs/sdd/flujo.md`. Crear o actualizar una especificación pequeña en `specs/` antes de programar. Una corrección puntual o cambio trivial no necesita tres documentos nuevos.
- Separar hechos observados, decisiones y suposiciones. Preguntar cuando una decisión pendiente cambie materialmente el resultado y no pueda inferirse del contexto. No bloquear el trabajo independiente por una preferencia menor.
- No presentar la visión futura como si ya estuviera implementada; no modificar funcionalidades ajenas sin justificación.

## Durante la implementación

- Trabajar en incrementos acotados que puedan comprobarse. Reutilizar las mecánicas y datos existentes, y separar reglas de negocio, interfaz y APIs nativas cuando sea práctico.
- Preservar las partidas, misiones, compatibilidad con datos anteriores y credenciales. No incluir secretos ni archivos `.env` en commits.
- En combate, distinguir tamaño visual, impacto de daño y colisión de pies. No cambiar daño, recetas o progresión por accidente. Para gráficos y controles, comprobar también la experiencia visible y táctil; una compilación no demuestra que se vea o se sienta bien.
- Las funciones de Android e iOS deben indicar sus requisitos y límites reales. No prometer notificaciones exactas, funcionamiento en segundo plano o bloqueo de apps sin comprobarlos en la plataforma.
- Evitar dependencias y costes externos innecesarios; registrar cualquier dependencia o coste nuevo antes de adoptarlo.

## Comprobación y entrega

- Ejecutar `npm run build` y las pruebas pertinentes a la modificación. Para la suite actual: `node --test tests/*.test.mjs`. Si no puede ejecutarse una prueba, indicar por qué.
- Si hay UI, arte, audio o controles, comprobarlos en la app o en un dispositivo cuando sea posible. Indicar expresamente si la verificación visual o del Redmi quedó pendiente.
- Registrar en la especificación qué se comprobó, cómo y qué falta. No marcar una prueba manual como aprobada sin haberla realizado.
- Informar el resultado, limitaciones y ruta de la especificación. Hacer commit, push o PR solo cuando el usuario lo solicite o ya lo haya autorizado en la conversación. No incluir archivos no relacionados.
