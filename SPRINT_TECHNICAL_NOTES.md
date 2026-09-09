# Ecowater — Sprint Technical Notes
**Fecha auditoría:** 2026-06-06 | **Última actualización:** 2026-06-15  
**Propósito:** Revisión técnica del backlog contra el código real. Para cada tarea: qué hay, qué falta, dónde tocar.  
**No contiene** suposiciones — cada observación fue verificada contra el repo.

---

## Checklist de sprint

> Leyenda: ✅ hecho | ⚠️ parcial | ❌ pendiente | 🔒 bloqueado | 🚫 no entra en sprint

### P0 — Críticas

- [x] ✅ **#1 Dashboard freeze** — `refetchOnWindowFocus: false` en los 4 hooks + `keepPreviousData`. Hecho en PR #58.
- [x] ✅ **#2 Integración control de válvula** — Ya implementado en `main` (ED-88, PR #54). Cerrar card.
- [ ] 🔒 **#3 Integración facturación (Darío)** — Sin modelo Prisma ni API. Bloqueado hasta definición con Darío.
- [x] ✅ **#4 Cooperativa: dato anterior en actualización** — Fix `isDirty` + `reset` post-save. Hecho en PR #58.

### P1 — Alto impacto funcional

- [ ] ❌ **#5 ED-87 — Fix Gateway parser** — Bug real en `parseFlowHex`. Necesita payload real con hex A–F para reproducir.
- [x] ✅ **#6 Normalizar timestamps a horario AR** — Completo. `operario-detail.tsx` migrado a `formatDateTimeShortAR`. Todos los componentes identificados migrados.
- [x] ✅ **#7 ED-88 — Estado MQTT en panel de válvula** — `MqttBrokerError` typed class, `ValveCommandStatus` type, `status` field en respuesta del endpoint, `ValveCommandError` en hook, badge de conexión en `ValveControlPanel`.
- [x] ⚠️ **#8 Medidores: filtros de estado** — Relabel "Fallidos" → "Error/Fallas" hecho en `filter-tabs.tsx`. El estado `DISCONNECTED` separado requiere decisión del equipo + migración del enum `MeterStatus`; queda pendiente.
- [ ] ❌ **#9 Map: pines superpuestos / clustering** — Clustering existe con `radius: 150, zoomLevel < 14`. Calibración in-situ — ajustar `radius`/`zoom` con medidores reales en pantalla. No es un cambio de código.
- [x] ✅ **#10 Map: restringir bounds al área de servicio** — `restrictionBounds` dinámico: prioridad medidores → cooperativa → fallback hardcodeado. Reset también actualizado.
- [x] ✅ **#11 Map: layout controles / zoom / Street View** — `zoomControl` en RIGHT_BOTTOM, `mapTypeControl/streetViewControl/fullscreenControl` deshabilitados para deconflictar con panel custom.
- [ ] 🔒 **#12 Zonas: columnas de facturación** — Bloqueado por #3 (sin modelo de facturación).
- [x] ✅ **#M Medidores mecánicos: validación de lectura** — Implementado: `.refine()` en schema Zod del form + validación en backend antes de `prisma.reading.create`.

### P2 — Mejoras importantes

- [ ] ❌ **#13 Help/Video en PageRenderer** — No existe `PageRenderer` en el codebase. Clarificar con equipo.
- [x] ✅ **#14 Map: botón "Agrupar"** — Funciona como checkbox. Si el backlog pide botón, es cosmético.
- [x] ✅ **#15 Map: toggle POI** — Label es "Ocultar POI" (checked = ocultar), semánticamente correcto. Sin cambio necesario.
- [x] ✅ **#16 Map: filtro por tipo de medidor** — Segmented button Todos/Smart/Mecánicos en panel Controles. Client-side, compone con filtros de estado existentes.
- [x] ✅ **#17 Map: búsqueda por medidor/usuario/dirección** — Input de búsqueda en panel Controles. Filtra en vivo por `device_name`, `dev_eui`, `street_address`. Nota: búsqueda por usuario no disponible en el mapa (payload `/api/meters/map` no incluye nombre de usuario).
- [x] ✅ **#18 Medidores: más datos en búsqueda** — Columnas: valor última lectura, actividad (frescura), conectividad (ONLINE/STALE/OFFLINE), EUI. Fix también del bug latente que descartaba matches de búsqueda por dev_eui/nombre.
- [x] ✅ **#19 Zonas: filtro por nombre** — Ya estaba implementado en `zones-list.tsx`. Cerrar card.
- [x] ✅ **#20 ED-86 — Usuarios: filtrar por rol** — Select "Todos los roles / Admin / Lector / Operario". Param `role` en `pagination.ts`, API, hook y UI.
- [x] ✅ **#21 Zonas: toast de eliminación con undo** — Delete diferido 6s: remove optimista del cache → toast con "Deshacer" → DELETE real al vencer el timer. Sin migración de schema.
- [x] ✅ **#22 Logout: redirección** — Ya resuelto con `signOut({ callbackUrl: "/auth/login" })`. Cerrar card.
- [x] ✅ **#23 Portal operarios: OcrScanButton** — Google Cloud Vision integrado. Captura foto con cámara trasera → base64 → `documentTextDetection` → extrae dígitos del medidor → prellena el campo con validación inmediata. Requiere env var `GOOGLE_APPLICATION_CREDENTIALS_JSON` (service account JSON como string).
- [x] ✅ **#24 Portal operarios: validación lectura < anterior** — Implementado: `.refine()` en schema Zod + validación en backend. Ver #M.
- [ ] ❌ **#25–27 Lecturas: edición admin con auditoría** — Feature de cero. Sin modelo `ReadingAudit`.

