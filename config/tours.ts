import { Tour } from "nextstepjs";

export const tours: Tour[] = [
  {
    tour: "home-dashboard",
    steps: [
      {
        icon: "👋",
        title: "¡Bienvenidos a EcoWater!",
        content:
          "Te guiamos por las principales secciones del panel de control. Podés saltar el tour en cualquier momento.",
        side: "bottom",
        showSkip: true,
      },
      {
        icon: "📊",
        title: "Resumen del Sistema",
        content:
          "Las cinco tarjetas muestran: consumo total del período (inteligentes y mecánicos), medidores en línea, distribución por tipo (inteligentes vs. mecánicos), alertas activas y errores. Las tarjetas de Alertas y Errores abren directamente la pestaña Alarmas de abajo.",
        selector: "#tour-summary-cards",
        side: "bottom",
        showSkip: true,
      },
      {
        icon: "📅",
        title: "Selector de Período",
        content:
          "Filtrá los datos por período predefinido (1 semana hasta 1 año) o elegí un rango personalizado desde el calendario. Todos los gráficos se actualizan automáticamente.",
        selector: "#tour-date-range-selector",
        side: "bottom",
        showSkip: true,
      },
      {
        icon: "📈",
        title: "Gráfico de Consumo",
        content:
          "Análisis de consumo de agua agrupado por día o mes según el período seleccionado. Las barras representan el consumo total registrado por todos los medidores activos.",
        selector: "#tour-consumption-chart",
        side: "top",
        showSkip: true,
      },
      {
        icon: "🚨",
        title: "Pestaña Alarmas",
        content:
          "Al activar esta pestaña verás la tendencia de alarmas en el tiempo (flujo inverso, tubería vacía, batería baja, temperatura, fuera de rango) y el panel de urgencias activas clasificadas por criticidad. Útil para anticipar mantenimientos.",
        selector: "#tour-tab-alarmas",
        side: "bottom",
        showSkip: true,
      },
      {
        icon: "🍩",
        title: "Pestaña Medidores",
        content:
          "Al activar esta pestaña verás la distribución del consumo por medidor: qué porcentaje del total corresponde a cada dispositivo en el período seleccionado. Los 5 con mayor consumo se muestran individualmente.",
        selector: "#tour-tab-medidores",
        side: "bottom",
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
          "Desde acá podés visualizar, filtrar y gestionar todos los medidores del sistema: tanto los inteligentes (LoRa) como los mecánicos (lectura manual).",
        side: "bottom",
        showSkip: true,
      },
      {
        icon: "🔍",
        title: "Búsqueda",
        content:
          "Buscá medidores por código de dispositivo o nombre del cliente. Usá el botón Limpiar para restablecer todos los filtros aplicados.",
        selector: "#tour-meters-search",
        side: "bottom",
        showSkip: true,
      },
      {
        icon: "🔀",
        title: "Filtro por Tipo",
        content:
          "Filtrá entre medidores Inteligentes (comunicación LoRa automática) y Mecánicos (requieren lectura manual del operario). El botón «Nuevo medidor mecánico» te permite registrar uno nuevo de tipo manual.",
        selector: "#tour-meters-type-filter",
        side: "bottom",
        showSkip: true,
      },
      {
        icon: "🏷️",
        title: "Filtro por Estado",
        content:
          "Filtrá por estado operacional: Total, Activos, Inactivos, Mantenimiento o Error/Fallas. Los contadores de cada pestaña muestran cuántos medidores hay en esa categoría.",
        selector: "#tour-meters-filter-tabs",
        side: "bottom",
        showSkip: true,
      },
      {
        icon: "📋",
        title: "Tabla de Medidores",
        content:
          "Cada fila muestra el tipo (chip inteligente/mecánico), cliente asignado, dirección, estado, última lectura, Actividad (hace cuánto llegó la última lectura) y conectividad (los mecánicos muestran «—» porque no usan LoRa). Hacé clic en una fila para ver el detalle completo.",
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
          "Esta vista muestra toda la información de un medidor individual. El contenido varía según el tipo: los medidores inteligentes tienen métricas LoRa y control de válvula; los mecánicos tienen un control de estado manual.",
        side: "bottom",
        showSkip: true,
      },
      {
        icon: "📌",
        title: "Información del Medidor",
        content:
          "Identificador, DEV EUI (o código manual), cliente asignado y estado operacional. En medidores mecánicos aparece un botón Activar/Desactivar para cambiar el estado entre Activo e Inactivo manualmente.",
        selector: "#tour-meter-header",
        side: "bottom",
        showSkip: true,
      },
      {
        icon: "💧",
        title: "Métricas Principales",
        content:
          "Los medidores inteligentes muestran flujo acumulado, instantáneo, reverso y temperatura. Los mecánicos muestran únicamente la última lectura registrada y el consumo calculado para el período.",
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
          "Disponible solo en medidores inteligentes: muestra la conectividad LoRa, el estado de la válvula (abierta/cerrada), el nivel de batería y el estado operacional del dispositivo.",
        selector: "#tour-meter-status",
        side: "left",
        showSkip: true,
      },
      {
        icon: "🚨",
        title: "Urgencias Detectadas",
        content:
          "Alarmas activas del medidor: flujo reverso, tubería vacía, temperatura fuera de rango, batería baja y otros eventos críticos registrados por el dispositivo.",
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
          "Desde acá podés administrar todos los clientes del sistema, asignarles medidores y gestionar sus estados de cuenta.",
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
          "Registrá un nuevo cliente completando sus datos personales, dirección y estado de cuenta inicial.",
        selector: "#tour-users-create",
        side: "bottom",
        showSkip: true,
      },
      {
        icon: "🏷️",
        title: "Filtro por Estado",
        content:
          "Filtrá por estado de cuenta: Activos, Inactivos, Pendientes o Bloqueados. Los contadores de cada pestaña muestran cuántos usuarios hay en esa categoría.",
        selector: "#tour-users-filter-tabs",
        side: "bottom",
        showSkip: true,
      },
      {
        icon: "📋",
        title: "Tabla de Usuarios",
        content:
          "Cada fila muestra el nombre, email, estado de cuenta y medidor asignado. Hacé clic en un usuario para ver su detalle completo.",
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
          "Esta vista muestra toda la información del cliente seleccionado: datos personales, dirección, medidor asociado y roles.",
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
          "Rol asignado al usuario (administrador, operario o lector) y estado actual de su cuenta (Activo, Inactivo, Pendiente o Bloqueado).",
        selector: "#tour-user-roles",
        side: "top",
        showSkip: true,
      },
      {
        icon: "📡",
        title: "Medidor Asociado",
        content:
          "Medidor asignado al usuario con su tipo y estado. Podés cambiarlo o asignar uno nuevo desde acá.",
        selector: "#tour-user-meter",
        side: "top",
        showSkip: true,
      },
    ],
  },
  {
    tour: "portal-home",
    steps: [
      {
        icon: "👷",
        title: "¡Bienvenido al Portal!",
        content:
          "Este es tu espacio de trabajo. Desde acá accedés a tus zonas asignadas y registrás las lecturas manuales del día.",
        side: "bottom",
        showSkip: true,
      },
      {
        icon: "📊",
        title: "Resumen del día",
        content:
          "Las tarjetas muestran cuántas zonas activas tenés asignadas y el total de medidores que debés leer en la jornada.",
        selector: "#tour-portal-stats",
        side: "bottom",
        showSkip: true,
      },
      {
        icon: "🗺️",
        title: "Tus zonas",
        content:
          "Cada tarjeta es una zona de trabajo. Tocá una para ver la lista de medidores a leer y comenzar la ruta de lectura.",
        selector: "#tour-portal-zones",
        side: "top",
        showSkip: true,
      },
    ],
  },
  {
    tour: "operarios-list",
    steps: [
      {
        icon: "👷",
        title: "¡Bienvenido a Operarios!",
        content:
          "Desde acá gestionás a los operarios de campo: quiénes son, qué zonas tienen asignadas y cuántas lecturas realizaron.",
        side: "bottom",
        showSkip: true,
      },
      {
        icon: "📊",
        title: "Resumen del equipo",
        content:
          "Las tarjetas muestran el total de operarios registrados, cuántos están activos y la cantidad de zonas cubiertas en total.",
        selector: "#tour-operarios-stats",
        side: "bottom",
        showSkip: true,
      },
      {
        icon: "🔍",
        title: "Búsqueda",
        content:
          "Buscá operarios por nombre o email para encontrarlos rápidamente.",
        selector: "#tour-operarios-search",
        side: "bottom",
        showSkip: true,
      },
      {
        icon: "➕",
        title: "Nuevo operario",
        content:
          "Registrá un nuevo operario de campo asignándole nombre, email y contraseña de acceso al portal.",
        selector: "#tour-operarios-create",
        side: "bottom",
        showSkip: true,
      },
      {
        icon: "📋",
        title: "Lista de operarios",
        content:
          "Cada fila muestra el nombre, email, estado y cantidad de zonas asignadas. Hacé clic en una fila para ver el detalle completo del operario.",
        selector: "#tour-operarios-table",
        side: "top",
        showSkip: true,
      },
    ],
  },
  {
    tour: "operario-detail",
    steps: [
      {
        icon: "👷",
        title: "Detalle del operario",
        content:
          "Esta vista muestra el perfil completo del operario: actividad reciente, zonas asignadas e historial de lecturas registradas.",
        side: "bottom",
        showSkip: true,
      },
      {
        icon: "📈",
        title: "Estadísticas",
        content:
          "Total de lecturas realizadas, lecturas de la semana actual y cantidad de zonas de trabajo asignadas.",
        selector: "#tour-operario-stats",
        side: "bottom",
        showSkip: true,
      },
      {
        icon: "🗺️",
        title: "Zonas asignadas",
        content:
          "Las zonas donde este operario realiza las rondas de lectura. Podés agregar o quitar zonas desde acá.",
        selector: "#tour-operario-zones",
        side: "top",
        showSkip: true,
      },
      {
        icon: "📋",
        title: "Historial de lecturas",
        content:
          "Las últimas 30 lecturas registradas por el operario: medidor, valor ingresado, consumo calculado y observaciones.",
        selector: "#tour-operario-readings",
        side: "top",
        showSkip: true,
      },
    ],
  },
  {
    tour: "zone-detail",
    steps: [
      {
        icon: "🗺️",
        title: "Detalle de zona",
        content:
          "Esta vista muestra los medidores dentro del área geográfica de la zona, las descargas disponibles y los operarios asignados.",
        side: "bottom",
        showSkip: true,
      },
      {
        icon: "📡",
        title: "Medidores de la zona",
        content:
          "Lista de medidores mecánicos e inteligentes dentro del polígono de esta zona. Muestra el tipo, dispositivo, usuario, consumo acumulado del período y estado operacional.",
        selector: "#tour-zone-meters",
        side: "bottom",
        showSkip: true,
      },
      {
        icon: "👷",
        title: "Operarios asignados",
        content:
          "Los operarios de campo responsables de realizar las lecturas en esta zona. Podés agregar o quitar operarios desde este panel.",
        selector: "#tour-zone-operators",
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
          "Modificá nombre, apellido, email y estado de la cuenta. Solo los administradores pueden cambiar el estado del usuario.",
        selector: "#tour-edit-personal",
        side: "bottom",
        showSkip: true,
      },
      {
        icon: "📍",
        title: "Ubicación",
        content:
          "Actualizá la dirección del usuario usando el autocompletado. El mapa se actualiza automáticamente al seleccionar una nueva dirección.",
        selector: "#tour-edit-location",
        side: "top",
        showSkip: true,
      },
    ],
  },
];
