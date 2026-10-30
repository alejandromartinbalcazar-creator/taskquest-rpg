# Widgets personalizables de misiones

- Estado: aprobado por el usuario el 30 de octubre de 2026 («sí implementemoslo»). En implementación; aceptación física pendiente.
- Referencias: requerimiento funcional aportado por el usuario e imagen de TickTick con lista oscura, casillas a la izquierda y fechas a la derecha.
- Plataforma de la primera entrega: Android. Dispositivo de aceptación: Redmi Note 14 Pro.
- Alcance de la aprobación solicitada: primera entrega descrita abajo. Las etapas posteriores son una hoja de ruta, no funciones comprometidas en este incremento.

## 1. Objetivo y aspecto

Entender qué está pendiente al mirar la pantalla de inicio del celular y realizar acciones rápidas desde el widget. El diseño separa la organización del contenido (preset) del aspecto visual (tema).

Referencia visual: tarjeta de esquinas redondeadas, tipografía de sistema legible, encabezado pequeño, botón «+» y menú «⋮». Cada fila contiene una casilla, título y fecha/hora alineada a la derecha. La fecha de una tarea vencida aparece en rojo; no se pinta toda la tarjeta de rojo ni se añaden mensajes de culpa. Los títulos largos terminan en puntos suspensivos, sin invadir las fechas o los botones. No aparecen nivel, EXP, salud ni estadísticas del personaje.

Se conservan las apariencias Minimal, Medieval y Aurora del widget existente. La nueva referencia se aplica al estilo Minimal, con claro, oscuro y automático. Los presets de contenido pueden combinarse con las apariencias: «Todo en uno» no es un cuarto tema visual.

## 2. Punto de partida observado en el código

| Existente | Consecuencia para esta propuesta |
| --- | --- |
| Tres proveedores de widget y tres apariencias. | Deben seguir funcionando los widgets ya colocados. |
| Lista nativa `ListView`, adaptación declarada horizontal/vertical y apertura de tareas mediante enlaces. | Hay una base reutilizable; su funcionamiento táctil y el desplazamiento se comprobarán en dispositivo. |
| Copia nativa de id, título, fecha, completado y fallo; sin datos del personaje. | Se amplía la copia mínima de tareas; no se duplica el motor de recompensas. |
| No hay checkbox de completar ni configuración propia por instancia. | Son funciones nuevas, no capacidades actuales que solo haya que activar. |
| `Task` no tiene área, prioridad de productividad, fecha de creación u orden manual. `dueDate` es obligatorio. | No se inventarán áreas a partir de estadísticas, ni prioridad a partir de dificultad, ni fechas históricas a partir del id. |
| Se sincroniza el widget al guardar tareas en la app. | Actualmente no existe sincronización autónoma del widget con Supabase mientras la app permanece cerrada. |

Esta revisión es de código. No certifica la apariencia, el scroll o las acciones de los widgets actuales en el Redmi.

## 3. Primera entrega propuesta

### 3.1 Dos presets de organización

| Preset | Contenido y orden inicial | Para qué sirve |
| --- | --- | --- |
| **Todo en uno**, predeterminado | Hoy: hasta 3 tareas. Vencidas: hasta 3. Mañana: hasta 1. Hoy y Vencidas con espacio parecido; Mañana en una franja menor. Secciones simultáneas, sin pestañas. | Revisar las pendientes actuales y atrasadas con el mismo protagonismo, y anticipar mañana sin que ocupe gran parte del widget. |
| **Lista compacta** | Una lista continua desplazable, sin secciones; por defecto todas las pendientes ordenadas por fecha. | Ver muchas tareas y recorrerlas desde el widget. |

En Todo en uno se pueden activar/desactivar las tres secciones, cambiar el orden y el límite. Por defecto Hoy y Vencidas comparten el espacio principal aproximadamente a partes iguales y ambas tienen importancia esencial. Mañana es secundaria y compacta: una fila de tarea y contador de adicionales cuando exista espacio. El reparto 3/3/1 es una referencia inicial de cantidad, no una obligación de altura fija para todos los tamaños. Si uno de los bloques principales está vacío, el otro puede aprovechar su espacio.

En Lista compacta se puede ordenar por fecha ascendente o descendente o con el orden por urgencia temporal definido más abajo; también decidir si los atrasos van primero o después de las tareas actuales. No hay un límite oculto de tres tareas. El scroll permite recorrer la lista seleccionada.

El usuario ha descartado «Por áreas» para esta entrega: la creación actual de misiones no utiliza esa agrupación. Cuando se habla de reservar espacio en el widget, se trata de los bloques temporales Hoy, Vencidas y Mañana, no de categorías nuevas.

### 3.2 Mantener el modelo actual de misiones

