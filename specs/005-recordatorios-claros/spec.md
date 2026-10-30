# Fecha límite y recordatorios claros de misiones

- Estado: APROBADO por el usuario el 30 de octubre de 2026. Implementación y validación en curso.
- Solicitud: simplificar la configuración, distinguir vencimiento de aviso y añadir siempre el aviso de la hora límite cuando los recordatorios estén habilitados.
- Plataforma inicial: app Android existente; no se amplía aquí el soporte nativo de iOS.
- Aprobación recibida: experiencia, reglas y compatibilidad de este documento, incluyendo repetición después del límite hasta completar o detener avisos. Plan y tareas preparados antes de programar.

## 1. Problema comprobado

El formulario mezcla tres conceptos: fecha límite, avisos relativos al vencimiento y avisos calculados desde el momento de guardar. Presenta simultáneamente un desplegable, botones «En 1/2/4 horas» y campos adicionales que no siempre se entiende a qué fecha se refieren.

En el código actual `Task` conserva un único `reminderType` y, opcionalmente, `reminderAt`/`reminderCustomMinutes`. `reminderDateForTask()` calcula una sola fecha y tanto el planificador nativo como el de notificaciones habituales programan normalmente un aviso por misión. Elegir «1 día antes» sustituye al aviso de vencimiento: no se añade otro a la hora límite. El cambio necesario incluye interfaz, planificación, identificación y cancelación de avisos; no es solo un cambio de textos.

## 2. Formulario propuesto

Orden: nombre de la misión → descripción opcional → fecha y hora límite → recordatorios → frecuencia → demás detalles existentes.

### Fecha y hora límite

- Etiqueta: **Fecha y hora límite**.
- Es el momento en que la tarea vence, no el momento de un aviso anticipado.
- Mantener calendario y hora local, con el formato de 12/24 horas del dispositivo cuando corresponda.
- Sustituir el texto actual por: **«Recuerda que, si no completas la misión, tu personaje sufrirá consecuencias.»**
- El mensaje es breve y secundario; no incluye «Elige el día y la hora local» ni un bloque de advertencia grande.
- No se modifican las penalizaciones o recompensas del juego en este incremento.

### Recordatorios

Un solo selector, con **Ninguno** como valor inicial de una misión nueva. No añadir un interruptor adicional que pueda estar «activado» a la vez que el selector dice «Ninguno».

Pregunta visible: **¿Cuándo quieres que te avisemos?**

| Elección | Avisos que se programan para la ocurrencia pendiente |
| --- | --- |
| **Ninguno** | Ningún aviso, tampoco a la hora límite. |
| **A la hora límite** | Un aviso al vencer. |
| **5 minutos antes y a la hora límite** | Dos avisos. |
| **10 minutos antes y a la hora límite** | Dos avisos. |
| **30 minutos antes y a la hora límite** | Dos avisos. |
| **1 hora antes y a la hora límite** | Dos avisos. |
| **1 día antes y a la hora límite** | Dos avisos. |
| **2 días antes y a la hora límite** | Dos avisos. |
| **Constante** | Avisos repetidos desde el anticipo elegido, además del aviso de la hora límite. |
| **Personalizado…** | Un aviso anticipado definido por el usuario y el aviso de la hora límite. |

La frase «y a la hora límite» debe ser visible en la opción seleccionada y/o en su resumen inmediato; no dejar esta regla escondida en los ajustes.

Los botones «En 1 hora», «En 2 horas» y «En 4 horas» desaparecen del formulario principal. «Fecha y hora del aviso», «A la hora elegida» y «minutos antes de vencer» no se presentan juntos como controles independientes ambiguos.

## 3. Personalizado, sin controles mezclados

Al elegir Personalizado se muestran solo los campos de ese modo:

1. **Tiempo antes del límite:** «Avisarme [cantidad] [minutos / horas / días] antes del límite».
2. Como alternativa dentro de Personalizado, **Elegir una fecha y hora:** calendario y hora concreta para el aviso anticipado. No se muestran simultáneamente ambos juegos de campos.

La cantidad debe ser positiva y válida. Una fecha personalizada nueva debe ser futura y anterior a la hora límite. Si coincide con el límite, se reduce a un solo aviso y se explica en el resumen. No se aceptan avisos personalizados nuevos posteriores al límite en este flujo de anticipación.

No se incluyen aquí botones para contar desde ahora. La repetición pertenece a la opción Constante descrita a continuación, sin mezclarla con los campos de Personalizado.

### Modo Constante: conservarlo y hacerlo explícito