### P3 — No entran en sprint

- [ ] 🚫 **#28 Mapa: licencia / marca de agua** — Google Maps incluye atribución por defecto. Verificar si hay algo puntual.
- [ ] 🚫 **#29 ED-84 — Demo online** — Épica. No romper en sprint.
- [ ] 🚫 **#30 Canal de facturación propio** — Épica futura.
- [ ] 🚫 **#31 Playwright QA** — Sin test runner configurado.
- [ ] 🚫 **#32 Tag v1.0** — Post-estabilización P0/P1.

### Tech Debt

- [x] ✅ **Prisma singleton** — `lib/prisma.ts` creado, 33 archivos migrados de `new PrismaClient()` a import compartido. Hecho en PR #58.
- [x] ✅ **Edición de medidor mecánico en página completa** — Reemplaza el modal angosto por ruta dedicada `/dashboard/medidores/mecanicos/[id]/editar` que reutiliza el form de alta (mapa, autocomplete de dirección, detección geométrica de zona, coordenadas). Nuevo hook `useUpdateMechanicalMeterMutation` en `hooks/meters/use-meter-query.ts`.
- [x] ✅ **Chips de estado en operarios** — `operarios-table` y `operario-detail` reutilizan `<Chip>` de medidores para activo/inactivo en vez de `<Badge>` hardcodeado.
- [x] ✅ **Normalización de ancho de forms del dashboard** — Todos los forms de alta/edición a `max-w-5xl mx-auto py-6` (usuarios nuevo, editar usuario, operario nuevo). Eliminada la ruta duplicada muerta `app/dashboard/usuarios/new/`.

---

## Estado rápido por tarea (tabla de referencia)

| # | Tarea | Prioridad | Estado |
|---|---|---|---|
| 1 | Dashboard freeze | P0 | ✅ Resuelto — PR #58 |
| 2 | Integración control de válvula | P0 | ✅ En `main` (ED-88) — cerrar card |
| 3 | Integración facturación (Darío) | P0 | 🔒 Bloqueado — sin definición |
| 4 | Cooperativa: actualización con dato anterior | P0 | ✅ Resuelto — PR #58 |
| 5 | ED-87 — Fix Gateway parser | P1 | ❌ Pendiente — necesita payload real |
| 6 | Normalizar timestamps | P1 | ✅ Resuelto — `operario-detail` migrado, todos los componentes completados |
| 7 | ED-88 — MQTT en panel del medidor | P1 | ✅ Resuelto — typed errors, status field, badge de conexión |
| 8 | Medidores: filtros de estado / Error/Fallas | P1 | ⚠️ Parcial — relabel hecho; DISCONNECTED requiere migración del enum |
| 9 | Map: pines superpuestos / clustering | P1 | ❌ Calibración in-situ con medidores reales — no es cambio de código |
| 10 | Map: restringir bounds al área de servicio | P1 | ✅ Resuelto — `restrictionBounds` dinámico |
| 11 | Map: layout controles / zoom / Street View | P1 | ✅ Resuelto — controles nativos configurados |
| 12 | Zonas: columnas de facturación | P1 | 🔒 Bloqueado — sin modelo facturación |
| M | Medidores mecánicos: validación lectura | P1 | ✅ Resuelto — Zod refine + validación backend |
| 13 | Help/Video en PageRenderer | P2 | ❌ Pendiente — clarificar con equipo |
| 14 | Map: botón "Agrupar" | P2 | ✅ Funciona como checkbox |
| 15 | Map: toggle POI | P2 | ✅ Resuelto |
| 16 | Map: filtro por tipo de medidor | P2 | ✅ Resuelto |
| 17 | Map: búsqueda por medidor/usuario/dirección | P2 | ✅ Resuelto (búsqueda por usuario no disponible en mapa) |
| 18 | Medidores: más datos en resultado de búsqueda | P2 | ✅ Resuelto |
| 19 | Zonas: filtro por nombre | P2 | ✅ Resuelto |
| 20 | ED-86 — Usuarios: filtrar por rol | P2 | ✅ Resuelto |
| 21 | Zonas: toast de eliminación con undo | P2 | ✅ Resuelto |
| 22 | Logout: corregir redirección | P2 | ✅ Ya resuelto — cerrar card |
| 23–24 | Portal operarios (ED-83): OCR + validación lectura | P2 | ✅ Resuelto |
| 25–27 | Lecturas: edición admin con auditoría | P2 | ❌ Feature de cero — sin modelo ReadingAudit |
| 28 | Mapa: licencia / marca de agua | P3 | 🚫 No entra |
| 29 | ED-84 — Demo online | P3 | 🚫 Épica |
| 30 | Canal de facturación propio | P3 | 🚫 Épica |
| 31 | Playwright QA | P3 | 🚫 No configurado |
| 32 | Tag v1.0 | P3 | 🚫 Post-estabilización |