No se añaden campos de Área, Categoría o Prioridad a las tareas para construir este widget. Se utilizan las fechas, el estado y la recurrencia existentes. «Priorizar las tareas» significa mejorar su visibilidad y orden temporal, no añadir una propiedad nueva. Se conservan dificultad, EXP, oro, estadísticas, reglas RPG y el flujo actual de crear misiones.

La copia mínima para el widget sí puede ampliarse con datos existentes necesarios para completar de forma segura las recurrencias y reconciliar el progreso. No se simulan filtros por campos que no existen.

### 3.3 Configuración por instancia desde el primer incremento

Cada widget tiene un identificador y preferencias propias. Tener dos widgets con distintos presets o temas no hace que uno cambie al otro. Esta base se incluye desde la primera entrega, aunque el documento original sitúe parte de la personalización en una etapa posterior.

Pantalla **Personalizar widget**:

1. Elegir diseño en una galería de dos tarjetas, con vista previa y explicación breve.
2. Elegir contenido: pendientes y secciones temporales, orden y límites según el preset.
3. Elegir aspecto: apariencia existente, claro/oscuro/automático en Minimal y densidad cómoda, equilibrada o compacta.
4. Revisar una vista previa básica y guardar. Usar tareas reales si existen; si no, mostrar ejemplos identificados como tales.

Se puede elegir un preset y guardar sin abrir opciones avanzadas. La edición se abre desde «⋮ → Personalizar» y desde la acción «Editar» del launcher cuando la ofrezca al mantener pulsado el widget. Ambas vías abren la misma configuración de esa instancia. «Restablecer preset» afecta solo a esa instancia y pide confirmar antes de perder su personalización. Cancelar la configuración no modifica el widget anterior.

La copia de un preset se guarda por widget; cambiarla no altera el preset original. Las preferencias sobreviven al reinicio de la app y del teléfono. Los widgets existentes reciben valores compatibles con su apariencia anterior y no desaparecen después de actualizar el APK.

### 3.4 Interacciones

| Acción | Resultado esperado |
| --- | --- |
| Tocar el checkbox | Registrar el completado local de esa ocurrencia sin abrir la pantalla principal de la app; confirmar visualmente y actualizar las instancias afectadas. |
| Tocar el título | Abrir directamente el detalle/editor de esa tarea. No marcarla como realizada. |
| Tocar «+» | Abrir el formulario de nueva misión con el título enfocado. |
| Tocar «+N más» | Abrir la lista completa de esa sección en la app, con el filtro correspondiente. Es una propuesta explícita para esta primera versión; el resumen esencial ya debe verse en el widget. |
| Tocar «⋮» | Personalizar esta instancia, actualizar o abrir Misiones. |
| Mantener pulsado y elegir «Editar» en el launcher | Abrir Personalizar widget para esa instancia, con sus valores actuales. |
| Mantener pulsado y elegir «Ajustar tamaño» | Mostrar los tiradores/marco de redimensionado que proporciona el launcher. |
| Elegir «Quitar/Eliminar widget» en el launcher | Quitar únicamente esa instancia de la pantalla de inicio, sin borrar tareas ni desinstalar la app; limpiar su configuración cuando el sistema confirme la eliminación. |

En Todo en uno, el scroll recorre las filas seleccionadas por los límites configurados; «+N más» permite acceder al resto. En Lista compacta se recorre toda la selección desde el propio widget. Esta diferencia debe quedar clara entre los dos presets.

**Límite del completado en segundo plano:** el widget actual no contiene el motor del personaje. La primera entrega debe guardar una acción local durable con tarea, ocurrencia e identificador único; actualizar la proyección local del widget y aplicar/reconciliar esa acción con las reglas existentes al abrir la app. El cálculo de recompensas y la subida a la nube pueden esperar hasta esa reconciliación. La interfaz no debe afirmar que ya se sincronizó la nube si todavía no ocurrió. No se abrirá la app a escondidas para simular una acción en segundo plano.

Las tareas recurrentes requieren actualizar la ocurrencia siguiente de forma coherente; no se aceptará una solución que oculte para siempre el hábito o complete la siguiente repetición desde una acción vieja. El plan técnico deberá cerrar y probar esta mecánica antes de implementar el checkbox.

### 3.5 Distribución y reglas de fechas