Constante es una opción voluntaria para quien necesita varios avisos antes de actuar. Significa emitir nuevos avisos periódicos mientras la ocurrencia siga pendiente; dejar una notificación fija en la barra no satisface este comportamiento.

Solo al seleccionarlo aparecen dos controles compactos:

- **Empezar:** cuánto tiempo antes del límite comienzan los avisos.
- **Repetir cada:** intervalo entre avisos.

Valores iniciales propuestos para revisión: empezar **1 hora antes** y repetir cada **30 minutos**, con opciones de intervalo **15, 30 o 60 minutos**. Los anticipos pueden reutilizar los del selector y un tiempo personalizado positivo. Elegir Constante no cambia el valor inicial Ninguno de otras misiones.

Se incluye siempre el aviso de la hora límite, aunque no coincida con el intervalo. Si coinciden dos eventos, se entrega uno. Si el comienzo ya pasó, se omiten los intervalos pasados y se calcula el siguiente futuro, manteniendo el aviso principal; no emitir todos los avisos atrasados al guardar, reiniciar o recuperar conexión.

**Decisión confirmada por el usuario:** la repetición continúa después de la hora límite mientras la ocurrencia siga pendiente, hasta completarla o detener sus avisos. Superar el límite no desactiva la serie. El aviso principal no reinicia el intervalo: los avisos posteriores mantienen la cadencia configurada desde el comienzo, sin duplicar instantes coincidentes.

El usuario puede detener la repetición de esta ocurrencia desde el detalle de la misión mediante **Detener repetición**; esto conserva el aviso de la hora límite si aún no llegó. Elegir Ninguno desactiva todos los avisos. Completar o eliminar cancela tanto la repetición como el aviso principal.

## 4. Resumen visible antes de guardar

Debajo del selector se muestra una sola línea de resumen. El enlace discreto **Ver horarios** despliega las fechas reales calculadas para comprobarlas sin llenar el formulario de texto.

Ejemplo: límite **31 de octubre, 20:00**; elección **1 día antes y a la hora límite**:

Resumen: **«Un día antes y al vencer.»** Al desplegar Ver horarios:

> Te avisaremos:
> - 30 de octubre, 20:00 · Un día antes.
> - 31 de octubre, 20:00 · Hora límite.

Con Ninguno: **«No recibirás recordatorios de esta misión.»**

Con A la hora límite: **«Te avisaremos el 31 de octubre a las 20:00.»**

Si el anticipo ya pasó pero el límite sigue en el futuro, no bloquear la creación de la misión: **«El aviso anticipado ya pasó. Te avisaremos a la hora límite: hoy, 20:00.»** No enviar el anticipo inmediatamente ni simular que quedó programado. Conservar la preferencia para las siguientes ocurrencias si la misión se repite.

Si el límite ya pasó, no programar retroactivamente su aviso: **«La fecha límite ya pasó. Reprograma la misión para recibir un nuevo aviso.»** Editar solo el título o la descripción de una misión vencida no debe quedar bloqueado por un aviso antiguo.

Cambiar la fecha límite actualiza inmediatamente este resumen. No confundir la fecha/hora elegida con la hora a la que se guardó el formulario.

Con Constante, ejemplo de resumen: **«Cada 30 min desde 1 h antes, hasta completar o detener.»** Ver horarios muestra comienzo, próximo aviso, intervalo y hora límite, e indica que también se avisa al vencer. No listar infinitas fechas.

### Presentación compacta y amigable

- Una sola sección Recordatorios, sin bloques de instrucciones ni advertencias grandes.
- Ninguno y A la hora límite no muestran campos adicionales.
- Las opciones anticipadas muestran únicamente el resumen y Ver horarios.
- Personalizado y Constante despliegan sus controles al seleccionarlos; cambiar de opción oculta los controles que ya no aplican.
- Sonido, vibración y presentación se conservan en los ajustes existentes. No duplicarlos en cada misión.
- Mostrar una sola advertencia breve y accionable cuando falte permiso o haya un error; no prometer un recordatorio activo si no se pudo programar.
- En el listado de misiones, indicar el recordatorio con un icono y texto corto, por ejemplo «Al vencer» o «Cada 30 min», sin repetir las instrucciones del formulario.

## 5. Regla principal de entrega

Cuando Recordatorios sea distinto de Ninguno y la hora límite esté en el futuro, se debe programar **siempre el aviso de la hora límite**, haya o no un aviso anticipado.

Los modos anticipados normales necesitan un anticipo y un aviso principal: máximo dos avisos por ocurrencia. Constante es la excepción explícita y añade eventos periódicos. Si las fechas coinciden, se programa uno para evitar mensajes duplicados.

