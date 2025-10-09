# 🔄 Ecosistema de APIs - EcoWater

## 📊 Diagrama de Flujo de Datos

```mermaid
graph TB
    %% Entrada de Datos
    IoT[📡 Medidor IoT] -->|Datos Hex| Gateway[🔌 Gateway API<br/>/api/gateway]

    %% Procesamiento Gateway
    Gateway --> Parse[🔍 Parse Data<br/>parseMeterData<br/>parseMeterStatus]
    Parse --> DB[(🗄️ Base de Datos<br/>PostgreSQL)]

    %% Actualización de Estados
    DB --> MeterUpdate[📝 Meter Update<br/>status + operational_status]
    DB --> ReadingCreate[📊 Reading Create<br/>timestamp + data]
    DB --> StatusCreate[⚠️ Status Create<br/>alarms + battery]

    %% APIs de Consulta
    DB --> StatsAPI[📈 Stats API<br/>/api/dashboard/stats]
    DB --> UrgenciesAPI[🚨 Urgencies API<br/>/api/urgencies]
    DB --> MeterAPI[📋 Meter API<br/>/api/meter]
    DB --> ConsumptionAPI[💧 Consumption API<br/>/api/dashboard/consumption]

    %% Cron Job
    CronJob[⏰ Cron Job<br/>/api/cron/update-meter-status] -->|Cada 6h| DB
    CronJob -->|Actualiza status| MeterUpdate

    %% Frontend
    StatsAPI --> Dashboard[🖥️ Dashboard<br/>Cards + Gráficos]
    UrgenciesAPI --> Dashboard
    MeterAPI --> MeterList[📋 Lista Medidores]
    ConsumptionAPI --> Charts[📊 Gráficos Consumo]

    %% Retroalimentación
    Dashboard -.->|❌ NO HAY| Gateway
    MeterList -.->|❌ NO HAY| Gateway
    Charts -.->|❌ NO HAY| Gateway

    %% Estilos
    classDef api fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef db fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef frontend fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef problem fill:#ffebee,stroke:#c62828,stroke-width:2px

    class Gateway,StatsAPI,UrgenciesAPI,MeterAPI,ConsumptionAPI,CronJob api
    class DB db
    class Dashboard,MeterList,Charts frontend
    class MeterUpdate,ReadingCreate,StatusCreate problem
```

## 🔄 Flujo de Estados (Problema Actual)

```mermaid
sequenceDiagram
    participant IoT as 📡 Medidor IoT
    participant Gateway as 🔌 Gateway API
    participant DB as 🗄️ Base de Datos
    participant Cron as ⏰ Cron Job
    participant Stats as 📈 Stats API
    participant UI as 🖥️ Dashboard

    Note over IoT,UI: Flujo Actual (CON PROBLEMAS)

    IoT->>Gateway: Datos cada X horas
    Gateway->>DB: Actualiza Meter.status = "ACTIVE"
    Gateway->>DB: Crea Reading + Status

    Note over DB: Estado: ACTIVE<br/>Pero sin readings recientes

    Stats->>DB: Cuenta medidores
    Note over Stats: Calcula inactiveMeters<br/>basado en readings recientes
    Stats->>UI: Muestra datos inconsistentes

    Note over Cron: Espera 6 horas...
    Cron->>DB: Actualiza status = "INACTIVE"

    Stats->>DB: Cuenta medidores
    Stats->>UI: Ahora muestra datos correctos

    Note over IoT,UI: ❌ PROBLEMA: Retraso de hasta 6 horas
```

## 🔄 Flujo de Estados (Solución Propuesta)

```mermaid
sequenceDiagram
    participant IoT as 📡 Medidor IoT
    participant Gateway as 🔌 Gateway API
    participant DB as 🗄️ Base de Datos
    participant Stats as 📈 Stats API
    participant UI as 🖥️ Dashboard

    Note over IoT,UI: Flujo Mejorado (CON RETROALIMENTACIÓN)

    IoT->>Gateway: Datos cada X horas
    Gateway->>DB: Actualiza Meter.status = "ACTIVE"
    Gateway->>DB: Crea Reading + Status

    Note over Gateway: ✅ NUEVO: Verificar estado real
    Gateway->>Gateway: Calcular conectividad
    Gateway->>DB: Actualizar status real

    Stats->>DB: Cuenta medidores
    Note over Stats: Datos consistentes<br/>inmediatamente
    Stats->>UI: Muestra datos correctos

    Note over IoT,UI: ✅ SOLUCIÓN: Consistencia inmediata
```

