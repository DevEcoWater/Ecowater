# Medidores: tipos, estados y diseño futuro

> **Estado:** vigente a junio 2026. Complementa `SISTEMA_DE_ESTADOS_Y_ALERTAS.md` con foco en la
> distinción SMART vs MECHANICAL y en los approaches recomendados para evolucionar el modelo.

---

## 1. Tipos de medidor

El sistema reconoce dos tipos (`enum MeterType`, `prisma/schema.prisma:244-247`):

| Atributo | SMART | MECHANICAL |
|---|---|---|
| Reporta por LoRa | Sí (automático) | No (lectura manual) |
| Status mostrado | **Derivado** de conectividad — recency de la última lectura | **Crudo** de la DB (`meterConnectivity.ts:18-20`) |
| Auto-toggle (cron) | Sí — marcado INACTIVE si sin lecturas en 24h | **No** — excluido explícitamente (`cron/update-meter-status/route.ts:34,54`) |
| Filtros Activo/Inactivo | Participa por status DB | Participa por status DB (mismo criterio desde junio 2026) |
| Conteos de tabs (badges) | Por status DB (`groupBy`) | Por status DB — incluido desde junio 2026 |
| Conteo activos/inactivos en `/api/dashboard/stats` | Solo SMART (por diseño) | **Excluido** (desde el fix de junio 2026) |
| Alertas / urgencias | Sí | **Excluido** (`app/api/urgencies/route.ts:188`) |
| Badge de estado en lista | Chip con status derivado | Chip con status DB real (desde junio 2026) |
| Columna conectividad | ONLINE / STALE / OFFLINE | `"—"` |
| Icono en mapa | Icono estándar | Icono distinto (`components/ui/map.tsx:547-549`) |

### Creación de un medidor mecánico

El form `components/medidores/mechanical-meter-form.tsx` no envía `status`. El API
(`app/api/meter/route.ts:37`) resuelve `status ?? "ACTIVE"`, así que un mecánico nace `ACTIVE` y
`operational_status = OPERATIONAL`. No tiene `dev_eui`, `application_id` ni `application_name` (se
nullean, `route.ts:32-34`).

---

## 2. Estados actuales

```prisma
enum MeterStatus {
  ACTIVE
  INACTIVE
  MAINTENANCE
  FAULTY
}
```

| Estado | Significado para SMART | Significado para MECHANICAL |
|---|---|---|
| `ACTIVE` | En línea: tiene lectura en las últimas 24h | Activo: asignado a un usuario, sin problemas |
| `INACTIVE` | Sin lecturas en 24h (auto-seteado por cron o stats route) | Sin usuario asignado — **hoy: valor manual, sujeto a corrupción** |
| `MAINTENANCE` | Requiere revisión | Requiere revisión (manual) |
| `FAULTY` | Alarma crítica detectada en parseo de lectura | Error / falla (manual) |

### Dónde se fija el status para cada tipo

**SMART:**
1. El cron (`/api/cron/update-meter-status`) lo actualiza automáticamente cada hora.
2. El GET de `/api/dashboard/stats` también lo actualiza en cada carga del home (side-effect en un
   GET — ver sección de deuda técnica).
3. `parseMeterStatus` (`utils/parseMeterStatus.ts:53-62`) detecta alarmas críticas y pone
   `FAULTY`/`MAINTENANCE` al ingerir una lectura en `/api/gateway`.

**MECHANICAL:**
- Solo por acción manual del administrador (form de edición).
- El cron y el stats route tienen el guard `meter_type: "SMART"` — no los tocan.

---

## 3. El problema de fondo: un campo que mezcla dos ejes

El campo `Meter.status` combina **conectividad** (derivada, dinámica) y **estado administrativo**
(manual, estático). Eso produce choques:

- Para un SMART, `ACTIVE` significa "está enviando datos ahora". Para un MECHANICAL, `ACTIVE` debería
  significar "tiene usuario asignado y opera correctamente". No son la misma cosa.
- El término `INACTIVE` tiene semántica invertida por tipo: desconectado (smart) vs sin usuario
  (mecánico, a futuro).
- Agregar un estado "Desactivado por falta de pago" en este mismo campo mezclaría un tercer eje:
  *estado de facturación*.

### Otros problemas conocidos

| Problema | Detalle | Archivo |
|---|---|---|
| Side-effect en GET | El endpoint `/api/dashboard/stats` actualiza el status de medidores en cada carga | `stats/route.ts:263-292` |
| Lógica duplicada | La misma lógica de activación/desactivación existe en el cron Y en el stats route | `cron/route.ts` vs `stats/route.ts` |
| Type mismatch | `MeterFormData.operational_status` acepta `"NON_OPERATIONAL"` pero ese valor no existe en el enum Prisma | `types/meters/meter-types.ts:58` |
| totalAlerts mal nombrado | `stats.alerts.totalAlerts` contiene conteo de inactivos, no de alertas reales (parcialmente resuelto en el front en junio 2026; la raíz en el backend queda como deuda) | `stats/route.ts:313` |