Todos los avisos usan la presentación configurada por el usuario: notificación habitual o modo de alarma/ventana, con sus preferencias de sonido, vibración y duración. No se añaden controles de sonido duplicados en cada formulario de tarea. Constante repite avisos separados; no mantiene sonido ni vibración continuos entre ellos ni deja un servicio de alarma activo permanentemente.

- Aviso anticipado: mensaje breve como «Tu misión vence mañana a las 20:00».
- Aviso principal: «Llegó la hora límite de tu misión».
- Ambos muestran el nombre de la tarea y permiten abrir su detalle tocando la zona informativa, como en la función existente.

Esta regla describe la programación requerida; la recepción en Android sigue dependiendo de permisos, configuración del sistema y restricciones del fabricante. Si falta un permiso o falla la programación, informar del estado real; no mostrar dos avisos como programados si solo quedó uno o ninguno.

## 6. Acciones: diferenciar aviso de misión

Cada aviso tiene identidad propia y referencia a la misma tarea y ocurrencia. Anticipo, hora límite e intervalos constantes no deben sobrescribirse por compartir un id. La cancelación debe distinguir el evento mostrado, la serie de repetición y todos los eventos de la ocurrencia.

| Acción | Efecto requerido |
| --- | --- |
| Cerrar el aviso anticipado | Descartar solo ese aviso. El aviso de la hora límite se mantiene. |
| Tocar título/descripcion del anticipo | Abrir el detalle sin completar la tarea y sin cancelar el aviso principal futuro. |
| Marcar Realizado antes del límite | Completar la ocurrencia con las reglas existentes y cancelar todos sus avisos. |
| Completar desde app o widget | El mismo resultado: cancelar todos los avisos de esa ocurrencia, también los ya mostrados cuando corresponda. |
| Cerrar cualquier aviso constante | Descartar solo ese evento. Mantener los próximos intervalos previstos y el aviso principal; no confundir Cerrar con Detener repetición. |
| Cerrar el aviso de la hora límite | Descartar ese aviso sin completar la misión. Si Constante estaba seleccionado, la repetición continúa hasta completar o detener sus avisos. |
| Detener repetición desde el detalle | Cancelar los intervalos constantes de esta ocurrencia y conservar su aviso principal futuro. No desactivar otras misiones. |
| Eliminar la tarea | Cancelar todos sus avisos pendientes/mostrados. |
| Cambiar el límite o los recordatorios | Cancelar los avisos sustituidos y programar el nuevo conjunto, conservando las acciones ajenas. |

El botón de cerrar un aviso no puede implementarse como «cancelar todos los avisos de esta tarea». Tampoco abrir su detalle debe equivaler a completar o a desactivar sus recordatorios.

El aviso conserva sus dos acciones principales, **Realizado** y **Cerrar**. Tocar el título abre el detalle. La opción Detener repetición reside en ese detalle para no saturar el aviso con más botones; al configurar Constante se explica brevemente que Cerrar descarta solo ese aviso.

Si una acción pertenece a una ocurrencia anterior, no puede completar la siguiente repetición ni conceder premios duplicados.

## 7. Frecuencia, fechas y capacidad

- La frecuencia actual de tareas se mantiene. Cada ocurrencia pendiente tiene su propio límite y sus avisos.
- Los anticipos relativos se recalculan al obtener la siguiente ocurrencia; el aviso de su hora límite permanece mientras los recordatorios estén habilitados.
- Constante recalcula su inicio para cada nueva ocurrencia. Detener una serie no desactiva las siguientes ocurrencias; cambiar la preferencia de la misión a Ninguno sí lo hace. El estado de parada debe persistir al cerrar/reabrir la app y sincronizarse para no reactivar una serie detenida accidentalmente.
- Una fecha personalizada exacta pertenece solo a esa ocurrencia. Al pasar a la siguiente, no se reutiliza la fecha pasada: se conserva al menos el aviso de la hora límite y se muestra esa configuración real al editar.
- Si una recurrencia se crea demasiado tarde para emitir su anticipo (por ejemplo, «2 días antes» en una siguiente ocurrencia diaria), se omite ese anticipo pasado y se mantiene su hora límite. No prometer un aviso anterior a la existencia de la ocurrencia.
- Se trabaja con zona horaria y calendario local. La especificación de este cambio usa 1 día = anticipo de 24 horas respecto al instante límite existente; el resumen muestra la hora real resultante si hay un cambio de horario. No cambiar silenciosamente el significado durante la migración.
- Los límites del planificador ahora cuentan avisos, no solo tareas. Si no caben todos, el aviso principal tiene preferencia sobre su anticipo y la app explica qué no se programó. No dejar un anticipo como único aviso por agotar la capacidad.
- La repetición requiere una estrategia acotada de programación nativa, recuperación tras reinicio y reposición de próximos intervalos sin depender de abrir la interfaz ni de un temporizador web activo. El plan técnico debe justificarla y probarla; no reservar una cantidad ilimitada de alarmas ni desplazar avisos principales para llenar la cola con intervalos.
- La cola local del widget debe cancelar ambos avisos anteriores y trasladar correctamente los futuros recordatorios nativos relativos de la siguiente ocurrencia. El resto de sincronización del widget conserva sus límites documentados; no se añade un servicio de nube permanente.

