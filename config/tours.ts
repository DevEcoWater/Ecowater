import { Tour } from "nextstepjs";

export const tours: Tour[] = [
  {
    tour: "home-dashboard",
    steps: [
      {
        icon: "👋",
        title: "¡Bienvenido al Dashboard!",
        content:
          "Te guiamos por las principales secciones del panel de control. Podés saltar el tour en cualquier momento.",
        side: "bottom",
        showSkip: true,
      },
      {
        icon: "📊",
        title: "Resumen del Sistema",
        content:
          "Las tarjetas muestran el consumo total del período, medidores activos en línea, alertas detectadas y errores del sistema.",
        selector: "#tour-summary-cards",
        side: "bottom",
        showSkip: true,
      },
      {
        icon: "📅",
        title: "Selector de Período",
        content:
          "Filtrá los datos por período predefinido (1 semana hasta 1 año) o elegí un rango personalizado desde el calendario.",
        selector: "#tour-date-range-selector",
        side: "bottom",
        showSkip: true,
      },
      {
        icon: "📈",
        title: "Gráfico de Consumo",
        content:
          "Análisis de consumo de agua agrupado por día o mes según el período seleccionado. Cada barra representa el consumo registrado por todos los medidores activos.",
        selector: "#tour-consumption-chart",
        side: "top",
        showSkip: true,
      },
      {
        icon: "🚨",
        title: "Urgencias Detectadas",
        content:
          "Alertas en tiempo real: alarmas de los medidores (flujo reverso, tubería vacía, batería baja) y medidores sin actividad reciente.",
        selector: "#tour-urgencies-section",
        side: "left",
        showSkip: true,
      },
      {
        icon: "🍩",
        title: "Distribución por Medidor",
        content:
          "El gráfico muestra qué porcentaje del consumo total corresponde a cada medidor en el período seleccionado. Los 5 más activos se muestran individualmente.",
        selector: "#tour-meter-distribution-chart",
        side: "top",
        showSkip: true,
      },
    ],
  },
  {
    tour: "meters-list",
    steps: [
      {
        icon: "📡",
        title: "¡Bienvenido a Gestión de Medidores!",
        content:
          "Desde acá podés visualizar, filtrar y gestionar todos los medidores del sistema.",
        side: "bottom",
        showSkip: true,
      },
      {
        icon: "🔍",
        title: "Búsqueda y Filtros",
        content:
          "Buscá medidores por código o nombre del cliente. Usá el botón Limpiar para restablecer los filtros aplicados.",
        selector: "#tour-meters-search",
        side: "bottom",
        showSkip: true,
      },
      {
        icon: "🏷️",
        title: "Filtro por Estado",
        content:
          "Filtrá los medidores por su estado: Todos, Activos, Inactivos, En mantenimiento o Defectuosos. Los contadores muestran cuántos hay en cada categoría.",
        selector: "#tour-meters-filter-tabs",
        side: "bottom",
        showSkip: true,
      },
      {
        icon: "📋",
        title: "Tabla de Medidores",
        content:
          "Cada fila muestra el código del medidor, el cliente asignado, la conectividad y el estado operacional. Hacé clic en una fila para ver el detalle completo.",
        selector: "#tour-meters-table",
        side: "top",
        showSkip: true,
      },
    ],
  },
  {
    tour: "meter-detail",
    steps: [
      {
        icon: "🔬",
        title: "Detalle del Medidor",
        content:
          "Esta vista muestra toda la información en tiempo real de un medidor individual.",
        side: "bottom",
        showSkip: true,
      },
      {
        icon: "📌",
        title: "Información del Medidor",
        content:
          "Identificador, DEV EUI, cliente asignado y estado de conectividad actual del dispositivo.",
        selector: "#tour-meter-header",
        side: "bottom",
        showSkip: true,
      },
      {
        icon: "💧",
        title: "Métricas Principales",
        content:
          "Flujo acumulado, instantáneo, reverso y temperatura del agua según la última lectura recibida.",
        selector: "#tour-meter-metrics",
        side: "bottom",
        showSkip: true,
      },
      {
        icon: "📈",
        title: "Historial de Consumo",
        content:
          "Gráfico de consumo por período o rango personalizado. Cambiá a la vista Tabla para explorar lecturas individuales y exportarlas a CSV.",
        selector: "#tour-meter-chart",
        side: "top",
        showSkip: true,
      },
      {
        icon: "🔌",
        title: "Estado del Dispositivo",
        content:
          "Conectividad, estado de la válvula, nivel de batería y estado operacional del medidor.",
        selector: "#tour-meter-status",
        side: "left",
        showSkip: true,
      },
      {
        icon: "🚨",
        title: "Urgencias Detectadas",
        content:
          "Alarmas activas del medidor: flujo reverso, tubería vacía, temperatura, batería baja y otros eventos críticos.",
        selector: "#tour-meter-alerts",
        side: "left",
        showSkip: true,
      },
    ],
  },
  {
    tour: "users-list",
    steps: [
      {
        icon: "👥",
        title: "¡Bienvenido a Gestión de Usuarios!",
        content:
          "Desde acá podés administrar todos los clientes del sistema, asignar medidores y gestionar sus estados.",
        side: "bottom",
        showSkip: true,
      },
      {
        icon: "🔍",
        title: "Búsqueda",
        content:
          "Buscá usuarios por nombre o apellido. Usá el botón Limpiar para restablecer los filtros.",
        selector: "#tour-users-search",
        side: "bottom",
        showSkip: true,
      },
      {
        icon: "➕",
        title: "Crear Usuario",
        content:
          "Registrá un nuevo cliente completando sus datos personales, dirección y estado de cuenta.",
        selector: "#tour-users-create",
        side: "bottom",
        showSkip: true,
      },
      {
        icon: "🏷️",
        title: "Filtro por Estado",
        content:
          "Filtrá por estado de cuenta: Activos, Inactivos, Pendientes o Bloqueados. Los contadores muestran cuántos hay en cada categoría.",
        selector: "#tour-users-filter-tabs",
        side: "bottom",
        showSkip: true,
      },
      {
        icon: "📋",
        title: "Tabla de Usuarios",
        content:
          "Cada fila muestra el nombre, email, estado y medidor asignado. Hacé clic en un usuario para ver su detalle completo.",
        selector: "#tour-users-table",
        side: "top",
        showSkip: true,
      },
    ],
  },
  {
    tour: "user-detail",
    steps: [
      {
        icon: "👤",
        title: "Detalle del Usuario",
        content:
          "Esta vista muestra toda la información del cliente seleccionado.",
        side: "bottom",
        showSkip: true,
      },
      {
        icon: "📝",
        title: "Información Personal",
        content:
          "Nombre, email, dirección y fecha de registro del usuario. También se muestra su ubicación en el mapa.",
        selector: "#tour-user-info",
        side: "bottom",
        showSkip: true,
      },
      {
        icon: "🛡️",
        title: "Roles y Estado",
        content:
          "Rol asignado al usuario y estado actual de su cuenta (Activo, Inactivo, Pendiente o Bloqueado).",
        selector: "#tour-user-roles",
        side: "top",
        showSkip: true,
      },
      {
        icon: "📡",
        title: "Medidor Asociado",
        content:
          "Medidor asignado al usuario con su estado. Podés cambiarlo o asignar uno nuevo desde acá.",
        selector: "#tour-user-meter",
        side: "top",
        showSkip: true,
      },
    ],
  },
  {
    tour: "user-edit",
    steps: [
      {
        icon: "✏️",
        title: "Editar Usuario",
        content:
          "Actualizá los datos del cliente: información personal, estado de cuenta y ubicación.",
        side: "bottom",
        showSkip: true,
      },
      {
        icon: "👤",
        title: "Información Personal",
        content:
          "Modificá nombre, apellido, email y estado de la cuenta. Solo los administradores pueden cambiar el estado.",
        selector: "#tour-edit-personal",
        side: "bottom",
        showSkip: true,
      },
      {
        icon: "📍",
        title: "Ubicación",
        content:
          "Actualizá la dirección del usuario buscando con el autocompletado. El mapa se actualiza automáticamente al seleccionar una dirección.",
        selector: "#tour-edit-location",
        side: "top",
        showSkip: true,
      },
    ],
  },
];
