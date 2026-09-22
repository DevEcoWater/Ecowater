# Leer la base de producción sin poder romperla

Desde el 22/09/2026 producción corre sobre el PostgreSQL del VPS, no sobre
Supabase. Ya no hay una consola web donde mirar los datos, así que esta es la
forma de conectarse.

El acceso es **de solo lectura y a través de un túnel SSH**. Postgres escucha
únicamente en `127.0.0.1` del servidor: no está expuesto a internet y no hay
forma de llegar sin una clave SSH autorizada.

---

## Una sola vez: pedir acceso

**1. Que te agreguen la clave SSH.** Pasale tu clave pública a quien administre
el servidor:

```bash
cat ~/.ssh/id_ed25519.pub
```

**2. Agregá el host a tu `~/.ssh/config`** para no tener que acordarte del
puerto, que no es el 22:

```
Host ecowater-vps
  HostName 138.36.237.244
  Port 5306
  User deploy
  IdentityFile ~/.ssh/id_ed25519
  IdentitiesOnly yes
```

Probá que entra: `ssh ecowater-vps` tiene que darte una consola.

**3. Pedí las credenciales del usuario `readonly`.** No están en el repo ni se
comparten por chat. Guardalas en tu gestor de contraseñas.

---

## Cada vez: abrir el túnel

En una terminal aparte, y dejala abierta mientras consultás:

```bash
ssh -N -L 5433:localhost:5432 ecowater-vps
```

Eso hace que el puerto `5433` de tu máquina sea el Postgres de producción. El
`-N` es para que no abra una consola: solo el túnel. Se corta con `Ctrl+C`.

Usamos el 5433 y no el 5432 para no pisarte un Postgres local si tenés uno.

## Conectarte

**Desde la terminal:**

```bash
psql "postgresql://readonly:LA_CONTRASEÑA@localhost:5433/ecowater_cosego"
```

**Desde TablePlus, DBeaver, DataGrip o similar:**

| Campo | Valor |
|---|---|
| Host | `localhost` |
| Puerto | `5433` |
| Base | `ecowater_cosego` |
| Usuario | `readonly` |
| SSL | no hace falta (el túnel ya va cifrado) |

### Lo más cómodo: que el cliente arme el túnel solo

DBeaver, TablePlus, DataGrip y pgAdmin saben abrir el túnel por su cuenta, así
que no necesitás la terminal aparte. Cargás los datos una vez y después te
conectás como a cualquier otra base.

**En DBeaver**, al crear una conexión PostgreSQL:

*Pestaña Main*

| Campo | Valor |
|---|---|
| Host | `localhost` |
| Port | `5432` |
| Database | `ecowater_cosego` |
| Username | `readonly` |
| Password | la que te pasaron |

*Pestaña SSH* — tildá **Use SSH Tunnel**

| Campo | Valor |
|---|---|
| Host/IP | `138.36.237.244` |
| Port | `5306` |
| User Name | `deploy` |
| Authentication Method | Public Key |
| Private Key | `~/.ssh/id_ed25519` |

En Main va `localhost:5432` y no el puerto 5433 del ejemplo de la terminal:
desde el otro extremo del túnel, que lo abre DBeaver, la base *es* local. Probá
con **Test Connection** antes de guardar.

El resto de los clientes es lo mismo con otros nombres: TablePlus lo llama
*Over SSH*, DataGrip *SSH/SSL*, pgAdmin *SSH Tunnel*. Un cliente de MySQL o
MariaDB no sirve: es otro protocolo.

### Por qué no abrimos el puerto y listo

Publicar el 5432 en internet significa que cualquier escáner automático lo
encuentra en horas y empieza a probar contraseñas, y que lo único que protege
los datos de los socios es esa contraseña. Peor todavía: este Postgres no tiene
TLS configurado, así que las credenciales y los datos viajarían sin cifrar.

El túnel resuelve las tres cosas sin agregar nada: autenticación por clave,
tráfico cifrado, y ningún puerto nuevo en el firewall — el de SSH ya está
abierto.

---

## Qué podés y qué no

El usuario `readonly` puede hacer `SELECT` sobre todas las tablas, y nada más.
Un `INSERT`, `UPDATE`, `DELETE` o `ALTER` falla con *permission denied*. No es
una convención: es un permiso de la base, así que no hay forma de equivocarse.

Incluye las tablas que se creen en el futuro, gracias a los privilegios por
defecto que se configuran al crear el rol.