- Tamaño inicial orientativo: 4 columnas × 3 filas del launcher. Tamaño mínimo objetivo: **4×2**, interpretando así la petición de poder achicarlo hasta ese tamaño. El usuario puede ampliarlo en ancho y alto hasta el espacio que permita la cuadrícula de su pantalla de inicio; 4×4 es una prueba, no un máximo impuesto por FocusMission.
- Habilitar redimensionado horizontal/vertical y reconfiguración del widget existente. No conservar topes arbitrarios de 420×320dp si impiden ampliarlo como pide el usuario. Validar las medidas mínimas en el Redmi: las celdas de un launcher no equivalen a un número universal de píxeles.
- El menú de pulsación prolongada, el sombreado, el marco y los tiradores pertenecen al launcher. Android permite declarar el widget redimensionable y reconfigurable, pero FocusMission no puede imponer que todos los launchers usen los mismos nombres, animación o menú que TickTick. «⋮ → Personalizar» permanece como acceso alternativo.
- El widget aprovecha su ancho: casilla izquierda, título central flexible y fecha derecha. Mantiene controles cómodos de tocar aunque la casilla dibujada sea pequeña.
- Al reducir el tamaño se reduce primero Mañana y después las filas de Hoy/Vencidas de forma equilibrada. No se comprime la letra hasta volverla ilegible ni se recortan botones. Al agrandar, Hoy/Vencidas reciben más filas conservando una proporción parecida antes de ampliar Mañana.
- Los límites 3/3/1 son valores deseados, no promesas de que siete filas cabrán en cualquier tamaño. En 4×2 se mantienen identificables Hoy y Vencidas, aunque deban utilizar resúmenes/contadores y scroll para conservar áreas táctiles cómodas. Mañana se resume en una franja breve con contador si no cabe una fila. El contenido seleccionado se desplaza verticalmente cuando corresponda.
- Si ni siquiera cabe un resumen legible de una sección, mostrar un contador breve o esconder la sección secundaria según su configuración. No dejar un encabezado suelto sin contenido salvo elección expresa.
- «+6 más» significa seis tareas ocultas por límite/espacio; no seis completadas. Los contadores muestran el total real de pendientes de cada filtro.
- Hoy y Mañana se calculan usando el calendario y la zona horaria local, no sumando 24 horas ciegamente.
- En Todo en uno, Vencidas contiene tareas cuya fecha/hora ya pasó. Una tarea de esta mañana que ya venció aparece solo allí, no también en Hoy. Hoy muestra las pendientes de hoy que todavía no vencen; Mañana las del siguiente día.
- Un orden por urgencia temporal inicial es determinista: grupo configurado de vencidas, fecha próxima e id como desempate estable. No depende de IA, campos de prioridad inexistentes, del texto de la tarea ni de una consulta de pago.

## 4. Estados, actualización y privacidad

- Sin pendientes: mensaje breve y botón «+», sin paneles grandes.
- Sin tareas en una sección: ocultarla por defecto o mostrar un mensaje breve si el usuario así lo elige.
- Muchas vencidas: respetar su límite y conservar Hoy cuando existan tareas actuales y espacio. Permitir ocultar vencidas sin eliminarlas de la app.
- Sin conexión: mostrar la copia local y permitir el registro local de acciones. Mostrar un indicador discreto si hay cambios pendientes de reconciliar.
- Cambios locales en la app: actualizar al crear, editar, completar, borrar o reprogramar una tarea.
- Cambio de día/hora/zona: recalcular los grupos cuando Android permita la actualización; volver a verificar al interactuar o refrescar. No prometer redibujado exactamente a medianoche si el sistema lo retrasa.
- Cambios de otro dispositivo: se reflejan cuando la sincronización de FocusMission los reciba. No se incluye un servicio permanente del widget conectado a Supabase ni se promete tiempo real con la app cerrada.
- Al cambiar de cuenta no se deben mezclar acciones o tareas de perfiles diferentes. El plan técnico debe definir cómo se asocia cada copia/acción con su origen.
- Fallos: conservar tareas y configuración; no tratar un fallo de lectura como si todas las tareas hubieran sido eliminadas. La recuperación no concede recompensas duplicadas.

## 5. Hoja de ruta posterior, fuera de esta aprobación

| Etapa | Funciones propuestas |
| --- | --- |
| Segunda | Solo hoy, Próximos días y Personalizado; editor ampliado de secciones; colores y visibilidad de campos; vista previa en varios tamaños; fecha opcional y sección Sin fecha si se amplía el modelo de tareas. |
| Tercera | Fijar tareas, rotación opcional de vencidas, orden manual y reglas más avanzadas de distribución/selección. |

Por áreas, Prioridades y filtros por proyectos/etiquetas solo se reconsiderarán si el producto incorpora esos datos y el usuario aprueba esa ampliación por separado. No son una dependencia de este widget.

El orden por fecha de creación necesita registrar `createdAt` para nuevas tareas y definir qué hacer con las antiguas. No se mostrará ese criterio como exacto sin ese dato. La matriz de Eisenhower requiere importancia y urgencia reales; no se derivará de dificultad RPG. El progreso diario, especialmente para hábitos recurrentes, requiere un historial de ocurrencias fiable antes de anunciar porcentajes correctos.