---

## 4. Approaches recomendados a futuro

### 4.1 "Inactivo" para mecánicos = derivado del usuario asignado

**Propuesta:** eliminar `INACTIVE` como estado manual del mecánico. En cambio, derivar el estado
mostrado de la relación `UserMeter`:

- Si el mecánico tiene al menos un `UserMeter` activo → mostrar `ACTIVE`.
- Si no tiene usuario asignado → mostrar `INACTIVE / Sin usuario asignado`.

**Ventajas:**
- Cero gestión manual: no se desincroniza.
- Coherente con cómo el sistema ya trata los medidores inteligentes (el estado refleja la realidad).

**Dónde tocaría:**
- `utils/meterConnectivity.ts` → nueva rama para `MECHANICAL` que consulte `userMeters`.
- `app/api/meter/route.ts` → include `userMeters` en la query y pasar al `computeChipStatus`.
- Display en columnas/mapa ya funcionaría automáticamente si `computeChipStatus` devuelve el valor
  correcto.

**Lo que NO cambiaría:** el enum `MeterStatus` en Prisma. Solo el cómputo en runtime.

---

### 4.2 Estado "Desactivado por falta de pago" — solo mecánicos

Hay dos modelos posibles:

#### Opción A — Nuevo valor en `MeterStatus` (ej. `SUSPENDED`)

```prisma
enum MeterStatus {
  ACTIVE
  INACTIVE
  MAINTENANCE
  FAULTY
  SUSPENDED   // nuevo
}
```

**Pros:** un solo campo, UI/filtros ya conocen `MeterStatus`.
**Contras:** mezcla un tercer eje (facturación) en un campo de conectividad/estado operativo.
Complica el cron (habría que excluir `SUSPENDED` del auto-toggle) y las alertas (¿un `SUSPENDED`
genera alerta?). Requiere migración de schema.

#### Opción B — Campo separado `billing_status` en `Meter` (recomendada)

```prisma
enum BillingStatus {
  CURRENT      // al día
  OVERDUE      // en mora
  SUSPENDED    // cortado por falta de pago
}

model Meter {
  ...
  billing_status BillingStatus @default(CURRENT)
}
```

**Pros:** separa ejes. El cron no se complica. Las alertas pueden filtrar por `billing_status:
SUSPENDED` de forma explícita. A futuro aplica también a SMART sin modificar la lógica de
conectividad.
**Contras:** una migración de schema y un campo nuevo en forms/filtros/columnas.

**Recomendación:** Opción B. La mezcla de ejes en el campo `status` ya generó los bugs de junio
2026 — agregar un tercer eje profundiza el problema.

---

### 4.3 Fix raíz de `totalAlerts` en el backend (deuda técnica)

El fix de junio 2026 resolvió el síntoma en el frontend (las cards derivan el conteo de
`/api/urgencies`). La raíz en backend sigue: `stats/route.ts:313 totalAlerts = inactiveMeters`.

**Approach:** renombrar `inactiveMeters` a `inactiveCount` en la respuesta y calcular `totalAlerts`
desde la lógica de `alertMapper.ts` (misma fuente que `/api/urgencies`). Actualizar los consumidores
del campo. Ver opciones detalladas en `SPRINT_TECHNICAL_NOTES.md:593-618`.

---

## 5. Deuda técnica y riesgos

| # | Problema | Impacto | Prioridad |
|---|---|---|---|
| 1 | GET con escritura en `/api/dashboard/stats` | Performance + semántica incorrecta | Media |
| 2 | Lógica activación/desactivación duplicada (cron + stats) | Inconsistencias si se edita una pero no la otra | Media |
| 3 | `totalAlerts = inactiveMeters` en backend | Campo mal nombrado, potencialmente confuso para otros consumidores futuros | Baja (fix visible en front) |
| 4 | Type mismatch `NON_OPERATIONAL` | Error de tipos silencioso | Baja |
| 5 | Status de mecánicos sin semántica clara (no existe flujo para cambiarlo) | Columna siempre dice "Activo" — no aporta info real aún | Alta (bloquea §4.1 y §4.2) |
| 6 | Dualidad smart: columna usa conectividad en tiempo real, filtro/contador usa status de DB (cron, hasta 1h de lag) | Inconsistencia visual leve al cambiar de estado | Baja |

---

## Referencias

- `SPRINT_TECHNICAL_NOTES.md` — detalle del bug `totalAlerts`, opciones de fix y decisiones
- `docs/SISTEMA_DE_ESTADOS_Y_ALERTAS.md` — arquitectura completa del sistema de alertas
- `utils/meterConnectivity.ts` — lógica de derivación de status por tipo
- `app/api/cron/update-meter-status/route.ts` — auto-toggle correcto (referencia canónica)
- `app/api/urgencies/route.ts` — fuente de verdad para alertas reales