**Igual son datos reales.** Los medidores, los socios y sus domicilios son de
personas de verdad. No copies datos a tu máquina, no los pegues en un chat y no
los uses para poblar un entorno de pruebas.

### Consultas de uso frecuente

```sql
-- Últimas lecturas que llegaron.
-- Desde el fix de ED-90, Reading.timestamp sale del reloj del gateway y
-- coincide con Status.created_at al segundo: podés usar cualquiera de los dos.
-- Antes venía del reloj interno del medidor, que se reiniciaba solo y dejaba
-- lecturas fechadas con meses de diferencia.
select s.created_at, m.device_name, s.valve_status, s.empty_pipe_alarm
from "Status" s
join "Reading" r on r.id = s.reading_id
join "Meter" m on m.id = r.meter_id
order by s.created_at desc
limit 20;

-- Medidores inteligentes y su última señal.
select m.device_name, m.dev_eui, m.status, max(s.created_at) as ultima_senal
from "Meter" m
left join "Reading" r on r.meter_id = m.id
left join "Status" s on s.reading_id = r.id
where m.meter_type = 'SMART'
group by m.id, m.device_name, m.dev_eui, m.status
order by ultima_senal desc nulls last;

-- Quién mandó comandos de válvula y qué pasó.
select timestamp, user_email, action, result, error
from "ValveEvent"
order by timestamp desc
limit 50;
```

---

## Si algo no anda

**`Connection refused` en el puerto 5433** — el túnel no está abierto, o lo
cerraste. Revisá la terminal donde corriste el `ssh -N`.

**`password authentication failed`** — contraseña mal copiada, o te estás
conectando con `devecowater` en vez de `readonly`.

**El túnel abre pero la base no responde** — comprobá que el contenedor esté
arriba:

```bash
ssh ecowater-vps 'sudo docker ps --filter name=ecowater-postgres'
```

**`bind: Address already in use`** — ya tenés un túnel abierto en el 5433, o
algo más lo está usando. Usá otro puerto local: `-L 5434:localhost:5432`.

---

## Para el administrador: crear el rol

Se hace una sola vez. Elegí una contraseña fuerte y guardala en el gestor del
equipo; no la pongas en el repo.

```bash
ssh ecowater-vps
sudo docker exec -it ecowater-postgres psql -U devecowater -d ecowater_cosego
```

Y dentro de psql:

```sql
CREATE ROLE readonly WITH LOGIN PASSWORD 'PONE_UNA_CONTRASEÑA_FUERTE';

-- Puede ver el esquema y leer todo lo que ya existe.
GRANT CONNECT ON DATABASE ecowater_cosego TO readonly;
GRANT USAGE ON SCHEMA public TO readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO readonly;

-- Y también lo que se cree de acá en adelante, sin tener que volver a correr esto.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON SEQUENCES TO readonly;

-- IMPRESCINDIBLE. Sin esto el rol puede crear tablas igual: Postgres le da
-- CREATE sobre el esquema public a todo el mundo por defecto, y un restore
-- puede reponer ese permiso aunque lo hayas sacado antes.
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE CREATE ON SCHEMA public FROM readonly;
```

Comprobá que quedó bien limitado:

```sql
-- Tiene que devolver filas.
SET ROLE readonly;
SELECT count(*) FROM "Meter";

-- Y esto tiene que fallar con "permission denied for schema public".
-- Si en cambio te dice CREATE TABLE, te faltó el REVOKE de arriba: borrá la
-- tabla, corré el REVOKE y volvé a probar.
CREATE TABLE prueba_permisos (id int);
RESET ROLE;
```

El estado correcto se ve así — fijate que PUBLIC (el nombre vacío antes del
`=`) tiene `U` de usage pero no `C` de create:

```sql
SELECT nspacl FROM pg_namespace WHERE nspname = 'public';
-- {devecowater=UC/devecowater,=U/devecowater,readonly=U/devecowater}
```

### Sumar a alguien

```bash
ssh ecowater-vps
echo 'ssh-ed25519 AAAA... nombre@equipo' | sudo tee -a /home/deploy/.ssh/authorized_keys
```

Para sacarle el acceso a alguien, borrá su línea de ese archivo. Y si se va del
proyecto alguien que conocía la contraseña de `readonly`, rotala:

```sql
ALTER ROLE readonly WITH PASSWORD 'OTRA_CONTRASEÑA';
```
