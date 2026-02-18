# Planteamiento: Integración de Firebase Analytics

## 📋 Objetivo

Configurar Firebase Analytics en la plataforma EcoWater para obtener métricas y analíticas sobre el uso de la aplicación, permitiendo:
- Rastrear eventos de usuario (navegación, acciones, interacciones)
- Analizar patrones de uso de funcionalidades
- Medir rendimiento de características clave
- Obtener insights sobre comportamiento de usuarios

---

## 🏗️ Arquitectura Propuesta

### Componentes Principales

1. **Firebase SDK Client-Side**
   - Inicialización en el cliente (Next.js)
   - Configuración de eventos personalizados
   - Tracking automático de páginas/views

2. **Firebase Admin SDK Server-Side** (Opcional)
   - Para eventos críticos del servidor
   - Logging de acciones administrativas
   - Eventos de API importantes

3. **Hook Personalizado de React**
   - `useAnalytics()` para facilitar el tracking
   - Wrapper alrededor de Firebase Analytics
   - Manejo de errores y fallbacks

4. **Middleware/Provider**
   - Inicialización global de Firebase
   - Configuración de usuario (user properties)
   - Manejo de consentimiento (si aplica)

---

## 📊 Eventos a Rastrear

### Eventos de Navegación
- `page_view` - Vista de página (automático)
- `screen_view` - Cambio de pantalla/sección
- `navigation_click` - Clics en navegación principal

### Eventos de Usuarios
- `user_login` - Inicio de sesión exitoso
- `user_logout` - Cierre de sesión
- `user_register` - Registro de nuevo usuario
- `user_activate` - Activación de usuario
- `user_deactivate` - Desactivación de usuario
- `user_delete` - Eliminación de usuario
- `user_edit` - Edición de perfil de usuario

### Eventos de Medidores
- `meter_view` - Visualización de detalle de medidor
- `meter_list_view` - Vista de lista de medidores
- `meter_filter` - Aplicación de filtros en medidores
- `meter_status_change` - Cambio de estado de medidor
- `meter_assign` - Asignación de medidor a usuario
- `meter_unassign` - Desasignación de medidor

### Eventos de Dashboard
- `dashboard_view` - Vista del dashboard principal
- `dashboard_stats_refresh` - Actualización manual de estadísticas
- `consumption_chart_view` - Visualización de gráfico de consumo
- `alert_view` - Visualización de alertas

### Eventos de Lecturas/Datos
- `reading_table_view` - Vista de tabla de lecturas
- `reading_filter` - Filtrado de lecturas (por fecha, estado, etc.)
- `reading_export` - Exportación de datos (si existe)

### Eventos de Búsqueda
- `search_performed` - Búsqueda realizada
- `search_result_click` - Clic en resultado de búsqueda

### Eventos de Errores
- `error_occurred` - Error capturado en la aplicación
- `api_error` - Error en llamada a API

---

## 🔧 Configuración Técnica

### 1. Instalación de Dependencias

```bash
npm install firebase
# O si se necesita Admin SDK para eventos server-side:
npm install firebase-admin
```

### 2. Estructura de Archivos Propuesta

```
lib/
  firebase/
    config.ts          # Configuración de Firebase
    analytics.ts       # Funciones helper para Analytics
    admin.ts           # Admin SDK (opcional, server-side)
    
hooks/
  use-analytics.ts     # Hook personalizado para tracking
  
providers/
  analytics-provider.tsx  # Provider para inicializar Firebase
```

### 3. Variables de Entorno

