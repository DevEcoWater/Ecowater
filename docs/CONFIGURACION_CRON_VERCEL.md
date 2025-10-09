# 🚀 Configuración del Cron Job en Vercel

## 📋 Checklist de Configuración

### ✅ 1. Archivos Listos

- [x] `vercel.json` configurado con cron job
- [x] API endpoint `/api/cron/update-meter-status` implementado
- [x] Script de testing creado

### 🔧 2. Configuración en Vercel Dashboard

#### **Variables de Entorno:**

1. Ve a tu proyecto en Vercel Dashboard
2. **Settings** → **Environment Variables**
3. Agrega:
   ```
   Name: CRON_SECRET
   Value: [genera-un-secreto-seguro]
   Environment: Production, Preview
   ```

#### **Generar Secreto Seguro:**

```bash
# Opción 1: Usando Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Opción 2: Usando OpenSSL
openssl rand -hex 32

# Opción 3: Online
# https://www.uuidgenerator.net/
```

### 🚀 3. Deploy y Activación

#### **Deploy:**

```bash
git add .
git commit -m "feat: implement cron job for meter status updates"
git push origin main
```

#### **Verificar en Vercel:**

1. Ve a **Functions** en tu proyecto
2. Deberías ver `/api/cron/update-meter-status`
3. Ve a **Cron Jobs** - debería aparecer el job programado

### 🧪 4. Testing

#### **Test Local:**

```bash
# Instalar dependencias si es necesario
npm install

# Ejecutar test
node scripts/test-cron.js

# Test con URL específica
node scripts/test-cron.js https://tu-app.vercel.app
```

#### **Test en Producción:**

```bash
# Test GET (verificar estado)
curl -X GET https://tu-app.vercel.app/api/cron/update-meter-status

# Test POST (ejecutar actualización)
curl -X POST https://tu-app.vercel.app/api/cron/update-meter-status \
  -H "Authorization: Bearer tu-cron-secret"
```

### 📊 5. Monitoreo

#### **Logs en Vercel:**

1. Ve a **Functions** → `/api/cron/update-meter-status`
2. Ve a **Logs** para ver ejecuciones
3. Busca logs con `[CRON]` para ver actualizaciones

#### **Verificar Funcionamiento:**

```bash
# Verificar que el cron se ejecuta
# Los logs deberían mostrar:
# [CRON] Iniciando actualización de status de medidores
# [CRON] Desactivados X medidores: [lista]
# [CRON] Reactivados X medidores: [lista]
# [CRON] Actualización completada: {summary}
```

### 🔍 6. Troubleshooting

#### **Problemas Comunes:**

**❌ Cron no se ejecuta:**

- Verificar que `vercel.json` esté en la raíz del proyecto
- Verificar que el path del cron sea correcto
- Verificar que la función esté deployada

**❌ Error 401 Unauthorized:**

- Verificar que `CRON_SECRET` esté configurado
- Verificar que el valor sea correcto
- Verificar que esté en el ambiente correcto

**❌ Error de base de datos:**

- Verificar conexión a Supabase
- Verificar permisos de la base de datos
- Verificar que las tablas existan

#### **Debugging:**

```bash
# Ver logs detallados
vercel logs --follow

# Ver estado de funciones
vercel functions list

# Ver cron jobs
vercel cron list
```

### 📈 7. Métricas de Éxito

#### **Indicadores de Funcionamiento:**

- ✅ Cron se ejecuta cada hora
- ✅ Logs muestran actualizaciones
- ✅ Estados de medidores se actualizan
- ✅ Dashboard muestra datos consistentes
- ✅ No hay errores en logs

#### **Verificación Automática:**

```bash
# Script para verificar estado
curl -s https://tu-app.vercel.app/api/cron/update-meter-status | jq '.stats.inconsistencies.totalInconsistencies'

# Debería ser 0 o muy bajo si el cron funciona bien
```

---

## 🎯 Resumen de Configuración

1. **✅ Código**: Ya implementado
2. **🔧 Vercel**: Configurar `CRON_SECRET`
3. **🚀 Deploy**: Push a main branch
4. **🧪 Test**: Usar script de testing
5. **📊 Monitoreo**: Verificar logs cada hora

**Tiempo estimado**: 10-15 minutos
**Dificultad**: Fácil
**Resultado**: Cron job funcionando automáticamente cada hora
