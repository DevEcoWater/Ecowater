# 🔄 Sistema de Actualización Automática de Estados - EcoWater

## 📋 Resumen

Este documento describe la implementación del sistema automático de actualización de estados de medidores, que resuelve las inconsistencias identificadas entre el estado en base de datos y el estado real de conectividad.

---

## 🎯 Problema Resuelto

### **Antes (Inconsistente)**

- Medidores sin readings en 24h mantenían `status: "ACTIVE"` en BD
- Dashboard mostraba estadísticas incorrectas
- Inconsistencia entre APIs de `stats`, `urgencies` y `meter`

### **Después (Consistente)**

- Medidores sin readings en 24h se marcan automáticamente como `status: "INACTIVE"`
- Medidores que vuelven a enviar datos se marcan como `status: "ACTIVE"`
- Todas las APIs muestran datos consistentes

---

## 🛠️ Implementación

### **1. API de Actualización Automática**

**Endpoint**: `/api/cron/update-meter-status`

**Métodos**:

- `POST`: Ejecuta la actualización automática
- `GET`: Verifica el estado actual y inconsistencias

**Funcionalidad**:

```typescript
// Desactiva medidores sin readings en 24h
const metersToDeactivate = await prisma.meter.findMany({
  where: {
    status: "ACTIVE",
    readings: {
      none: {
        timestamp: { gte: last24Hours },
      },
    },
  },
});

// Reactiva medidores que vuelven a enviar datos
const metersToActivate = await prisma.meter.findMany({
  where: {
    status: "INACTIVE",
    readings: {
      some: {
        timestamp: { gte: last24Hours },
      },
    },
  },
});
```

### **2. Configuración de Cron Job**

#### **Opción A: Vercel Cron (Recomendada)**

**Archivo**: `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/update-meter-status",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

**Frecuencia**: Cada 6 horas (`0 */6 * * *`)

#### **Opción B: Variables de Entorno**

**Agregar a `.env.local`**:

```bash
CRON_SECRET="your-super-secret-cron-key-here"
```

**Configurar en Vercel Dashboard**:

1. Ir a Project Settings → Environment Variables
2. Agregar `CRON_SECRET` con un valor seguro
3. El endpoint verificará esta clave para autorización

#### **Opción C: Testing Local**

**Scripts en `package.json`**:

```json
{
  "scripts": {
    "cron:update-meters": "curl -X POST http://localhost:3000/api/cron/update-meter-status",
    "cron:check-status": "curl -X GET http://localhost:3000/api/cron/update-meter-status"
  }
}
```

---

## 📊 Estadísticas Corregidas

### **API `/api/dashboard/stats` - Antes vs Después**

#### **Antes (Incorrecto)**

```typescript
const meterCounts = {
  total: totalMeters,
  active: totalMeters - problematicMeters, // ❌ Incorrecto
  inactive: 0, // ❌ Siempre 0
  maintenance: 0, // ❌ Siempre 0
  faulty: problematicMeters,
};
```

#### **Después (Correcto)**

```typescript
const meterCounts = {
  total: totalMeters,
  active: await prisma.meter.count({
    where: {
      status: "ACTIVE",
      readings: {
        some: { timestamp: { gte: last24Hours } },
      },
    },
  }),
  inactive: await prisma.meter.count({
    where: {
      OR: [
        { status: "INACTIVE" },
        {
          status: "ACTIVE",
          readings: { none: { timestamp: { gte: last24Hours } } },
        },
      ],
    },
  }),
  maintenance: await prisma.meter.count({
    where: { status: "MAINTENANCE" },
  }),
  faulty: await prisma.meter.count({
    where: { status: "FAULTY" },
  }),
};
```

---

## 🔧 Configuración en Vercel

### **1. Configurar Cron Job**

1. **Crear archivo `vercel.json`** en la raíz del proyecto
2. **Hacer commit y push** a tu repositorio
3. **Vercel detectará automáticamente** el cron job

### **2. Configurar Variables de Entorno**

En Vercel Dashboard:

1. Ir a **Project Settings** → **Environment Variables**
2. Agregar:
   ```
   CRON_SECRET = "tu-clave-super-secreta-aqui"
   ```
3. Aplicar a **Production**, **Preview** y **Development**

### **3. Monitorear Ejecución**

**Logs en Vercel**:

- Ir a **Functions** → **Cron Jobs**
- Ver logs de ejecución
- Monitorear errores

**Endpoint de verificación**:

```bash
curl -X GET https://tu-dominio.vercel.app/api/cron/update-meter-status
```

---

## 📈 Beneficios

### **1. Consistencia de Datos**

- ✅ Estado en BD coincide con estado real
- ✅ Todas las APIs muestran datos consistentes
- ✅ Dashboard refleja la realidad del sistema

### **2. Automatización**

- ✅ Sin intervención manual requerida
- ✅ Actualización cada 6 horas
- ✅ Detección automática de cambios

### **3. Monitoreo**

- ✅ Logs detallados de cada ejecución
- ✅ Estadísticas de cambios realizados
- ✅ Endpoint de verificación

### **4. Seguridad**

- ✅ Autenticación con `CRON_SECRET`
- ✅ Validación de autorización
- ✅ Manejo de errores robusto

---

## 🚀 Despliegue

### **1. Preparación**

```bash
# 1. Agregar archivos al repositorio
git add vercel.json app/api/cron/update-meter-status/route.ts
git add app/api/dashboard/stats/route.ts package.json