## 8. Compatibilidad de tareas existentes

La actualización no borra tareas ni cambia sus fechas, frecuencias o recompensas.

- Las tareas con Ninguno siguen sin avisos. No se habilitan recordatorios por defecto al actualizar.
- Las tareas con aviso al vencimiento mantienen un único aviso de ese instante.
- Las tareas con anticipo relativo conservan ese anticipo y añaden el aviso principal si su límite todavía es futuro. Los eventos pasados no se disparan al actualizar.
- Las tareas con fecha/hora exacta conservan el aviso que ya eligió el usuario, incluso si una configuración antigua lo situó después del límite. Se añade el aviso principal futuro según la nueva regla, sin duplicar instantes coincidentes. Al editar se identifica como personalizado existente y se muestra su fecha real; no se convierte a Ninguno silenciosamente.
- «Persistente hasta completar» se conserva de forma legible como configuración anterior hasta que el usuario confirme el nuevo modo Constante con sus parámetros. No activar intervalos nuevos en tareas antiguas silenciosamente. El plan de migración conserva el aviso previamente elegido y permite adoptar Constante al editar, mostrando su comportamiento real.
- Mostrar una explicación breve de la nueva regla al actualizar tareas que ya tenían recordatorio: **«Tus recordatorios anticipados ahora incluyen también un aviso a la hora límite.»** No anunciarla para tareas con Ninguno ni enviar una alerta masiva de tareas antiguas vencidas.

La compatibilidad del guardado local y del JSON de Supabase debe admitir registros antiguos; el plan técnico deberá definir la migración/versionado antes de programar. El planificador habitual y el modo de alarma nativo deben aplicar las mismas reglas.

## 9. Criterios de aceptación

- [ ] CA-01: una misión nueva muestra «Fecha y hora límite», el texto breve aprobado y Recordatorios = Ninguno; no muestra botones En 1/2/4 horas ni campos personalizados sin haberlos elegido.
- [ ] CA-02: elegir A la hora límite produce exactamente un aviso futuro; elegir Ninguno produce cero.
- [ ] CA-03: límite mañana 20:00 y anticipo de un día, configurado a tiempo, produce dos avisos con identidades diferentes. Verificar ambos instantes sin abrir la app para forzar la entrega.
- [ ] CA-04: cerrar o abrir el detalle desde el aviso anticipado no cancela el aviso principal; la misión sigue pendiente.
- [ ] CA-05: completar desde Realizado, la app o el widget después del primer aviso cancela el segundo; no se duplica la recompensa.
- [ ] CA-06: cambiar la fecha o el anticipo sustituye solo los avisos de esa ocurrencia, sin dejar alertas antiguas ni afectar otras tareas.
- [ ] CA-07: un anticipo pasado se omite con explicación; un límite futuro conserva su aviso. No hay avisos retroactivos inesperados al crear, editar o actualizar.
- [ ] CA-08: Personalizado muestra solo los controles pertinentes, valida datos y presenta las fechas reales. Coincidir con el límite no genera dos avisos iguales.
- [ ] CA-09: una misión recurrente mantiene el aviso principal de la siguiente ocurrencia y recalcula anticipos relativos; una acción vieja no completa la nueva ocurrencia.
- [ ] CA-10: datos antiguos con ninguno, anticipos, absoluto o persistente mantienen tareas y preferencias legibles; la nueva regla se aplica sin pérdida ni envío masivo de alertas pasadas.
- [ ] CA-11: ambos modos de entrega, sonido/vibración configurados, permisos denegados, reinicio y límites de capacidad muestran un estado veraz y se comprueban con pruebas pertinentes.
- [ ] CA-12: compilación web/APK y pruebas de planificación/cancelación correctas; prueba física en Redmi con aviso anticipado y principal, app cerrada y bloqueo. La compilación no sustituye esa prueba.
- [ ] CA-13: Constante permite elegir comienzo e intervalo, emite avisos sucesivos sin abrir la app, incluye el aviso principal y no duplica instantes coincidentes. La política posterior al límite coincide con la decisión aprobada.
- [ ] CA-14: Cerrar y abrir el detalle mantienen la serie; Detener repetición cancela solo esa serie y preserva el aviso principal futuro. Completar, eliminar o reprogramar no dejan avisos huérfanos; las acciones antiguas no afectan a otra ocurrencia.
- [ ] CA-15: los eventos atrasados se omiten sin avalancha; reiniciar, recuperar permisos y reconciliar el widget no reactivan series detenidas. Verificar límites de cola y entrega con pantalla apagada según restricciones reales de Android.
- [ ] CA-16: el formulario muestra únicamente controles pertinentes, un resumen de una línea y horarios desplegables; comprobar legibilidad, interacción táctil y estados de error en móvil.