## 🎯 Problemas Identificados

### **1. Falta de Retroalimentación**

- **Gateway API**: Solo actualiza cuando llegan datos nuevos
- **Stats API**: Calcula estados en tiempo real pero no actualiza BD
- **Cron Job**: Actualiza BD pero con retraso de hasta 6 horas

### **2. Inconsistencias Temporales**

- **Tiempo de inconsistencia**: Hasta 6 horas
- **Impacto**: Dashboard muestra datos incorrectos
- **Frecuencia**: Cada vez que un medidor se vuelve inactivo

### **3. Información Redundante**

- **Stats API**: Devuelve datos que no se usan en el dashboard
- **Urgencies API**: Maneja alertas por separado
- **Duplicación**: Misma lógica en múltiples APIs

## 🛠️ Soluciones Propuestas

### **Solución 1: Retroalimentación Inmediata en Gateway**

```typescript
// En Gateway API, después de crear Reading
const meterConnectivity = await calculateMeterConnectivity(meter.id);
if (meterConnectivity.status === "INACTIVE") {
  await prisma.meter.update({
    where: { id: meter.id },
    data: { status: "INACTIVE" },
  });
}
```

### **Solución 2: Stats API Inteligente**

```typescript
// En Stats API, actualizar BD mientras calcula
const inactiveMeters = await prisma.meter.findMany({
  where: {
    /* criterios de inactividad */
  },
});

// Actualizar BD inmediatamente
await prisma.meter.updateMany({
  where: { id: { in: inactiveMeters.map((m) => m.id) } },
  data: { status: "INACTIVE" },
});
```

### **Solución 3: API Unificada**

```typescript
// Crear /api/dashboard/unified que:
// 1. Actualice estados en BD
// 2. Devuelva datos consistentes
// 3. Elimine redundancia
```

## 📊 Comparación de APIs

| API           | Propósito                | Actualiza BD                | Consistencia               | Redundancia |
| ------------- | ------------------------ | --------------------------- | -------------------------- | ----------- |
| **Gateway**   | Entrada de datos         | ✅ Solo cuando llegan datos | ❌ No verifica estado real | ❌ No       |
| **Stats**     | Métricas dashboard       | ❌ Solo lee                 | ❌ Calcula en tiempo real  | ✅ Mucha    |
| **Urgencies** | Alertas                  | ❌ Solo lee                 | ✅ Consistente             | ✅ Poca     |
| **Cron**      | Actualización automática | ✅ Cada 6h                  | ✅ Consistente             | ❌ No       |

## 🎯 Recomendaciones

### **Inmediatas:**

1. ✅ **Corregir cálculo de alertas** (ya hecho)
2. 🔄 **Implementar retroalimentación en Gateway**
3. 🧹 **Limpiar datos redundantes en Stats**

### **A Mediano Plazo:**

1. 🔄 **Crear API unificada de dashboard**
2. ⚡ **Reducir frecuencia de Cron a 1 hora**
3. 📊 **Implementar cache inteligente**

### **A Largo Plazo:**

1. 🏗️ **Refactorizar arquitectura de estados**
2. 📈 **Implementar métricas en tiempo real**
3. 🔄 **Sistema de eventos para actualizaciones**

## 🔍 Verificación de Consistencia

### **Test de Consistencia:**

```bash
# 1. Verificar stats
curl /api/dashboard/stats | jq '.alerts.totalAlerts'

# 2. Verificar urgencies
curl /api/urgencies | jq '.meta.total'

# 3. Deben coincidir
echo "Stats: $(stats), Urgencies: $(urgencies)"
```

### **Métricas de Calidad:**

- **Consistencia**: 100% entre APIs
- **Tiempo de actualización**: < 1 minuto
- **Redundancia**: < 20% de datos no utilizados
