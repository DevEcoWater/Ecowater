# Dashboard APIs Documentation

Este directorio contiene las APIs del dashboard de EcoWater para el análisis de consumo de agua y métricas del sistema.

## 📋 Índice

- [Stats API](#stats-api)
- [Consumption API](#consumption-api)
- [Urgencies API](#urgencies-api)
- [Hooks de Frontend](#hooks-de-frontend)
- [Ejemplos de Uso](#ejemplos-de-uso)

---

## 📊 Stats API

**Endpoint:** `GET /api/dashboard/stats`

**Propósito:** Obtener métricas generales del sistema para el dashboard principal.

### Respuesta

```json
{
  "users": {
    "total": 2,
    "active": 2,
    "inactive": 0,
    "pending": 0,
    "blocked": 0
  },
  "meters": {
    "total": 3,
    "active": 3,
    "inactive": 0,
    "maintenance": 0,
    "faulty": 0
  },
  "cooperatives": {
    "total": 1,
    "active": 1,
    "inactive": 0
  },
  "readings": {
    "total": 83,
    "recent": 0.35
  },
  "alerts": {
    "problematicMeters": 0,
    "totalAlerts": 0
  },
  "summary": {
    "totalEntities": 6,
    "systemHealth": "EXCELLENT"
  }
}
```

### Campos

| Campo                      | Tipo     | Descripción                                                      |
| -------------------------- | -------- | ---------------------------------------------------------------- |
| `users.total`              | `number` | Total de usuarios registrados                                    |
| `users.active`             | `number` | Usuarios activos                                                 |
| `users.inactive`           | `number` | Usuarios inactivos                                               |
| `users.pending`            | `number` | Usuarios pendientes                                              |
| `users.blocked`            | `number` | Usuarios bloqueados                                              |
| `meters.total`             | `number` | Total de medidores                                               |
| `meters.active`            | `number` | Medidores activos                                                |
| `meters.inactive`          | `number` | Medidores inactivos                                              |
| `meters.maintenance`       | `number` | Medidores en mantenimiento                                       |
| `meters.faulty`            | `number` | Medidores con fallas                                             |
| `cooperatives.total`       | `number` | Total de cooperativas                                            |
| `cooperatives.active`      | `number` | Cooperativas activas                                             |
| `cooperatives.inactive`    | `number` | Cooperativas inactivas                                           |
| `readings.total`           | `number` | Total de lecturas del mes actual                                 |
| `readings.recent`          | `number` | **Consumo total del mes actual (m³)**                            |
| `alerts.problematicMeters` | `number` | Medidores con problemas                                          |
| `alerts.totalAlerts`       | `number` | Total de alertas activas                                         |
| `summary.totalEntities`    | `number` | Total de entidades del sistema                                   |
| `summary.systemHealth`     | `string` | Estado del sistema: "EXCELLENT", "GOOD", "ATTENTION", "CRITICAL" |

### Cálculo de Consumo

- **Período**: Mes actual completo (1 al 30/31)
- **Método**: Cierres de período (recomendado por estándares industriales)
- **Timezone**: America/Argentina/Buenos_Aires
- **Fórmula**: `MAX(totalizador_día) - MAX(totalizador_día_anterior)`

---

## 📈 Consumption API

**Endpoint:** `GET /api/dashboard/consumption`

**Propósito:** Obtener datos de consumo para gráficos y análisis temporal.

### Parámetros

| Parámetro   | Tipo     | Requerido | Descripción                  | Valores                                               |
| ----------- | -------- | --------- | ---------------------------- | ----------------------------------------------------- |
| `period`    | `string` | No        | Período de análisis          | `"month"` (default), `"7d"`, `"30d"`, `"90d"`, `"1y"` |
| `meterId`   | `string` | No        | ID del medidor específico    | UUID o `"all"` (default)                              |
| `startDate` | `string` | No        | Fecha de inicio (YYYY-MM-DD) | ISO date string                                       |
| `endDate`   | `string` | No        | Fecha de fin (YYYY-MM-DD)    | ISO date string                                       |
| `groupBy`   | `string` | No        | Agrupación temporal          | `"day"` (default), `"week"`, `"month"`                |

### Respuesta

```json
{
  "meterId": "all",
  "startDate": "2025-09-01",
  "endDate": "2025-10-01",
  "period": "month",
  "groupBy": "day",
  "series": [
    {
      "fecha": "2025-09-01",
      "consumo_m3": 0,
      "medidores_activos": 3
    },
    {
      "fecha": "2025-09-02",
      "consumo_m3": 0.04,
      "medidores_activos": 3
    }
  ]
}
```

### Campos

| Campo                        | Tipo     | Descripción                                |
| ---------------------------- | -------- | ------------------------------------------ |
| `meterId`                    | `string` | ID del medidor consultado o "all"          |
| `startDate`                  | `string` | Fecha de inicio del período (YYYY-MM-DD)   |
| `endDate`                    | `string` | Fecha de fin del período (YYYY-MM-DD)      |
| `period`                     | `string` | Período consultado                         |
| `groupBy`                    | `string` | Agrupación temporal aplicada               |
| `series[].fecha`             | `string` | Fecha del punto de datos (YYYY-MM-DD)      |
| `series[].consumo_m3`        | `number` | Consumo en metros cúbicos                  |
| `series[].medidores_activos` | `number` | Cantidad de medidores activos en esa fecha |

### Comportamiento por Defecto

- **Sin parámetros**: Mes actual completo, todos los medidores, agrupado por día
- **Para dashboard**: Siempre mes actual completo
- **Para análisis**: Períodos flexibles (7d, 30d, 90d, 1y)

### Cálculo de Consumo

- **Método**: Cierres de período (mismo que Stats API)
- **Timezone**: America/Argentina/Buenos_Aires
- **Normalización**: Limpieza automática de `cumulative_flow` (quita "m3", comas, etc.)
- **Resets**: Manejo automático de resets de medidores (consumo = 0 si Δ < 0)

---

## 🚨 Urgencies API

**Endpoint:** `GET /api/dashboard/urgencies`

**Propósito:** Obtener alertas y urgencias del sistema.

### Respuesta

```json
{
  "alerts": {
    "critical": [...],
    "alarms": [...],
    "inactive": [...]
  },
  "urgencyMetrics": {
    "totalAlerts": 0,
    "criticalCount": 0,
    "alarmCount": 0,
    "inactiveCount": 0,
    "usersAffected": 0,
    "systemHealth": "GOOD"
  },
  "usersWithProblems": [...]
}
```

### Tipos de Alertas

1. **CRITICAL_METER**: Medidores con estado crítico
2. **ALARM**: Lecturas con alarmas detectadas
3. **INACTIVE_METER**: Medidores sin transmisión > 24h

---

## 🎣 Hooks de Frontend

### useDashboardStats

```typescript
import { useDashboardStats } from "@/hooks/dashboard/use-dashboard-stats";

const { data: stats, isLoading, error } = useDashboardStats();
```

### useConsumptionData

```typescript
import { useConsumptionData } from "@/hooks/dashboard/use-consumption-data";

// Para dashboard (mes actual)
const { data: consumption } = useConsumptionData();
```

### useMeterConsumption

```typescript
import {
  useMeterConsumption,
  useMeterConsumptionCurrentMonth,
  useMeterConsumptionLast7Days,
  useMeterConsumptionLast30Days,
  useMeterConsumptionRange,
} from "@/hooks/dashboard/use-meter-consumption";

// Hook principal (flexible)
const { data } = useMeterConsumption({
  meterId: "uuid-del-medidor",
  period: "month",
  groupBy: "day",
});

// Hook para mes actual
const { data } = useMeterConsumptionCurrentMonth("uuid-del-medidor");

// Hook para últimos 7 días
const { data } = useMeterConsumptionLast7Days("uuid-del-medidor");

// Hook para rango personalizado
const { data } = useMeterConsumptionRange(
  "uuid-del-medidor",
  "2025-09-01",
  "2025-09-10",
  "day"
);
```

---

## 🔧 Ejemplos de Uso

### Dashboard Principal

```typescript
function Dashboard() {
  const { data: stats } = useDashboardStats();
  const { data: consumption } = useConsumptionData();

  return (
    <div>
      {/* Cards con métricas */}
      <ConsumptionCard totalConsumption={stats.readings.recent} />

      {/* Gráfico de consumo */}
      <ConsumptionChart data={consumption} />
    </div>
  );
}
```

### Vista de Medidor Individual

```typescript
function MeterDetail({ meterId }: { meterId: string }) {
  const { data: consumption } = useMeterConsumptionCurrentMonth(meterId);

  return (
    <div>
      <h2>Consumo del Medidor {meterId}</h2>
      <Chart data={consumption.series} />
    </div>
  );
}
```

### Análisis Temporal

```typescript
function TemporalAnalysis({ meterId }: { meterId: string }) {
  const { data: last7Days } = useMeterConsumptionLast7Days(meterId);
  const { data: last30Days } = useMeterConsumptionLast30Days(meterId);

  return (
    <div>
      <Chart title="Últimos 7 días" data={last7Days.series} />
      <Chart title="Últimos 30 días" data={last30Days.series} />
    </div>
  );
}
```

---

## 🧮 Método de Cálculo de Consumo

### Algoritmo de Cierres de Período

1. **Normalización**: Limpiar `cumulative_flow` (quitar "m3", comas, etc.)
2. **Timezone**: Convertir timestamps a hora local Argentina
3. **Agrupación**: Agrupar por día/semana/mes según `groupBy`
4. **Cierres**: Para cada período, obtener:
   - Último totalizador ≤ 24:00 del día (cierre del día)
   - Último totalizador ≤ 24:00 del día anterior (cierre día anterior)
5. **Consumo**: `MAX(0, cierre_día - cierre_día_anterior)`
6. **Fallback**: Si no hay cierre anterior, usar `MAX - MIN` dentro del día

### Ventajas del Método

- ✅ **Robusto**: Maneja resets de medidores automáticamente
- ✅ **Preciso**: Usa cierres de período (estándar industrial)
- ✅ **Consistente**: Mismo algoritmo en Stats y Consumption
- ✅ **Timezone-aware**: Todo en hora local Argentina

---

## 🚀 Pruebas de las APIs

### Stats API

```bash
curl http://localhost:3000/api/dashboard/stats
```

### Consumption API (todos los medidores, mes actual)

```bash
curl http://localhost:3000/api/dashboard/consumption?period=month
```

### Consumption API (medidor específico, últimos 7 días)

```bash
curl "http://localhost:3000/api/dashboard/consumption?meterId=9e1f13e6-5ea3-4f40-9cf0-434d7dd705a9&period=7d"
```

### Verificación de Consistencia

```javascript
// En consola del navegador
const stats = await fetch("/api/dashboard/stats").then((r) => r.json());
const consumption = await fetch("/api/dashboard/consumption?period=month").then(
  (r) => r.json()
);

const totalGrafico = consumption.series.reduce(
  (sum, day) => sum + day.consumo_m3,
  0
);
console.log("Stats total:", stats.readings.recent);
console.log("Consumption total:", totalGrafico);
console.log(
  "Coinciden:",
  Math.abs(stats.readings.recent - totalGrafico) < 0.01
);
```

---

## 📝 Notas Técnicas

- **Base de datos**: PostgreSQL con Prisma ORM
- **Timezone**: America/Argentina/Buenos_Aires
- **Caching**: React Query con 5 minutos de stale time
- **Raw SQL**: Usado para cálculos complejos de consumo
- **Normalización**: Automática de valores `cumulative_flow`
- **Error handling**: Manejo robusto de errores de conexión y datos

---

## 🔄 Actualizaciones

- **Refetch automático**: Cada 60 segundos
- **Invalidación**: Al cambiar parámetros de consulta
- **Optimistic updates**: No aplicables (datos de solo lectura)