Para la prueba de dispositivo se pueden usar anticipo personalizado de unos minutos y una fecha límite próxima: no hace falta esperar un día. Las pruebas de un día/dos días se verifican además con reloj controlado en las reglas automáticas.

## 10. Alcance y revisión

Incluye formulario, textos, resumen compacto de fechas, anticipo más aviso principal, modo Constante configurable, identificación/cancelación independiente, recurrencias, widget, datos existentes y pruebas.

No incluye cambiar penalizaciones/recompensas, programar cantidades ilimitadas de alarmas simultáneas, rediseñar widgets, implantar iOS nativo ni contratar servicios externos. El usuario aprobó el documento completo antes de iniciar la implementación.

Decisiones aprobadas:
1. Un selector único, sin interruptor redundante; Ninguno significa ningún aviso.
2. Elegir cualquier anticipo habilita también el aviso de la hora límite.
3. Personalizado permite tiempo antes del límite o fecha/hora concreta dentro de esa sección; los accesos «En 1/2/4 horas» dejan el formulario principal. Constante permanece como opción voluntaria con comienzo e intervalo configurables.
4. Los recordatorios anteriores activos adoptan el aviso principal futuro, con explicación breve y sin reactivar tareas que tenían Ninguno.
5. Propuesta inicial de Constante: comenzar una hora antes y repetir cada treinta minutos. Confirmado por el usuario: continúa tras el límite hasta completar o detener los avisos.

## 11. Evidencia de implementación

- 30/10/2026: implementados formulario progresivo, resumen y horarios, eventos por ocurrencia, anticipo más hora límite y Constante voluntario con inicio/intervalo. Detener repetición persiste por ocurrencia; la siguiente conserva la preferencia.
- Android utiliza un único planificador nativo para ambas presentaciones. Cada serie conserva un registro y rearma su próximo intervalo; el receptor no necesita abrir el WebView. Se omiten intervalos atrasados y se priorizan avisos principales ante el límite de capacidad.
- Se adaptaron apertura/cierre por evento, completado nativo, app y widget, próxima recurrencia y compatibilidad con avisos anteriores. Las configuraciones persistentes antiguas requieren elegir explícitamente Constante para repetir.
- `npm run build`: correcto; advertencia preexistente de tamaño de paquete, sin errores de TypeScript. `node --test tests/*.test.mjs`: 50 pruebas correctas; incluye fixtures de intervalos compartidos con JUnit, capacidad, identidad, repetición, ocurrencias, cancelación y compatibilidad de Android 7.
- Navegador local: verificados Ninguno sin campos adicionales, Constante con intervalo editable y resumen, Personalizado con alternancia de tiempo relativo/fecha exacta, y horarios desplegables. No se guardaron tareas de prueba en la cuenta del usuario. Esto no certifica el tamaño táctil ni la entrega en Redmi.
- Compilación Android y pruebas JUnit correctas en [Actions 41085052350](https://github.com/alejandromartinbalcazar-creator/taskquest-rpg/actions/runs/41085052350), commit `3c8348d`. Artefacto `FocusMission-APK`, id `12991532174`. Incluye los últimos ajustes de presentación y compatibilidad.
- Prueba física en Redmi pendiente: avisos anticipado/principal con app cerrada, bloqueo, varios intervalos (incluido después del límite), cierre sin cancelar futuros, parada persistente, completar desde widget, reinicio y permisos. No se marcan los criterios de entrega real como aceptados por compilar.

Límites: la repetición nativa requiere Android 8 o posterior; Android 7 conserva avisos únicos e informa de esa limitación si se selecciona Constante. Android puede aplazar alarmas bajo ahorro de batería/Doze o impedirlas tras cierre forzado. Sin notificaciones autorizadas no se anuncia programación activa. Si el planificador nativo falla, se informa que la alternativa solo cubre avisos únicos; no se simula una repetición funcionando.
