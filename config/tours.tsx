import type { Tour } from "nextstepjs";
import {
  Activity,
  BarChart3,
  Bell,
  CalendarRange,
  ClipboardCheck,
  ClipboardList,
  Cpu,
  Download,
  Droplets,
  FileText,
  Filter,
  Gauge,
  HardHat,
  Info,
  KeyRound,
  Layers,
  LayoutDashboard,
  ListChecks,
  Map,
  MapPin,
  MousePointerClick,
  Palette,
  PenLine,
  Plus,
  Route,
  Save,
  ScanLine,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Table2,
  User,
  UserPlus,
  Users,
  Wifi,
} from "lucide-react";
import { clientConfig } from "@/config/client.config";

// Pasos con `selector` que no está en pantalla (por rol, tipo de medidor o
// tamaño de pantalla) se omiten automáticamente al iniciar la guía.
const base = { showSkip: true } as const;

export const tours: Tour[] = [
  // ───────────────────────────── Dashboard ─────────────────────────────
  {
    tour: "home-dashboard",
    steps: [
      {
        ...base,
        icon: <LayoutDashboard />,
        title: `Bienvenido a ${clientConfig.brand.name}`,
        content:
          "Este es el panel principal: un resumen del estado de la red de medidores, el consumo y las alarmas. Te mostramos cada parte; podés cerrar la guía cuando quieras.",
        side: "bottom",
      },
      {
        ...base,
        icon: <Wifi />,
        title: "Estado de la red",
        content:
          "Señal promedio de los medidores inteligentes (en dBm, con su calidad) y temperatura promedio del agua. A la derecha ves cuándo se sincronizaron los datos por última vez; «Re-sincronizar» los actualiza al instante.",
        selector: "#tour-status-bar",
        side: "bottom",
      },
      {
        ...base,
        icon: <BarChart3 />,
        title: "Resumen",
        content:
          "Consumo del período (con la comparación contra el período anterior y el desglose inteligentes/mecánicos), medidores en línea, cantidad por tipo, alertas activas y errores. Las tarjetas de Alertas y Errores te llevan directo a la pestaña Alarmas.",
        selector: "#tour-summary-cards",
        side: "bottom",
      },
      {
        ...base,
        icon: <CalendarRange />,
        title: "Período",
        content:
          "Elegí un período (1 semana a 1 año) o un rango de fechas propio. Afecta al resumen de consumo y a las cuatro pestañas de abajo.",
        selector: "#tour-date-range-selector",
        side: "bottom-right",
      },
      {
        ...base,
        icon: <Droplets />,
        title: "Consumo",
        content:
          "Consumo de agua por día o por mes según el período, separado entre medidores inteligentes y mecánicos.",
        selector: "#tour-consumption-chart",
        side: "top",
      },
      {
        ...base,
        icon: <Bell />,
        title: "Alarmas",
        content:
          "Tendencia de alarmas en el tiempo (flujo inverso, tubería vacía, batería baja, temperatura y fuera de rango) junto al panel de urgencias. Las urgencias rojas son errores (crítico o alto) y las amarillas, alertas (medio, bajo o medidor inactivo). Tocá una para abrir el medidor.",
        selector: "#tour-tab-alarmas",
        side: "bottom",
      },
      {
        ...base,
        icon: <Gauge />,
        title: "Medidores",
        content:
          "Ranking de los 5 medidores que más consumieron en el período y el porcentaje de cada uno sobre el total. El resto se agrupa en «Otros».",
        selector: "#tour-tab-medidores",
        side: "bottom",
      },
      {
        ...base,
        icon: <Layers />,
        title: "Zonas",
        content:
          "El mismo ranking pero por zona: cuánto consumió cada área y cuántos medidores tiene. El consumo de medidores que no están dentro de ninguna zona se informa aparte.",
        selector: "#tour-tab-zonas",
        side: "bottom",
      },
    ],
  },

  // ───────────────────────────── Medidores ─────────────────────────────
  {
    tour: "meters-list",
    steps: [
      {
        ...base,
        icon: <Gauge />,
        title: "Gestión de Medidores",
        content:
          "Todos los medidores del sistema: inteligentes (envían datos solos por LoRa) y mecánicos (los lee un operario en campo).",
        side: "bottom",
      },
      {
        ...base,
        icon: <Filter />,
        title: "Estados",
        content:
          "Cada tarjeta cuenta los medidores por estado: Activos, Inactivos, En mantenimiento o Fallidos. Hacé clic en una para filtrar la tabla; los números respetan la búsqueda y el tipo elegido.",
        selector: "#tour-meters-filter-tabs",
        side: "bottom",
      },
      {
        ...base,
        icon: <Search />,
        title: "Búsqueda",
        content:
          "Buscá por código del medidor o nombre del cliente. «Limpiar» quita la búsqueda y todos los filtros.",
        selector: "#tour-meters-search",
        side: "bottom-left",
      },
      {
        ...base,
        icon: <Cpu />,
        title: "Tipo de medidor",
        content:
          "Mostrá todos, solo inteligentes o solo mecánicos. El número al lado de cada opción es la cantidad total de ese tipo.",
        selector: "#tour-meters-type-filter",
        side: "bottom-right",
      },
      {
        ...base,
        icon: <Plus />,
        title: "Nuevo medidor mecánico",
        content:
          "Registrá un medidor de lectura manual con su nombre, dirección y ubicación en el mapa. Los inteligentes se dan de alta solos al comunicarse.",
        selector: "#tour-meters-create",
        side: "bottom-right",
      },
      {
        ...base,
        icon: <Table2 />,
        title: "Tabla de medidores",
        content:
          "Medidor, cliente, dirección, estado, última lectura, actividad (hace cuánto reportó) y conectividad; los mecánicos no usan LoRa y muestran «—». Hacé clic en una fila para ver el detalle. El menú «…» permite editar o activar/desactivar los mecánicos y, a administradores con permiso de escritura, eliminar un medidor.",
        selector: "#tour-meters-table",
        side: "top",
      },
    ],
  },
  {
    tour: "meter-detail",
    steps: [
      {
        ...base,
        icon: <Gauge />,
        title: "Detalle del medidor",
        content:
          "Toda la información de un medidor. Lo que ves depende del tipo: los inteligentes suman señal, batería, alarmas y control de válvula; los mecánicos muestran sus lecturas manuales.",
        side: "bottom",
      },
      {
        ...base,
        icon: <Info />,
        title: "Datos del medidor",
        content:
          "Nombre, código, cliente asignado y estado. Desde acá podés descargar la factura del período y, en los mecánicos, editar el medidor o activarlo/desactivarlo.",
        selector: "#tour-meter-header",
        side: "bottom",
      },
      {
        ...base,
        icon: <Activity />,
        title: "Métricas principales",
        content:
          "En los inteligentes: flujo acumulado, instantáneo, inverso y temperatura. En los mecánicos: la última lectura y el consumo calculado.",
        selector: "#tour-meter-metrics",
        side: "bottom",
      },
      {
        ...base,
        icon: <BarChart3 />,
        title: "Consumo de agua",
        content:
          "Gráfico de consumo por período o rango de fechas. Cambiá a la vista Tabla para ver cada lectura y exportarlas con «Exportar CSV».",
        selector: "#tour-meter-chart",
        side: "top",
      },
      {
        ...base,
        icon: <Wifi />,
        title: "Estado del dispositivo",
        content:
          "Conectividad LoRa, estado de la válvula, batería y estado operativo del medidor inteligente.",
        selector: "#tour-meter-status",
        side: "left",
      },
      {
        ...base,
        icon: <Bell />,
        title: "Alertas",
        content:
          "Alarmas que reportó el medidor: flujo inverso, tubería vacía, temperatura, batería baja y otros eventos.",
        selector: "#tour-meter-alerts",
        side: "left",
      },
      {
        ...base,
        icon: <SlidersHorizontal />,
        title: "Control de válvula",
        content:
          "Abrí o cerrá la válvula a distancia. Solo pueden hacerlo administradores con permiso de escritura, y cada comando queda registrado en la auditoría.",
        selector: "#tour-meter-valve",
        side: "top",
      },
    ],
  },
  {
    tour: "mechanical-meter-form",
    steps: [
      {
        ...base,
        icon: <PenLine />,
        title: "Medidor mecánico",
        content:
          "Cargá o actualizá los datos de un medidor de lectura manual. Los operarios lo van a ver en su ruta si queda dentro de una zona.",
        side: "bottom",
      },
      {
        ...base,
        icon: <Info />,
        title: "Información del medidor",
        content:
          "Un nombre que lo identifique en campo (por ejemplo, la esquina) y, si tiene, el número de serie como ID.",
        selector: "#tour-mech-info",
        side: "right",
      },
      {
        ...base,
        icon: <MapPin />,
        title: "Dirección y zona",
        content:
          "Buscá la dirección para ubicarlo. Debajo ves en qué zona quedó y las coordenadas exactas. Si dice «Fuera de toda zona», ningún operario lo va a tener en su ruta.",
        selector: "#tour-mech-location",
        side: "right",
      },
      {
        ...base,
        icon: <Map />,
        title: "Ubicación en el mapa",
        content:
          "Hacé clic en el mapa o arrastrá el marcador para ajustar la posición. Las zonas se dibujan de referencia.",
        selector: "#tour-mech-map",
        side: "left",
      },
      {
        ...base,
        icon: <Save />,
        title: "Guardar",
        content: "Guardá los cambios o cancelá para volver sin modificar nada.",
        selector: "#tour-form-actions",
        side: "top",
      },
    ],
  },

  // ───────────────────────────── Mapa y zonas ─────────────────────────────
  {
    tour: "map",
    steps: [
      {
        ...base,
        icon: <Map />,
        title: "Mapa",
        content:
          "Todos los medidores y zonas sobre el mapa. Los medidores cercanos se agrupan; hacé clic en un grupo para ver la lista o en un medidor para ver su estado.",
        side: "bottom",
      },
      {
        ...base,
        icon: <SlidersHorizontal />,
        title: "Controles",
        content:
          "Cambiá el estilo del mapa, filtrá por tipo de medidor, buscá un medidor y activá o desactivá la agrupación.",
        selector: "#tour-map-controls",
        side: "left",
      },
      {
        ...base,
        icon: <Layers />,
        title: "Zonas",
        content:
          "Lista de zonas con su estado; tocá una para centrarla. Con permiso de edición, «Nueva zona» te deja dibujarla haciendo clic en el mapa, y desde cada zona podés editar su polígono.",
        selector: "#tour-map-zones",
        side: "left",
      },
      {
        ...base,
        icon: <BarChart3 />,
        title: "Resumen",
        content:
          "Total de medidores visibles, cuántos están sanos, el desglose por tipo y, en los inteligentes, cuántas válvulas están abiertas o cerradas.",
        selector: "#tour-map-summary",
        side: "top-left",
      },
    ],
  },
  {
    tour: "zones-list",
    steps: [
      {
        ...base,
        icon: <Layers />,
        title: "Zonas",
        content:
          "Las zonas son áreas dibujadas sobre el mapa. Agrupan medidores para ver su consumo, asignar operarios y armar rutas de lectura.",
        side: "bottom",
      },
      {
        ...base,
        icon: <Search />,
        title: "Buscar o crear",
        content:
          "Filtrá por nombre. Las zonas se crean dibujándolas en el Mapa («Ir al mapa»).",
        selector: "#tour-zones-toolbar",
        side: "bottom",
      },
      {
        ...base,
        icon: <Table2 />,
        title: "Listado",
        content:
          "Color, nombre, cantidad de medidores dentro y fecha de creación. Abrí una zona para ver su detalle.",
        selector: "#tour-zones-table",
        side: "top",
      },
    ],
  },
  {
    tour: "zone-detail",
    steps: [
      {
        ...base,
        icon: <Layers />,
        title: "Detalle de zona",
        content:
          "Los medidores dentro de la zona, su consumo en el período, las descargas de facturación y los operarios asignados.",
        side: "bottom",
      },
      {
        ...base,
        icon: <Settings />,
        title: "Acciones de la zona",
        content: "Cambiá el nombre y el color de la zona, o eliminala. Al eliminarla, los medidores no se modifican.",
        selector: "#tour-zone-actions",
        side: "left",
      },
      {
        ...base,
        icon: <BarChart3 />,
        title: "Resumen",
        content:
          "Cantidad de medidores, operarios asignados y si la ronda de lectura del período está completa o pendiente.",
        selector: "#tour-zone-stats",
        side: "bottom",
      },
      {
        ...base,
        icon: <CalendarRange />,
        title: "Período",
        content:
          "El bimestre actual, el anterior o un rango a elección. Define el consumo que se muestra y el CSV que se descarga.",
        selector: "#tour-zone-period",
        side: "bottom",
      },
      {
        ...base,
        icon: <Route />,
        title: "Ruta de lectura",
        content:
          "Repartí los medidores mecánicos de la zona entre los operarios asignados.",
        selector: "#tour-zone-route-cta",
        side: "bottom",
      },
      {
        ...base,
        icon: <Gauge />,
        title: "Medidores de la zona",
        content:
          "Tipo, dispositivo, cliente, dirección, consumo acumulado del período y estado de cada medidor dentro del polígono.",
        selector: "#tour-zone-meters",
        side: "top",
      },
      {
        ...base,
        icon: <Download />,
        title: "Descargas",
        content:
          "Descargá el CSV del período para facturación; cada descarga queda registrada con su período, la cantidad de medidores y tus notas, que después podés corregir desde el historial.",
        selector: "#tour-zone-downloads",
        side: "top",
      },
      {
        ...base,
        icon: <HardHat />,
        title: "Operarios",
        content:
          "Operarios que leen esta zona. Con permiso de edición podés sumar operarios desde «Disponibles» o quitarlos.",
        selector: "#tour-zone-operators",
        side: "top",
      },
    ],
  },
  {
    tour: "zone-route",
    steps: [
      {
        ...base,
        icon: <Route />,
        title: "Ruta de lectura",
        content:
          "Acá decidís qué medidores mecánicos de la zona lee cada operario. Cada operario ve en su portal solo los que le asignaste.",
        side: "bottom",
      },
      {
        ...base,
        icon: <BarChart3 />,
        title: "Resumen",
        content: "Medidores mecánicos de la zona, operarios asignados y estado de la ronda del período.",
        selector: "#tour-route-stats",
        side: "bottom",
      },
      {
        ...base,
        icon: <PenLine />,
        title: "Pincel",
        content:
          "Elegí el operario activo. Cada operario tiene un color, y lo que marques en el mapa se le asigna a él.",
        selector: "#tour-route-brush",
        side: "bottom",
      },
      {
        ...base,
        icon: <MousePointerClick />,
        title: "Mapa",
        content:
          "Hacé clic en un medidor para asignarlo al operario activo. Si ya era suyo, se lo quitás; si era de otro operario, pasa al activo.",
        selector: "#tour-route-map",
        side: "right",
      },
      {
        ...base,
        icon: <ListChecks />,
        title: "Asignación",
        content:
          "Lista por operario de los medidores asignados y, abajo, los que todavía no tienen operario.",
        selector: "#tour-route-panel",
        side: "left",
      },
      {
        ...base,
        icon: <Save />,
        title: "Guardar",
        content: "«Guardar ruta» aplica los cambios; «Limpiar» quita todas las asignaciones.",
        selector: "#tour-route-actions",
        side: "top",
      },
    ],
  },

  // ───────────────────────────── Usuarios ─────────────────────────────
  {
    tour: "users-list",
    steps: [
      {
        ...base,
        icon: <Users />,
        title: "Gestión de Usuarios",
        content:
          "Los usuarios del sistema: administradores, lectores y clientes. Desde acá los creás, editás y gestionás su acceso.",
        side: "bottom",
      },
      {
        ...base,
        icon: <Filter />,
        title: "Estados de cuenta",
        content:
          "Cada tarjeta cuenta los usuarios Activos, Inactivos, Pendientes y Bloqueados. Hacé clic en una para filtrar la tabla.",
        selector: "#tour-users-filter-tabs",
        side: "bottom",
      },
      {
        ...base,
        icon: <Search />,
        title: "Búsqueda",
        content: "Buscá por nombre o apellido. «Limpiar» quita la búsqueda y los filtros.",
        selector: "#tour-users-search",
        side: "bottom-left",
      },
      {
        ...base,
        icon: <ShieldCheck />,
        title: "Rol",
        content:
          "Mostrá todos, solo administradores o solo lectores. El lector puede consultar el Mapa y las Zonas, pero no modificar nada.",
        selector: "#tour-users-role-filter",
        side: "bottom-right",
      },
      {
        ...base,
        icon: <UserPlus />,
        title: "Crear usuario",
        content: "Registrá un usuario nuevo con sus datos, rol, contraseña y dirección.",
        selector: "#tour-users-create",
        side: "bottom-right",
      },
      {
        ...base,
        icon: <Table2 />,
        title: "Tabla de usuarios",
        content:
          "Nombre, email, dirección, estado y si tiene medidor asignado. Hacé clic en una fila para ver el detalle. El menú «…» permite editar, desactivar o reactivar y, a administradores con permiso de escritura, eliminar definitivamente.",
        selector: "#tour-users-table",
        side: "top",
      },
    ],
  },
  {
    tour: "user-detail",
    steps: [
      {
        ...base,
        icon: <User />,
        title: "Detalle del usuario",
        content: "Datos personales, dirección, rol, permisos y medidor asignado del usuario.",
        side: "bottom",
      },
      {
        ...base,
        icon: <Info />,
        title: "Información personal",
        content: "Nombre, email, dirección y desde cuándo es miembro, con su ubicación en el mapa. «Editar» abre el formulario.",
        selector: "#tour-user-info",
        side: "bottom",
      },
      {
        ...base,
        icon: <ShieldCheck />,
        title: "Roles y permisos",
        content:
          "Rol del usuario y estado de su cuenta. Los administradores pueden habilitar o revocar el permiso de escritura, necesario para controlar válvulas y eliminar medidores o usuarios.",
        selector: "#tour-user-roles",
        side: "top",
      },
      {
        ...base,
        icon: <Gauge />,
        title: "Medidor",
        content: "El medidor asignado con su tipo y estado. Si no tiene, podés asignarle uno desde acá.",
        selector: "#tour-user-meter",
        side: "top",
      },
    ],
  },
  {
    tour: "user-create",
    steps: [
      {
        ...base,
        icon: <UserPlus />,
        title: "Crear usuario",
        content: "Completá los datos del nuevo usuario. Todos los campos son obligatorios.",
        side: "bottom",
      },
      {
        ...base,
        icon: <User />,
        title: "Información personal",
        content:
          "Nombre, apellido, email y rol. Administrador tiene acceso completo; Lector solo puede consultar el Mapa y las Zonas. La contraseña se ingresa dos veces para confirmarla.",
        selector: "#tour-edit-personal",
        side: "right",
      },
      {
        ...base,
        icon: <MapPin />,
        title: "Ubicación",
        content: "Buscá la dirección con el autocompletado; el mapa marca el punto elegido.",
        selector: "#tour-edit-location",
        side: "left",
      },
      {
        ...base,
        icon: <Save />,
        title: "Crear",
        content: "Creá el usuario o cancelá para volver al listado.",
        selector: "#tour-form-actions",
        side: "top",
      },
    ],
  },
  {
    tour: "user-edit",
    steps: [
      {
        ...base,
        icon: <PenLine />,
        title: "Editar usuario",
        content: "Actualizá los datos personales, el estado de la cuenta y la dirección.",
        side: "bottom",
      },
      {
        ...base,
        icon: <User />,
        title: "Información personal",
        content:
          "Nombre, apellido y email. Los administradores también pueden cambiar el estado: Activo, Inactivo, Pendiente o Bloqueado.",
        selector: "#tour-edit-personal",
        side: "right",
      },
      {
        ...base,
        icon: <MapPin />,
        title: "Ubicación",
        content: "Buscá la nueva dirección con el autocompletado; el mapa se actualiza al elegirla.",
        selector: "#tour-edit-location",
        side: "left",
      },
      {
        ...base,
        icon: <Save />,
        title: "Guardar",
        content: "Guardá los cambios o cancelá para volver sin modificar nada.",
        selector: "#tour-form-actions",
        side: "top",
      },
    ],
  },

  // ───────────────────────────── Operarios ─────────────────────────────
  {
    tour: "operarios-list",
    steps: [
      {
        ...base,
        icon: <HardHat />,
        title: "Operarios",
        content:
          "Los operarios de campo que leen los medidores mecánicos. Entran al Portal del operario con su email y contraseña.",
        side: "bottom",
      },
      {
        ...base,
        icon: <BarChart3 />,
        title: "Resumen del equipo",
        content: "Total de operarios, cuántos están activos y cuántas zonas están cubiertas.",
        selector: "#tour-operarios-stats",
        side: "bottom",
      },
      {
        ...base,
        icon: <Search />,
        title: "Búsqueda",
        content: "Buscá un operario por nombre o email.",
        selector: "#tour-operarios-search",
        side: "bottom-left",
      },
      {
        ...base,
        icon: <UserPlus />,
        title: "Nuevo operario",
        content: "Registrá un operario con su nombre, email y contraseña de acceso al portal.",
        selector: "#tour-operarios-create",
        side: "bottom-right",
      },
      {
        ...base,
        icon: <Table2 />,
        title: "Listado",
        content: "Nombre, email, estado y zonas asignadas. Hacé clic en una fila para ver su detalle.",
        selector: "#tour-operarios-table",
        side: "top",
      },
    ],
  },
  {
    tour: "operario-detail",
    steps: [
      {
        ...base,
        icon: <HardHat />,
        title: "Detalle del operario",
        content: "Perfil, actividad, zonas asignadas y lecturas registradas por el operario.",
        side: "bottom",
      },
      {
        ...base,
        icon: <Activity />,
        title: "Actividad",
        content: "Lecturas totales, lecturas de esta semana, zonas asignadas y cuándo hizo su última lectura.",
        selector: "#tour-operario-stats",
        side: "right",
      },
      {
        ...base,
        icon: <Layers />,
        title: "Zonas asignadas",
        content:
          "Zonas en las que trabaja. Elegí una zona y tocá «Asignar» para sumarla, o la cruz de una zona para quitarla.",
        selector: "#tour-operario-zones",
        side: "right",
      },
      {
        ...base,
        icon: <ClipboardList />,
        title: "Historial de lecturas",
        content: "Sus últimas 30 lecturas: medidor, valor leído, consumo calculado, fecha y observaciones.",
        selector: "#tour-operario-readings",
        side: "left",
      },
    ],
  },
  {
    tour: "operario-create",
    steps: [
      {
        ...base,
        icon: <UserPlus />,
        title: "Nuevo operario",
        content:
          "Nombre, apellido, email y contraseña. Con ese email y contraseña el operario entra al Portal para registrar lecturas.",
        selector: "#tour-operario-form",
        side: "bottom",
      },
      {
        ...base,
        icon: <Layers />,
        title: "Después de crearlo",
        content: "Asignale zonas desde su detalle para que vea medidores en su ruta.",
        selector: "#tour-form-actions",
        side: "top",
      },
    ],
  },

  // ───────────────────────────── Cooperativa ─────────────────────────────
  {
    tour: "cooperative",
    steps: [
      {
        ...base,
        icon: <Settings />,
        title: "Cooperativa",
        content: "Los datos de la cooperativa y cómo se ve en el sistema.",
        selector: "#tour-coop-header",
        side: "bottom",
      },
      {
        ...base,
        icon: <FileText />,
        title: "General y Personalización",
        content:
          "En General: nombre, estado, ubicación y datos de contacto (persona, teléfono, email y sitio web). En Personalización: el logo y el color de la cooperativa, con vista previa.",
        selector: "#tour-coop-tabs",
        side: "bottom",
      },
      {
        ...base,
        icon: <Palette />,
        title: "Guardar",
        content: "Los cambios se aplican al tocar «Guardar cambios».",
        selector: "#tour-coop-save",
        side: "top",
      },
    ],
  },

  // ───────────────────────────── Portal del operario ─────────────────────────────
  {
    tour: "portal-home",
    steps: [
      {
        ...base,
        icon: <HardHat />,
        title: "Tu portal",
        content: "Desde acá ves tus zonas y registrás las lecturas del día.",
        side: "bottom",
      },
      {
        ...base,
        icon: <BarChart3 />,
        title: "Tu jornada",
        content: "Zonas activas que tenés asignadas, medidores a tu cargo y cuántos leíste hoy.",
        selector: "#tour-portal-stats",
        side: "bottom",
      },
      {
        ...base,
        icon: <Layers />,
        title: "Tus zonas",
        content: "Tocá una zona para ver los medidores que tenés que leer.",
        selector: "#tour-portal-zones",
        side: "top",
      },
    ],
  },
  {
    tour: "portal-zones",
    steps: [
      {
        ...base,
        icon: <Layers />,
        title: "Mis zonas",
        content:
          "Cada tarjeta es una zona asignada: cuántos medidores tenés a cargo y cuántos leíste hoy. Tocá una para empezar la ruta. Si no ves ninguna, pedile a tu supervisor que te asigne una zona.",
        selector: "#tour-portal-zone-list",
        side: "bottom",
      },
    ],
  },
  {
    tour: "portal-route",
    steps: [
      {
        ...base,
        icon: <ClipboardCheck />,
        title: "Tu avance",
        content: "Cuántos medidores de la zona tenés asignados, cuántos leíste hoy y el porcentaje completado.",
        selector: "#tour-portal-route-summary",
        side: "bottom",
      },
      {
        ...base,
        icon: <ListChecks />,
        title: "Pendientes",
        content: "Los medidores que te faltan leer hoy. Tocá uno para registrar su lectura; los ya leídos pasan abajo.",
        selector: "#tour-portal-route-pending",
        side: "bottom",
      },
    ],
  },
  {
    tour: "portal-reading",
    steps: [
      {
        ...base,
        icon: <Gauge />,
        title: "Medidor",
        content: "Dirección, cliente y última lectura registrada, para que confirmes que estás en el medidor correcto.",
        selector: "#tour-reading-meter",
        side: "bottom",
      },
      {
        ...base,
        icon: <ListChecks />,
        title: "Pasos",
        content: "Foto, Lectura y Confirmar: primero sacás la foto, después revisás el valor y por último guardás.",
        selector: "#tour-reading-steps",
        side: "bottom",
      },
      {
        ...base,
        icon: <ScanLine />,
        title: "Foto y lectura",
        content:
          "Sacale una foto al visor: el valor se lee solo. Revisalo y corregilo si hace falta. Si la foto no se puede leer, se habilita la carga manual. Podés sumar observaciones.",
        selector: "#tour-reading-form",
        side: "top",
      },
      {
        ...base,
        icon: <KeyRound />,
        title: "Guardar lectura",
        content: "Confirmá para registrar la lectura y volver a tu ruta.",
        selector: "#tour-reading-submit",
        side: "top",
      },
    ],
  },
];