---

## P0 — Críticas

---

### 1. Dashboard "freeze" (pantalla frizada)

**Causa real:** No es un loop infinito ni query colgada. Es que el dashboard hace refetch al cambiar foco de ventana y mientras refetchea revierte a skeleton completo.

**Archivos:**
- `hooks/dashboard/use-dashboard-stats.ts:55` — único hook con `refetchOnWindowFocus: false`
- `hooks/dashboard/use-consumption-data.ts:71,93` — sin `refetchOnWindowFocus: false`
- `hooks/dashboard/use-alarm-trends.ts:49` — sin `refetchOnWindowFocus: false`
- `hooks/dashboard/use-meter-distribution.ts:46` — sin `refetchOnWindowFocus: false`
- `hooks/meters/use-meter-query.ts:36` — `refetchInterval: 10000` (10s polling)
- `components/dashboard/home/home-dashboard.tsx:92` — el gate `statsLoading || consumptionLoading || urgenciesLoading` revierte **toda** la UI a skeleton

**Qué hacer:**
1. Agregar `refetchOnWindowFocus: false` a los 4 hooks que no lo tienen.
2. Evaluar si `refetchInterval: 10000` en `useMetersQuery` es necesario cuando el dashboard ya está montado — si no, deshabilitarlo por contexto o pasarlo como opción.
3. Si el skeleton completo es demasiado agresivo, considerar `keepPreviousData: true` (TanStack Query v4) o `placeholderData: keepPreviousData` (v5) para no relampaguear al refetch.

**No hay** Suspense boundary, error boundary, render loop, ni queries colgadas. La corrección es de configuración de React Query.

---

### 2. Integración control de válvula

**Estado: YA IMPLEMENTADO.**