Los futuros presets deberán definir filtros sin solapamiento accidental: por ejemplo, Solo hoy considera el día calendario e identifica sus vencidas; añadir vencidas de días anteriores es opcional. Próximos días no repite Hoy/Mañana dentro del grupo posterior. Estas reglas se revisarán en la especificación de la segunda etapa.

iOS queda fuera de la primera entrega: actualmente no existe un proyecto nativo iOS en el repositorio. El diseño conserva reglas separadas del renderizado para facilitar otra implementación futura. Transparencia avanzada, sincronización de preferencias entre dispositivos y un editor gráfico libre no se prometen en esta versión.

## 6. Criterios de aceptación de la primera entrega

- [ ] CA-01: agregar Todo en uno eligiendo el preset y guardando, sin configurar campos avanzados.
- [ ] CA-02: con tareas de hoy, vencidas y mañana, Hoy y Vencidas mantienen un espacio parecido y Mañana ocupa una franja menor. Cien vencidas no desplazan por completo las actuales y muchas tareas de mañana no invaden el espacio de ambas.
- [ ] CA-03: cambiar orden y límites de secciones y comprobar los contadores «+N más» con datos conocidos.
- [ ] CA-04: Lista compacta permite desplazarse por toda su selección y Todo en uno separa correctamente los grupos temporales. No se pide crear áreas, categorías ni prioridades al crear una misión.
- [ ] CA-05: tocar título abre la tarea correcta; «+» abre crear; el checkbox registra solo esa ocurrencia, sin abrir la pantalla principal ni conceder premios dos veces.
- [ ] CA-06: completar una tarea actualiza todas las instancias afectadas y cancela su recordatorio anterior. Comprobar también recurrencias y Deuda de Honor con las reglas existentes.
- [ ] CA-07: dos widgets con diseños/filtros distintos conservan su configuración independiente; editar, restablecer o borrar uno no altera el otro.
- [ ] CA-08: mantener pulsado el widget en el launcher del Redmi, entrar a editar la instancia y redimensionar desde 4×2 a 4×3, 4×4 y un tamaño mayor si su cuadrícula lo admite. Verificar que se conservan configuración, proporciones, scroll y controles accesibles; probar títulos largos, letra aumentada y tema claro/oscuro.
- [ ] CA-09: reiniciar teléfono/app conserva preferencias; los widgets anteriores continúan operativos y no se pierden tareas.
- [ ] CA-10: sin conexión, registrar una acción, reiniciar y abrir la app; reconciliar sin pérdida, duplicados ni mezcla de cuentas. Verificar después la sincronización de nube cuando vuelva la conexión.
- [ ] CA-11: cambios de día/zona horaria y sincronizaciones recibidas reclasifican los grupos sin duplicar tareas ni mantener contadores falsos.
- [ ] CA-12: pruebas de reglas y compilación web/APK correctas, seguidas de comprobación física en el launcher del Redmi. Una compilación no demuestra apariencia o funcionamiento táctil.
- [ ] CA-13: «Editar» del launcher y «⋮ → Personalizar» abren la misma configuración de la instancia correcta. Quitar un widget no borra misiones ni altera los demás.

## 7. Decisiones que se presentan para aprobación

1. Construir primero Todo en uno y Lista compacta, con configuraciones independientes desde el inicio. Por áreas se pospone.
2. Conservar el formulario y los datos actuales de tareas. Hoy/Vencidas reciben espacio semejante y Mañana es secundario; no se añaden campos de Área o Prioridad.
3. Usar el estilo limpio de la referencia en Minimal, conservando Medieval y Aurora.
4. Tocar «+N más» abre la sección completa en la app; Lista compacta permite ver toda su selección desde el widget.
5. Registrar el completado en el widget sin abrir la pantalla principal, con reconciliación de recompensas/nube al abrir la app. La durabilidad y las recurrencias son criterios obligatorios de prueba.
6. Habilitar editar y redimensionar mediante el launcher, con mínimo objetivo 4×2 y ampliación según el espacio disponible. El aspecto exacto del menú y sus tiradores lo determina el launcher, por lo que se probará expresamente en el Redmi.

El usuario aprobó esta versión revisada. Se implementa ese alcance sin añadir áreas ni prioridades.

## 8. Evidencia

Solo se revisaron el requerimiento, la referencia, los tipos de tareas, el puente de datos y los archivos nativos existentes. No hay implementación ni prueba manual de esta nueva versión. Las casillas de aceptación permanecen pendientes.

Referencias oficiales consultadas:
- [Configuración por instancia de widget](https://developer.android.com/develop/ui/compose/glance/configuration).
- [Colecciones e interacción por fila](https://developer.android.com/develop/ui/views/appwidgets/collections).
- [Actualizaciones por eventos y límites periódicos](https://developer.android.com/develop/ui/views/appwidgets/advanced).
- [Tamaños mínimos y distribución adaptable](https://developer.android.com/develop/ui/views/appwidgets/layouts).
