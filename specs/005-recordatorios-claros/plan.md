# Plan aprobado: recordatorios claros

1. Extender Task de forma compatible: versión de recordatorios, intervalo e inicio de Constante y parada por ocurrencia. Conservar registros antiguos; no convertir notificaciones persistentes antiguas en repeticiones sin confirmación.
2. Centralizar en reminderPlan las identidades por evento/ocurrencia, anticipos, aviso principal, deduplicación, próximos intervalos y prioridad de capacidad.
3. Android: reutilizar ReminderOverlayStore como único planificador tanto para notificación habitual como para alarma. El receptor rearma solo el siguiente intervalo nativo; no depende del WebView ni mantiene servicios permanentes. Separar entrega actual de próxima alarma y cancelar por evento, serie u ocurrencia. Mantener permisos y preferencias existentes. No añadir dependencias ni costes.
4. Adaptar acciones nativas y widget para cancelar toda la ocurrencia al completar y preparar la siguiente. Preservar el diario de acciones, la idempotencia y las reglas de premios.
5. Extraer formulario Recordatorios con controles progresivos, resumen corto y horarios desplegables; cambiar fecha límite y permitir Detener repetición en detalle. Migración explicada una vez, sin avisos retroactivos.
6. Verificar reglas con reloj controlado, sincronización, datos antiguos, recurrencia y cancelación. Compilar web y Android, verificar interfaz si el navegador está disponible y documentar pruebas pendientes en Redmi.

Riesgos: restricciones Android/Doze, permisos exactos revocados, persistencia tras reinicio y acciones antiguas, desfase entre nube y programación local. La cola contiene máximo 450 registros: principales primero, después anticipos/series; cada serie consume un único registro y rearma su siguiente fecha. La capacidad y fallos deben reportarse sin simular éxito.

Referencia Android: https://developer.android.com/develop/background-work/services/alarms . Los intervalos son instantes solicitados, sujetos a restricciones del sistema. No se promete puntualidad absoluta bajo Doze o cierre forzado.

Compatibilidad: Android entrega todos los modos mediante el mismo receptor nativo para soportar intervalos incluso con app cerrada. Se retiran los pendientes antiguos de Capacitor al migrar. La alternativa no Android conserva avisos únicos; iOS nativo sigue fuera del alcance.