Agregar a `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 4. Configuración de Firebase

**Archivo:** `lib/firebase/config.ts`
- Inicialización de Firebase App
- Configuración de Analytics
- Manejo de entorno (dev/prod)

---

## 🚀 Plan de Implementación

### Fase 1: Configuración Base (Prioridad Alta)
1. ✅ Crear proyecto en Firebase Console
2. ✅ Instalar dependencias (`firebase`)
3. ✅ Crear archivo de configuración (`lib/firebase/config.ts`)
4. ✅ Configurar variables de entorno
5. ✅ Crear provider de Analytics (`providers/analytics-provider.tsx`)
6. ✅ Integrar provider en layout principal

### Fase 2: Hook y Utilidades (Prioridad Alta)
1. ✅ Crear hook `useAnalytics()`
2. ✅ Crear funciones helper en `lib/firebase/analytics.ts`
3. ✅ Implementar tracking de páginas automático
4. ✅ Configurar user properties (user_id, role, etc.)

### Fase 3: Eventos Críticos (Prioridad Media)
1. ✅ Tracking de autenticación (login, logout, register)
2. ✅ Tracking de navegación principal
3. ✅ Tracking de dashboard (vistas, refreshes)
4. ✅ Tracking de errores críticos

### Fase 4: Eventos de Funcionalidades (Prioridad Media)
1. ✅ Tracking de acciones de usuarios (CRUD)
2. ✅ Tracking de acciones de medidores
3. ✅ Tracking de filtros y búsquedas
4. ✅ Tracking de visualizaciones de datos

### Fase 5: Optimización y Testing (Prioridad Baja)
1. ✅ Testing de eventos en desarrollo
2. ✅ Validación de datos en Firebase Console
3. ✅ Optimización de performance
4. ✅ Documentación de uso

---

## 📝 Detalles de Implementación

### Hook useAnalytics()

```typescript
// hooks/use-analytics.ts
export function useAnalytics() {
  const logEvent = (eventName: string, params?: Record<string, any>) => {
    // Implementación
  };
  
  const setUserProperties = (properties: Record<string, any>) => {
    // Implementación
  };
  
  return { logEvent, setUserProperties };
}
```

### Ejemplo de Uso

```typescript
// En un componente
const { logEvent } = useAnalytics();

const handleUserDelete = () => {
  logEvent('user_delete', {
    user_id: user.id,
    user_role: user.role,
    timestamp: new Date().toISOString()
  });
  // ... resto de la lógica
};
```

### User Properties a Configurar

- `user_id` - ID del usuario
- `user_role` - Rol del usuario (admin, user, etc.)
- `user_status` - Estado del usuario (active, inactive, etc.)

---

## 🔒 Consideraciones de Seguridad y Privacidad

1. **Datos Sensibles**
   - ❌ NO enviar contraseñas, tokens, o información personal sensible
   - ✅ Usar IDs anónimos cuando sea posible
   - ✅ Hashear información sensible si es necesario

2. **Consentimiento**
   - Considerar implementar banner de consentimiento (GDPR/CCPA)
   - Permitir opt-out de analytics

3. **Entornos**
   - Separar proyectos Firebase para dev/prod
   - Deshabilitar analytics en desarrollo local (opcional)

4. **Rate Limiting**
   - Firebase Analytics tiene límites automáticos
   - No requiere throttling manual

---

## 📈 Métricas Esperadas

Una vez implementado, podremos analizar:

1. **Uso General**
   - Usuarios activos diarios/semanales/mensuales
   - Sesiones por usuario
   - Tiempo promedio en la aplicación

2. **Funcionalidades Más Usadas**
   - Secciones más visitadas
   - Acciones más frecuentes
   - Flujos de usuario comunes

3. **Rendimiento**
   - Tiempo de carga de páginas
   - Errores más comunes
   - APIs más utilizadas

4. **Comportamiento de Usuarios**
   - Patrones de navegación
   - Frecuencia de uso
   - Horarios pico de actividad

---

## 🎯 Próximos Pasos

1. **Revisar y aprobar este planteamiento**
2. **Crear proyecto en Firebase Console**
3. **Obtener credenciales de Firebase**
4. **Comenzar con Fase 1: Configuración Base**

---

## 📚 Recursos

- [Firebase Analytics Documentation](https://firebase.google.com/docs/analytics)
- [Next.js + Firebase Integration](https://firebase.google.com/docs/web/setup)
- [Firebase Analytics Events](https://firebase.google.com/docs/reference/js/v8/firebase.analytics)

---

## ❓ Preguntas Pendientes

1. ¿Tienen ya un proyecto Firebase creado o necesitamos crear uno nuevo?
2. ¿Hay requisitos específicos de privacidad/consentimiento que debamos cumplir?
3. ¿Quieren separar analytics de desarrollo y producción?
4. ¿Hay algún evento específico adicional que quieran rastrear?