# 2. Commit
git commit -m "feat: implementar actualización automática de estados de medidores"

# 3. Push
git push origin main
```

### **2. Configuración en Vercel**

1. **Variables de entorno**: Agregar `CRON_SECRET`
2. **Deploy**: Vercel detectará automáticamente el cron job
3. **Verificación**: Probar endpoint de verificación

### **3. Testing**

```bash
# Verificar estado actual
npm run cron:check-status

# Ejecutar actualización manual (desarrollo)
npm run cron:update-meters
```

---

## 📊 Ejemplo de Respuesta

### **POST `/api/cron/update-meter-status`**

```json
{
  "success": true,
  "timestamp": "2025-01-02T12:00:00.000Z",
  "summary": {
    "totalMeters": 10,
    "activeMeters": 7,
    "inactiveMeters": 3,
    "deactivatedCount": 2,
    "activatedCount": 1,
    "netChange": -1
  },
  "details": {
    "metersToDeactivate": [
      {
        "id": "uuid-1",
        "dev_eui": "ABC123",
        "device_name": "Medidor A"
      }
    ],
    "metersToActivate": [
      {
        "id": "uuid-2",
        "dev_eui": "DEF456",
        "device_name": "Medidor B"
      }
    ]
  }
}
```

### **GET `/api/cron/update-meter-status`**

```json
{
  "success": true,
  "timestamp": "2025-01-02T12:00:00.000Z",
  "stats": {
    "totalMeters": 10,
    "activeMeters": 7,
    "inactiveMeters": 3,
    "maintenanceMeters": 0,
    "faultyMeters": 0,
    "inconsistencies": {
      "shouldBeInactive": 0,
      "shouldBeActive": 0,
      "totalInconsistencies": 0
    }
  }
}
```

---

## 🔍 Troubleshooting

### **Problema: Cron job no se ejecuta**

**Solución**:

1. Verificar que `vercel.json` esté en la raíz
2. Confirmar que el schedule sea válido
3. Revisar logs en Vercel Dashboard

### **Problema: Error 401 Unauthorized**

**Solución**:

1. Verificar que `CRON_SECRET` esté configurado
2. Confirmar que el valor coincida en BD y código

### **Problema: Estadísticas siguen incorrectas**

**Solución**:

1. Ejecutar manualmente el cron job
2. Verificar que la BD se esté actualizando
3. Revisar logs de la API

---

## 📝 Mantenimiento

### **Frecuencia de Revisión**

- **Diaria**: Verificar logs de ejecución
- **Semanal**: Revisar estadísticas de inconsistencias
- **Mensual**: Evaluar frecuencia de cron job

### **Métricas a Monitorear**

- Tiempo de ejecución del cron job
- Número de medidores actualizados por ejecución
- Errores en la ejecución
- Consistencia entre APIs

---

## ✅ Checklist de Implementación

- [x] API de actualización automática creada
- [x] Cálculo de estadísticas corregido
- [x] Configuración de Vercel Cron
- [x] Scripts de testing local
- [x] Documentación completa
- [x] Manejo de errores implementado
- [x] Logging detallado agregado
- [x] Seguridad con CRON_SECRET
- [x] Endpoint de verificación
- [x] Ejemplos de respuesta documentados

---

## 🎯 Próximos Pasos

1. **Desplegar** a producción
2. **Configurar** variables de entorno en Vercel
3. **Monitorear** primeras ejecuciones
4. **Verificar** consistencia de datos
5. **Ajustar** frecuencia si es necesario

---

**Versión**: 1.0  
**Fecha**: 2025-01-02  
**Autor**: Sistema EcoWater
