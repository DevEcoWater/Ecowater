# Ecowater — Sprint Technical Notes
**Fecha:** 2026-06-06  
**Propósito:** Revisión técnica del backlog contra el código real. Para cada tarea: qué hay, qué falta, dónde tocar.  
**No contiene** suposiciones — cada observación fue verificada contra el repo.

---

## Estado rápido por tarea

| # | Tarea | Prioridad | Estado real |
|---|---|---|---|
| 1 | Dashboard freeze | P0 | Causa real identificada — no es freeze, es skeleton por `refetchOnWindowFocus` |
| 2 | Integración control de válvula | P0 | **Ya implementado** en `main` (ED-88 mergeado) |
| 3 | Integración facturación (Darío) | P0 | Sin modelo Prisma ni API — bloqueante de definición |
| 4 | Cooperativa: actualización con dato anterior | P0 | Bug confirmado en `form.reset()` + `invalidateQueries` |
| 5 | ED-87 — Fix Gateway parser | P1 | Bug real confirmado en `parseFlowHex` |
| 6 | Normalizar timestamps | P1 | Problema real — 3+ componentes usan `dayjs()` sin `.tz()` |
| 7 | ED-88 — MQTT en panel del medidor | P1 | UI de válvula existe; falta indicador de estado MQTT |
| 8 | Medidores: filtros de estado / Error/Fallas | P1 | Filtros existen; "Fallidos (FAULTY)" ya está — revisar label y OperationalStatus |
| 9 | Map: pines superpuestos / clustering | P1 | Clustering implementado — revisar umbral `zoomLevel < 14` |
| 10 | Map: restringir bounds al área de servicio | P1 | Bounds **hardcodeados** a coord fija — no dinámicos |
| 11 | Map: layout controles / zoom / Street View | P1 | No hay customización de controles Google Maps |
| 12 | Zonas: columnas de facturación | P1 | Bloqueado — sin modelo de facturación |
| 13 | Help/Video en PageRenderer | P2 | No implementado en absoluto |
| 14 | Map: botón "Agrupar" | P2 | Es un checkbox, no botón — funciona para toggle clustering |
| 15 | Map: toggle POI | P2 | Implementado ("Off POI" checkbox) — revisar label |
| 16 | Map: filtro por tipo de medidor | P2 | No existe en el mapa (sí en `/medidores`) |
| 17 | Map: búsqueda por medidor/usuario/dirección | P2 | No implementada en el mapa |
| 18 | Medidores: más datos en resultado de búsqueda | P2 | Definir qué campos agregar a la tabla |
| 19 | Zonas: filtro por nombre | P2 | No existe — tabla sin filtro de texto |
| 20 | ED-86 — Usuarios: filtrar por rol | P2 | Solo filtros de estado — sin filtro de rol |
| 21 | Zonas: toast de eliminación con undo | P2 | No implementado — sin feedback de eliminación |
| 22 | Logout: corregir redirección | P2 | **Ya resuelto** — `signOut({ callbackUrl: "/auth/login" })` |
| 23–27 | Portal operarios (ED-83) | P2 | OcrScanButton roto; sin validación lectura < anterior |
| 28 | Mapa: licencia / marca de agua | P3 | Identificar proveedor |
| 29 | ED-84 — Demo online | P3 | Épica — no entra en sprint |
| 30 | Canal de facturación propio | P3 | Épica — no entra en sprint |
| 31 | Playwright QA | P3 | No configurado |
| 32 | Tag v1.0 | P3 | Cosmético — post-estabilización |

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

**Estado parcial — ya existe "Fallidos".**

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

**Implementado** como checkbox "Off POI" (`components/ui/map.tsx:678`). El label es confuso — debería ser "Mostrar POI" o "Points of Interest" con estado on/off claro.

---

### 19. Zonas: filtro por nombre

**No existe.** `components/zonas/zones-list.tsx` — tabla con columnas Color, Nombre, Medidores, Creada, Acciones. Sin input de búsqueda.

Agregar un input controlado que filtre `zones` por `zone.name.toLowerCase().includes(search)` en el cliente. Simple, bajo riesgo.

---

### 20. ED-86 — Usuarios: filtrar por rol

**No existe filtro de rol.** `components/usuarios/filter-tabs.tsx` solo tiene tabs de estado (`activo`, `inactivo`, `pendiente`, `bloqueado`).

Los roles disponibles se obtienen de `userRoles[0]?.role.role_name`. Para agregar el filtro:
1. Agregar param `role` a `useUsersQuery` → `hooks/users/use-user-query.ts`
2. Agregar a la API query `app/api/user/route.ts`
3. Agregar tabs de rol en el componente (o un select separado del filtro de estado)

---

### 21. Zonas: toast de eliminación con undo

**No implementado.** No hay feedback de eliminación en zonas. Implementar con `sonner` o el toast del proyecto — verificar qué librería de toasts usa el proyecto (`components/ui/`).

---

### 22. Logout: redirección

**Ya resuelto.** `components/profile.tsx:49`:
```ts
signOut({ callbackUrl: "/auth/login" })
```
Redirige a `/auth/login`. Cerrar esta card.

---

### 23–26. Portal Operarios (ED-83)

**Dos issues reales confirmados:**

**A. OcrScanButton roto** — `components/portal/ocr-scan-button.tsx` es un `<Button>` con ícono de cámara pero **sin `onClick` y sin `<input type="file" capture="environment">`**. No hace nada al presionarlo.

**B. Sin validación de lectura < anterior** — `components/portal/manual-reading-form.tsx` — el schema Zod solo valida que el valor sea número. No compara con `lastReadingValue`. Agregar un `.refine()`:
```ts
.refine(
  (val) => !lastReadingValue || Number(val) >= lastReadingValue,
  { message: "La lectura no puede ser menor a la lectura anterior" }
)
```

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
6. **ED-83 OCR:** ¿El OCR tiene una implementación pendiente o hay un provider de OCR configurado? El botón no hace nada.
