# Tareas pendientes tras las pruebas del 22/09/2026

Lo que salió de poner el control de válvulas a funcionar en producción por
primera vez. Cada tarea dice qué problema resuelve y de qué depende, porque
varias no tienen sentido hasta que se responda la pregunta del principio.

Contexto completo del sistema: [Arquitectura Ecowater](https://claude.ai/artifact/NB9MgHPbqVHdQ5CUutbTYW)

---

## Primero: una decisión que no es técnica

**Para qué va a usar la cooperativa el control de válvulas.** De esto depende
buena parte de la lista.

El forzado de paquete no se puede automatizar: se hace acercando un imán al
medidor. Así que la latencia la define el intervalo de reporte, que hoy es de
12 horas — seis de espera promedio por comando, doce en el peor caso.

Y los dos usos no toleran lo mismo:

| Uso | ¿Aguanta 12 horas? |
|---|---|
| Cortar por falta de pago | Sí, sin problema |
| Reabrir cuando el socio paga | No. Es mal servicio y genera reclamos |

Si la respuesta es "solo cortar morosos", **la feature ya está terminada** y
gran parte de lo que sigue no hace falta. Si incluye reabrir en el día, hay que
bajar el intervalo de reporte del medidor y asumir el costo en batería de
aparatos ya instalados.

Ojo con la trampa: si para reabrir rápido hay que mandar a alguien con el imán,
esa persona ya está parada frente al medidor y puede abrir la válvula a mano. El
control remoto pierde sentido justo en el caso donde más se lo necesita.

---

## Backend

### 1. Escuchar el acuse del gateway
**Es el cambio más grande de la lista y habilita casi todo lo demás.**

Un comando puede perderse en silencio, y lo vimos pasar: la app dice «enviado»,
el broker lo entrega, el gateway lo transmite, y el medidor no se entera. Nadie
se da cuenta hasta que alguien nota que la válvula no se movió.

El gateway publica un acuse en `application/{app}/device/{devEUI}/ack` cuando el
medidor recibe el comando. Es la única prueba directa de entrega, y hoy nadie la
escucha.

**No es un endpoint.** Necesita un proceso suscripto al broker de forma
permanente, o sea un servicio nuevo en `docker-compose.prod.yml`. Es trabajo
real, no un ajuste.

Depende de la decisión de arriba.

### 2. Reintentar los comandos perdidos
Con el acuse escuchando: si pasan varias ventanas sin acuse, reintentar o marcar
el comando como perdido. Hoy no hay forma de distinguir «todavía espera» de «se
perdió».

Depende de la tarea 1.

### 3. No ejecutar comandos vencidos
Un comando encolado no debería aplicarse dos días después, cuando el motivo ya
no existe. Hay dos niveles:

- `persistent_client_expiration` en el broker — una línea de configuración. Hoy
  está sin definir, así que el broker guarda los comandos del gateway para
  siempre mientras esté desconectado.
- Descartar comandos vencidos en la aplicación.

La primera parte es una decisión de operación: poner un día significa que si el
gateway estuvo caído 25 horas por un motivo legítimo, también se pierden
comandos válidos.

---

## Frontend y UX

### 4. El cartel de «comando encolado» miente
**Barato y de alto impacto.**

Es `useState` en `valve-control-panel.tsx`: estado del navegador. Al recargar la
página desaparece, aunque el comando siga pendiente. El operador pierde el
rastro de si hay algo en curso.

Debería derivarse de la auditoría —último comando contra estado actual de la
válvula— para que sobreviva a un F5 y diga la verdad.

### 5. «Sin conexión» manda a investigar lo que no es
**Muy barato.**

Es la etiqueta que se muestra ante cualquier error de MQTT. El 22/09 apareció
cuando el problema era un paquete de npm que no estaba en la imagen. Cualquiera
habría ido a revisar la red en vez del deploy.

Los mensajes de error tienen que decir qué pasó realmente.

### 6. El ciclo de 12 horas está hardcodeado para todos los medidores
`CYCLE_MS` es una constante en el panel. Da bien para el Medidor_C por
casualidad — medimos 11 h 59 min 56 s — pero cada aparato tiene el suyo, y
encima **se corre con cada visita con imán**: el reloj del medidor se reinicia en
cada transmisión, sea espontánea o provocada.

Debería calcularse del historial de cada medidor.

### 7. Avisar cuando un comando probablemente se perdió
Después de varias ventanas sin acuse, decírselo al operador en vez de dejar el
cartel girando indefinidamente.

Depende de la tarea 1.

---

## Infraestructura y operación

### 8. Probar que el backup se pueda restaurar
**Lo más urgente de esta sección.**

Ahora la base, la app y el broker viven en el mismo servidor. Antes estaban
repartidos entre Supabase y HiveMQ; hoy el VPS es un único punto de falla y el
respaldo es la única red.

Que el script corra no alcanza: hay que restaurar un dump en una base de prueba
y verificar que los datos estén completos.

### 9. Rotar credenciales
Durante la jornada pasaron por el chat: la contraseña de root del VPS, la de
Supabase, `AUTH_SECRET`, la URI de Mongo con credenciales, una API key de
Anthropic, las dos del broker MQTT y la del usuario `readonly`.

### 10. Base de datos local para el equipo
Hoy el `.env.local` del repo apunta a Supabase, que quedó congelada el 22/09 al
mediodía. Cualquiera que levante el proyecto está viendo datos muertos sin
enterarse.

Peor: si además tiene el broker configurado, **un botón apretado en local le
corta el agua a un socio real**.

Lo correcto es un Postgres en Docker más `prisma db push`. Como mínimo, dejar
`MQTT_BROKER_URL` vacía en los entornos de desarrollo.

### 11. Actualizar el CLAUDE.md
Quedó desactualizado en casi todo lo importante: dice que la auditoría está en
Mongo, que el broker es HiveMQ y que la base es Supabase. Las tres cosas
cambiaron el 22/09. Quien lo lea hoy arranca con el mapa viejo.

### 12. `chown` del repositorio en el servidor
Es de `root:docker`, así que `deploy.sh` no funciona sin `sudo` — el `git pull`
falla por permisos. Pasarlo al usuario `deploy` y el script vuelve a ser un solo
comando.

### 13. Verificar el cron de estado de medidores
Quedó dinámico con el PR #67, pero no se probó después de la migración de base.

---

## Orden sugerido

**Esta semana, sin depender de nadie:** las tareas 8, 9, 4 y 5. Entre todas es
medio día y sacan de encima los riesgos concretos.

**Después:** la 11 y la 10, que son las que permiten que el resto del equipo
trabaje sin pisar producción.

**La tarea 1 recién cuando la cooperativa responda la pregunta del principio.**
Si terminan usando esto solo para cortar morosos con doce horas de tolerancia,
los reintentos y el estado en tiempo real dejan de ser necesarios. Sería
construir para un problema que no tienen.

---

## Apéndice: lo que se arregló el 22/09

Queda anotado porque los cinco comparten una forma que conviene reconocer.

| Qué estaba roto | Por qué no se veía |
|---|---|
| Comparación de roles en mayúscula: 403 para todos, admins incluidos | La función nunca se había habilitado |
| Ruta de API prerenderizada en el build: devolvía flags congelados | Respondía un dato plausible, no un error |
| El paquete `mqtt` no se copiaba a la imagen standalone | Funcionaba perfecto en local |
| Fechas de lectura tomadas del reloj del medidor, con hasta 187 días de error | El dato existía y parecía válido |
| Tramas de confirmación que devolvían 500 en la ingesta | Uno de cada tres POST fallaba sin que nadie mirara |

**Ninguno rompía el build ni aparecía en local.** Los cinco se manifestaban solo
en producción y ninguno decía qué había pasado. Es el patrón a vigilar en este
proyecto: evaluación en tiempo de compilación, nombres de opciones que cambian
entre versiones del framework, y rastreo de dependencias.