ED-88 fue mergeado a `main` (PR #54). La feature está en producción.

**Qué existe:**
- `app/api/meter/[id]/valve/route.ts` — endpoint POST, requiere `ADMIN` + `canWrite`
- `lib/mqtt-client.ts` — publica payloads hex hardcodeados via MQTT
- `components/meters/valve-control-panel.tsx` — UI con badge de estado, toggle, barra de progreso, historial
- `components/medidores/detail/valve-commands-card.tsx` — card wrapper condicional (`packs?.valve_control`)

**Lo que falta (como task separada → ver tarea 7):**
- Indicador de estado de conexión MQTT (broker conectado/desconectado) — actualmente no se muestra nada si el broker no responde
- La conexión MQTT se crea por request (no persistente) — si hay latencia de red, el 6s timeout puede causar fallos intermitentes

**Acción:** Cerrar esta card. Lo que resta es parte de ED-88 (task 7).

---

### 3. Integración facturación (correcciones de Darío)

**Estado: Requiere definición antes de implementar.**

**Lo que hay en el código:**
- Sin modelo Prisma de facturación. No existe `Invoice`, `Bill`, `Payment`, ni nada equivalente.
- `lib/export-invoice.ts` — genera un CSV de una fila con campos: Organización, Fecha, N° Medidor, Período, Nombre, Dirección, Flujo acumulado, Consumo del período. Es un export client-side, no una transacción.
- `components/zonas/zone-download-section.tsx` — registra en `ZoneDownload` la fecha del export. El "Período facturado" es el rango del CSV, no un registro contable.
- Sin API de facturación. Sin página de facturación.

**Antes de tocar cualquier código necesitamos:**
- Qué correcciones específicas pidió Darío (no están en el backlog)
- Si hay un sistema externo con el que se integra o si es el CSV de `export-invoice.ts`
- Si hay que persistir datos de facturación o solo corregir el export
- Impacto en `ZoneDownload` y en la tabla de zonas

**Bloqueante también de:** tarea 12 (columnas de última/próxima facturación en zonas).

---

### 4. Cooperativa: actualización con dato anterior

**Bug confirmado.**

**Archivos:**
- `hooks/cooperative/user-cooperative.ts:46–48` — `onSuccess` llama `queryClient.invalidateQueries`
- `app/dashboard/otros/cooperativa/cooperative-form.tsx:58–68` — `useEffect([cooperative, form])` llama `form.reset(cooperative)`

**Flujo del bug:**
1. Usuario edita un campo.
2. Presiona guardar → mutation dispara.
3. `onSuccess` → `invalidateQueries` → refetch → `cooperative` cambia referencia.
4. `useEffect` detecta cambio en `cooperative` → llama `form.reset()` con **datos frescos del servidor**.
5. Si el usuario había empezado a editar otro campo, se sobrescribe.
6. En el segundo guardado ya va el dato correcto porque el primero se persistió.

**Fix:** El `useEffect` no debe ejecutar `form.reset()` si el formulario está `isDirty` o si ya fue submiteado. Alternativa más limpia: inicializar el form con `defaultValues` en `useForm` y no usar `useEffect` para resetear — dejar que `reset()` se llame solo desde el `onSuccess` del submit.

```ts
// En onSuccess de useUpdateCooperative:
onSuccess: (data) => {
  queryClient.invalidateQueries({ queryKey: ["cooperative"] })
  form.reset(data) // reset después del submit, no por efecto del refetch
}
// Eliminar el useEffect en el form
```

---

## P1 — Alto impacto funcional

---

### 5. ED-87 — Fix Gateway parser

**Bug real confirmado en `parseFlowHex`.**

**Archivo:** `utils/parseFlowHex.ts`

**El problema:**
```ts
// Línea 28: concatena bytes en orden inverso como string
const flowDecimalString = byte5 + byte4 + byte3 + byte2
// Línea 30: parsea como decimal base 10
return parseInt(flowDecimalString, 10) * factor
```

Si alguno de los bytes hex contiene letras (A–F), `parseInt("...A...", 10)` se detiene en el primer carácter no decimal y devuelve un número truncado **sin lanzar error**. Por ejemplo, `byte2 = "A4"` → `flowDecimalString` termina siendo `"...A4"` → `parseInt` corta en `A`.

**Los medidores de flujo usan BCD (Binary Coded Decimal)**, donde cada nibble representa un dígito decimal. Si un medidor devuelve un valor válido en BCD, nunca debería tener A–F en esos campos. El parser asume eso sin validarlo.

**Acción:**
1. Confirmar con un payload real que los bytes de flujo son siempre BCD puro (sin A–F).
2. Si confirman: agregar validación explícita que lance error con el payload completo al detectar A–F en campos de flujo.
3. Si no confirman: el parser necesita usar un decodificador BCD real.

**Para avanzar necesitamos:** un payload real que esté produciendo lecturas incorrectas con los bytes completos (antes de parsear).

**Otros parsers:** `parseInstantaneousFlow`, `parseTemperature`, `parseMeterStatus` y `parseTimestamp ` (con espacio en filename — mantener exacto al importar) parecen correctos.

---

### 6. Normalizar timestamps a horario argentino

**Problema real — no es solo cosmético.**

**Componentes afectados (sin `.tz()`):**
- `components/portal/reading-route-item.tsx:37,49` — `dayjs(item.reading_time_today).format("HH:mm")`
- `components/portal/manual-reading-form.tsx:107` — `dayjs(lastReadingDate).format("DD/MM/YYYY")`
- `components/operarios/operario-detail.tsx:223` — `dayjs(r.timestamp).format("DD/MM/YY HH:mm")`
- `components/dashboard/home/area-chart.tsx:47–97` — usa `new Date().toLocaleDateString("es-ES")` sin `timeZone`
- `components/meters/valve-control-panel.tsx:8–10` — importa `dayjs` y extiende `utc/tz` localmente pero no llama `configureDayjs()`

**Lo que está bien:**
- `lib/utils.ts` — `formatDateTimeAR`, `formatDateAR`, `formatDateTimeShortAR` usan `toLocaleString` con `timeZone: "America/Argentina/Buenos_Aires"` ✓
- `utils/timestampConverter.ts` — correcto ✓
- `utils/parseTimestamp .ts` — correcto (interpreta bytes del medidor como hora AR, convierte a UTC para almacenar) ✓

**Estrategia recomendada:**
- Almacenar siempre UTC en DB (ya es así).
- Display: usar las helpers de `lib/utils.ts` o `.tz("America/Argentina/Buenos_Aires")` en dayjs.
- **No** crear más helpers nuevos — consolidar en los que ya existen.

**Archivos a migrar:** los 5 listados arriba. Cambio mecánico, bajo riesgo.

---

### 7. ED-88 — Estado MQTT en panel del medidor

**Lo que falta después del merge de ED-88:**

La UI del panel de válvula (`components/meters/valve-control-panel.tsx`) no muestra si el broker MQTT está conectado o desconectado. Si el broker cae:
- El usuario presiona el toggle.
- La UI muestra "enviando..." indefinidamente (el `lastSentCommand` queda en estado pendiente).
- El timeout de 6 segundos en `mqtt-client.ts` devuelve error, pero el frontend no sabe distinguir entre "comando enviado" y "broker inaccesible".

**Qué agregar:**
- La respuesta del endpoint `/api/meter/[id]/valve` debería diferenciar entre `MQTT_ERROR` (broker down) y `SUCCESS`.
- El `ValveControlPanel` debería mostrar un badge de estado de conexión o un mensaje de error específico cuando el broker no responde.
- El `refetchInterval: 30_000` en `useValveHistoryQuery` es razonable — no cambiarlo.

**Archivos:**
- `app/api/meter/[id]/valve/route.ts` — agregar tipo de error en la respuesta
- `components/meters/valve-control-panel.tsx` — manejar el nuevo tipo de error

---

### 8. Medidores: filtros de estado

**⚠️ PARCIAL (2026-06-15).** Relabel "Fallidos" → "Error/Fallas" aplicado en `components/medidores/filter-tabs.tsx` (solo el `label` visible; el `value: "FAULTY"` y la lógica de filtrado no cambiaron). La parte de estado `DISCONNECTED` separado queda pendiente de decisión del equipo + migración del enum.

**Estado anterior — ya existía "Fallidos".**

**Filtros actuales en `components/medidores/filter-tabs.tsx`:**
- Total / Activos (ACTIVE) / Inactivos (INACTIVE) / Mantenimiento (MAINTENANCE) / **Fallidos (FAULTY)**

**`MeterStatus` enum en Prisma:** `ACTIVE`, `INACTIVE`, `MAINTENANCE`, `FAULTY` — coincide exactamente con los filtros.

**El backlog pide "Error/Fallas"** — esto es el mismo `FAULTY`. El label "Fallidos" ya está. Si el equipo quiere cambiarlo a "Error/Fallas", es solo un cambio de texto en `filter-tabs.tsx`.

**Lo que falta según backlog:**
- Medidores desconectados/fuera de rango — estos serían `INACTIVE`. No hay un estado `DISCONNECTED` separado en el schema. Si el equipo quiere diferenciarlo, **requiere agregar un valor al enum `MeterStatus`** y migración de DB.
- Contadores vs. resultados visibles — verificar que el conteo coincide con los filtros (no auditado en detalle, pero la query es directa).

**Acción inmediata:** Confirmar con el equipo si "Fallidos" es suficiente o si necesitan un estado `DISCONNECTED/OUT_OF_RANGE` separado en el schema.

---

### 9. Map: pines superpuestos / clustering

**Clustering ya existe.**

**Archivo:** `components/ui/map.tsx:511–517`

```ts
<MarkerClusterer algorithm={new SuperClusterAlgorithm({ radius: 150, minPoints: 2 })}>
```

El clustering activa cuando `clusterEnabled && zoomLevel < 14`. El checkbox "Agrupar" en el panel de controles togglea `clusterEnabled`.

**Lo que puede fallar:**
- `radius: 150` puede ser muy agresivo en zoom medio → deja pines inaccesibles incluso cuando hay espacio en pantalla.
- `zoomLevel < 14` hardcodeado — en la zona de servicio puede que 14 sea insuficiente.
- El click en un cluster no hace zoom automático (depende de la lib) — verificar comportamiento.

**Acción:** Probar in-situ con los medidores reales y ajustar `radius` y el umbral de zoom. No es un bug de código, es calibración.

---

### 10. Map: restringir bounds al área de servicio

**Los bounds están hardcodeados.**

**Archivo:** `components/ui/map.tsx:401–414`

```ts
restriction: {
  latLngBounds: {
    north: -34.9035949 + 0.05,
    south: -34.9035949 - 0.05,
    east:  -58.0373327 + 0.05,
    west:  -58.0373327 - 0.05,
  },
  strictBounds: true,
}
```

El centro es fijo, no viene de la cooperativa ni de los medidores. Si la cooperativa cambia o tiene medidores fuera de ese bbox, el usuario no puede llegar a ellos.

**Adicionalmente:** `bounds` variable está en el array de dependencias del `useMemo` de `OPTIONS` pero **el bbox hardcodeado no lo usa** — es un bug de código muerto.

**Qué hacer:**
1. Hacer que la restricción venga de la ubicación de la cooperativa (está en `Cooperative.address`) o calcularse como bbox de todos los medidores activos.
2. Si se quiere un bbox fijo por ahora, al menos documentarlo como constante con nombre explicativo y sacarlo del `useMemo`.

**El problema del mapa de alta de medidor** (segunda parte del backlog item 10) — no auditado. Revisar el componente de creación de medidor para ver si usa el mismo mapa o uno independiente.

---

### 11. Map: layout controles / zoom / Street View / cursor

**No hay personalización de controles Google Maps.**

**Archivo:** `components/ui/map.tsx:401` (opciones del mapa)

El objeto `OPTIONS` no tiene `zoomControl`, `streetViewControl`, `fullscreenControl` ni `mapTypeControl` configurados. Quedan en posición default de Google Maps (bottom-right). El panel de controles custom está en un overlay CSS.

Si el panel se superpone con los controles nativos de Google Maps, es un problema de z-index o posicionamiento del overlay.

**Acción:**
- Revisar en pantalla de notebook la superposición específica.
- Opción A: Mover el panel de controles a otro lado del mapa.
- Opción B: Deshabilitar los controles nativos de Google Maps (`zoomControl: false`, `streetViewControl: false`) y reemplazarlos con controles custom.
- Opción C: Ajustar la posición de los controles nativos via `zoomControlOptions: { position: google.maps.ControlPosition.TOP_RIGHT }`.

---

### 12. Zonas: columnas de última/próxima facturación

**Bloqueado — sin modelo de facturación.**

Ver tarea 3. No hay `Invoice` ni `Bill` en el schema de Prisma. El único dato relacionado es `ZoneDownload` (historial de exports de CSV), que no es lo mismo que una facturación.

**No tocar hasta resolver tarea 3.**

---

## P2 — Mejoras importantes

---

### 13. Help/Video en PageRenderer

**No implementado. No existe `PageRenderer` en el codebase.**

Buscar con el equipo qué es exactamente `PageRenderer` en este contexto. No hay componente con ese nombre ni con `ExternalVideo`. Puede ser una feature nueva de cero o puede estar en otra branch.

---

### 14. Map: botón "Agrupar"

**Es un checkbox, funciona.** Label podría ser más claro ("Agrupar medidores" o "Clustering"). Si el backlog pide que sea un botón toggle en lugar de checkbox, es cosmético. El behavior real está en tarea 9.

---

### 15. Map: toggle POI

**✅ RESUELTO (2026-06-13).** Label actualizado a "Ocultar POI" con semántica correcta (checked = ocultar POI). `components/ui/map.tsx`.

**Implementado** como checkbox "Off POI" (`components/ui/map.tsx:678`). El label es confuso — debería ser "Mostrar POI" o "Points of Interest" con estado on/off claro.

---

### 19. Zonas: filtro por nombre

**✅ RESUELTO (2026-06-13).** Input de búsqueda implementado en `components/zonas/zones-list.tsx:25–38`. Filtra en cliente por `zone.name.toLowerCase().includes(search)`.

~~**No existe.**~~ `components/zonas/zones-list.tsx` — tabla con columnas Color, Nombre, Medidores, Creada, Acciones. Sin input de búsqueda.

Agregar un input controlado que filtre `zones` por `zone.name.toLowerCase().includes(search)` en el cliente. Simple, bajo riesgo.

---

### 20. ED-86 — Usuarios: filtrar por rol

**✅ RESUELTO (2026-06-13).** Select "Todos los roles / Admin / Lector / Operario" implementado. Param `role` propagado en hook (`hooks/users/use-user-query.ts`), API (`app/api/user/route.ts`) y UI (`components/usuarios/filter-tabs.tsx`).

~~**No existe filtro de rol.**~~ `components/usuarios/filter-tabs.tsx` solo tiene tabs de estado (`activo`, `inactivo`, `pendiente`, `bloqueado`).

Los roles disponibles se obtienen de `userRoles[0]?.role.role_name`. Para agregar el filtro:
1. Agregar param `role` a `useUsersQuery` → `hooks/users/use-user-query.ts`
2. Agregar a la API query `app/api/user/route.ts`
3. Agregar tabs de rol en el componente (o un select separado del filtro de estado)

---

### 21. Zonas: toast de eliminación con undo

**✅ RESUELTO (2026-06-13).** Delete diferido 6s en `components/zonas/zone-detail.tsx:134–169`: remove optimista del cache → toast con botón "Deshacer" → DELETE real al vencer el timer (`useDeleteZoneMutation`). Sin migración de schema.

~~**No implementado.** No hay feedback de eliminación en zonas.~~ Implementar con `sonner` o el toast del proyecto — verificar qué librería de toasts usa el proyecto (`components/ui/`).

---

### 22. Logout: redirección

**Ya resuelto.** `components/profile.tsx:49`:
```ts
signOut({ callbackUrl: "/auth/login" })
```
Redirige a `/auth/login`. Cerrar esta card.

---

### 23–24. Portal Operarios (ED-83) — OCR + validación lectura

**✅ RESUELTO (2026-06-13).**
- **A. OcrScanButton** — `components/portal/ocr-scan-button.tsx` conectado con `useOcrMutation`, `<input type="file" capture="environment">` y ref. Llama a `POST /api/meter/[id]/ocr` (backend ya existía).
- **B. Validación lectura < anterior** — `.refine()` en schema Zod del form + validación equivalente en `app/api/meter/[id]/readings/route.ts` antes de `prisma.reading.create`.

**C. Ocultar lectura previa post-submit** — lógica de estado post-confirmación. Verificar si hay estado en el form o en la query después de submit exitoso.

**D. Polling** — `use-portal.ts` no tiene `refetchInterval`. No hay polling activo. Esta tarea puede cerrarse o marcarse como "no aplica actualmente".

---

### 23–27. Lecturas: edición admin con auditoría

Sin modelo `ReadingAudit` en Prisma. Necesita:
1. Definir si se usa tabla separada o JSON field en `Reading`.
2. Migración.
3. API de PATCH para `Reading`.
4. UI admin para editar.

Es un feature de cero, no un bug fix. Estimar como feature.

---

## P3 — No entran en sprint

- **28. Mapa licencia:** Identificar si usan Google Maps API (probable por `@react-google-maps/api`) — la atribución de Google Maps está incluida por defecto en el mapa.
- **29. ED-84 Demo:** Épica. No romper en sprint.
- **30. Canal de facturación propio:** Épica futura.
- **31. Playwright:** Sin test runner en el proyecto. Configurar Playwright es una tarea de setup, no bloqueante del sprint.
- **32. Tag v1.0:** Hacer después de estabilizar P0/P1.

---

## Tech Debt crítico — PrismaClient sin singleton

**No está en el backlog original pero es una bomba de tiempo.**

**Situación actual:** 33 archivos instancian `new PrismaClient()` de forma independiente. No existe `lib/prisma.ts`.

```
app/api/urgencies/route.ts
app/api/gateway/route.ts
app/api/meter/[id]/route.ts
app/api/meter/[id]/readings/route.ts  ← dos instancias en el mismo archivo
app/api/meter/[id]/valve/route.ts
lib/authOptions.ts
... (28 más)
```

**Por qué es grave:**
- Cada módulo que se carga en el mismo proceso crea su propio pool de conexiones Postgres.
- En desarrollo con hot-reload, Next.js recrea módulos repetidamente → conexiones se acumulan hasta que el proceso muere.
- En producción con varias rutas activas simultáneamente (o serverless con múltiples instancias), se agota el límite de conexiones del servidor Postgres.
- No hay forma de configurar pool ni logging centralizado.

**El fix es un singleton estándar de Next.js + Prisma:**

```ts
// lib/prisma.ts
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
```

Luego en cada route: reemplazar `const prisma = new PrismaClient()` por `import { prisma } from "@/lib/prisma"` y eliminar la instanciación local.

**Scope del cambio:** 33 archivos, pero cada uno es un cambio de 2 líneas (agregar import, eliminar instanciación). Mecánico, bajo riesgo individual, alto impacto acumulado.

**Cuidado con:** `app/api/meter/[id]/readings/route.ts` tiene **dos** instanciaciones — verificar que ambas se reemplacen.

**No incluye:** `prisma/seed.ts` — ese crea su propio cliente intencionalmente (script CLI, no servidor).

---

## Medidores mecánicos — auditoría (2026-06-08)

El flujo de medidores mecánicos existe y funciona para el caso normal. Auditado contra `app/api/operarios/`, `hooks/portal/use-portal.ts`, `components/portal/`.

**Flujo verificado:**
1. Operario entra al portal → `/api/operarios/zones` lista sus zonas (contando medidores `MECHANICAL`).
2. Elige zona → `/api/operarios/zones/[zoneId]/reading-route` → filtra medidores `MECHANICAL` **dentro del polígono** (point-in-polygon), marca "leído hoy / no leído".
3. Carga el valor → `POST /api/meter/[id]/readings` con `instantaneous_flow`, `observations`, `photo_url`, `submitted_by`.
4. Backend crea `Reading` con `status: "VALID"` y registra quién lo cargó.

**Issues encontrados:**

**A. Sin validación de lectura < anterior (CRÍTICO — data corrupta silenciosa)**
- **Archivo:** `app/api/meter/[id]/readings/route.ts` — lee `previousReading` y calcula `prevValue` pero **no rechaza** si el valor nuevo es menor.
- **Archivo:** `components/portal/manual-reading-form.tsx` — schema Zod solo valida tipo número.
- **Fix:** Agregar `.refine()` en el schema Zod del form:
  ```ts
  .refine(
    (val) => !lastReadingValue || Number(val) >= lastReadingValue,
    { message: "La lectura no puede ser menor a la lectura anterior" }
  )
  ```
  Y validación equivalente en el backend antes de `prisma.reading.create`.

**B. OcrScanButton desconectado**
- `components/portal/ocr-scan-button.tsx` — `<Button>` sin `onClick` ni `<input type="file" capture="environment">`. No hace nada.
- Backend `/api/meter/[id]/ocr/route.ts` **existe** pero el botón del front no lo llama.
- Fix: conectar el button a un `<input type="file" capture="environment">` y llamar a `useOcrMutation` del hook que ya existe en `hooks/portal/use-portal.ts`.

**C. Semántica `instantaneous_flow` = `cumulative_flow`**
- El backend guarda el mismo valor en ambos campos: `cumulative_flow: String(instantaneous_flow)`.
- Para un medidor mecánico la lectura ES el acumulado — conceptualmente correcto.
- No es un bug funcional, pero genera confusión de modelo. A documentar o separar en una futura migración.

**D. Hora en `reading-route-item` — ya resuelto en PR #58**
- `components/portal/reading-route-item.tsx` ahora convierte a `America/Argentina/Buenos_Aires` con `.tz(AR_TZ)`.

---

## Bug — Card "Alertas Activas" muestra medidores inactivos en vez de alertas reales

### Síntoma
La card **"Alertas Activas"** del home muestra **13** cuando en realidad hay **3** alertas reales.
La misma card en la página de Cooperativa tiene el mismo problema.

### Causa raíz
`app/api/dashboard/stats/route.ts:313`:
```ts
totalAlerts = inactiveMeters;
```
`inactiveMeters` (líneas ~302-309) cuenta medidores con `status = INACTIVE` **o** `ACTIVE` sin lecturas
en las últimas 24h. El campo dice "alertas" pero contiene **medidores inactivos**. Según
`docs/ECOSISTEMA_FINAL_MEJORADO.md:108-109` esto fue un cambio deliberado en algún punto
(*"Después: totalAlerts = inactiveMeters (correcto)"*) que quedó con la semántica invertida.

### Fuente correcta de alertas
`/api/urgencies` + `utils/alertMapper.ts` (`mapStatusToAlerts`):
| Severidad | Alarmas |
|-----------|---------|
| CRITICAL  | `empty_pipe_alarm`, `reverse_flow_alarm` |
| HIGH      | válvula anómala, `over_range_alarm`, `water_temp_alarm` |
| MEDIUM    | válvula cerrada, `battery_low`, `ee_alarm` |
| LOW       | `INACTIVE_METER` (bucket `inactive` separado, solo cuando `includeInactive: true`) |

**Decisión ya confirmada:** la card debe mostrar `critical + high + medium + low` (excluyendo el bucket de inactivos). Eso da **3**.

### Consumidores del campo bugueado
1. `components/dashboard/home/summary-cards/summary-cards.tsx:79`
   `<AlertsCard activeAlerts={stats.alerts.totalAlerts} />` — el caso reportado.
   ⚠️ Este componente **ya** trae `useUrgencies({ includeInactive: true, limit: 100 })` y calcula
   `totalErrors = critical.length + high.length` para `ErrorsCard`. Tiene la data real disponible.
2. `components/cooperativa/cooperative-overview-cards.tsx:59`
   card "Alertas activas" que usa solo `useDashboardStats()` (sin urgencias).

### Opciones de fix

**Opción 1 — Solo home (mínimo, recomendada para el síntoma inmediato)**
En `summary-cards.tsx` derivar el conteo de `urgencies` ya cargado:
```ts
const totalAlerts =
  (urgencies?.alerts.critical.length ?? 0) +
  (urgencies?.alerts.high.length ?? 0) +
  (urgencies?.alerts.medium.length ?? 0) +
  (urgencies?.alerts.low.length ?? 0);
```
Y pasar `totalAlerts` a `<AlertsCard>`. Cero fetch extra. La card de cooperativa queda desactualizada.

**Opción 2 — Home + cooperativa**
Igual que opción 1, más agregar `useUrgencies` en `cooperative-overview-cards.tsx`.
Suma 1 fetch extra en la página de cooperativa.

**Opción 3 — Fix en la raíz (deuda técnica)**
Redefinir `alerts.totalAlerts` en `/api/dashboard/stats` para que calcule alertas reales (desde
urgencias o replicando la lógica de `alertMapper.ts`). Renombrar el conteo de inactivos a algo como
`inactiveCount`. Arregla ambas cards de una y deja el campo bien nombrado, pero:
- Suma carga de query a un endpoint sensible (ver item #1 del sprint — "Dashboard freeze").
- Duplica la lógica que `/api/urgencies` ya hace.
- Requiere actualizar todos los consumidores del campo.

**Recomendación:** opción 1 para el fix inmediato; opción 3 como deuda técnica cuando se refactorice el endpoint de stats.

---

## Dependencias y orden de ejecución sugerido

```
1. Cooperativa bug (4)           — fix puntual, no tiene dependencias
2. Dashboard freeze (1)          — cambio de config React Query, bajo riesgo
3. Timestamps (6)                — cambio mecánico en 5 componentes
4. Logout (22)                   — YA HECHO → cerrar card
5. Válvula (2)                   — YA HECHO → cerrar card, abrir sub-task de indicador MQTT (7)
6. MQTT status indicator (7)     — depende de entender el comportamiento en prod
7. ED-87 parser (5)              — necesita payload real primero
8. Meter filters (8)             — confirmar si "Fallidos" es suficiente o necesitan enum nuevo
9. Map: clustering calibración (9)
10. Map: bounds dinámicos (10)   — necesita saber fuente de coords de la cooperativa
11. Map: controles layout (11)   — UI ajuste
12. Map: otras mejoras (14–17)   
13. Zonas: filtro nombre (19)    — simple
14. Usuarios: filtro rol (20)    — simple
15. Zonas: toast undo (21)       — simple
16. Portal: OcrScanButton (23)   — fix real
17. Portal: validación lectura (23) — fix real
18. Facturación (3, 12, 27)      — bloqueado hasta definición con Darío
```

---

## Preguntas abiertas para el equipo

1. **Facturación:** ¿Qué correcciones específicas pidió Darío? ¿Hay un sistema externo con el que se integra o es el CSV actual?
2. **ED-87:** ¿Tienen un payload real que produce lecturas incorrectas? Necesitamos el hex crudo.
3. **Filtros de medidores:** ¿"Fallidos (FAULTY)" es suficiente o necesitan un estado `DISCONNECTED` separado?
4. **Map bounds:** ¿Las coordenadas de la cooperativa están en `Cooperative.address`? ¿O hay un campo de bbox/área de servicio?
5. **PageRenderer / Help/Video:** ¿En qué branch o feature vive esto? No existe en `main`.
6. **ED-83 OCR:** ¿Hay un provider de OCR configurado o es una feature pendiente de implementar? El backend `/api/meter/[id]/ocr` existe pero el botón del front no lo llama.
7. **Medidores mecánicos:** ¿Hay casos donde la lectura puede bajar legítimamente (cambio de medidor, reinicio)? Esto define si la validación `>= anterior` debe ser hard-block o solo warning.
8. **Card "Alertas Activas":** ¿Arrancamos con la opción 1 (fix solo en el home, cero fetch extra) o esperamos a la opción 3 (fix en la raíz del endpoint de stats)? Ver sección "Bug — Card Alertas Activas" para el análisis completo.
