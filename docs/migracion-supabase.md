# Migración a Supabase

Guía operativa para llevar el esquema y un seed mínimo (catálogos + un usuario) a
una base de datos de Supabase, y para hacer cambios de esquema posteriores sin
perder datos.

Cada paso trae su verificación. **No avances al siguiente si la verificación no
da el resultado esperado.**

---

## 0. Estado verificado del repositorio

Antes de escribir esta guía se comprobó lo siguiente sobre el proyecto:

| Comprobación                                 | Resultado                                                                                           |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Migraciones en `prisma/migrations`           | 15, todas aplicadas en la base local                                                                |
| ¿Las migraciones reproducen `schema.prisma`? | Sí — `migrate diff` no detecta diferencias                                                          |
| Ensayo en una base vacía (`migrate deploy`)  | Aplica las 15 y el esquema queda idéntico                                                           |
| Seed mínimo sobre esa base                   | 23 permisos, 8 roles, 7 tipos de reunión, 5 categorías de ofrenda, 5 tipos de asistencia, 1 usuario |
| Datos de prueba creados por el seed mínimo   | 0 miembros, 0 reuniones, 0 ofrendas, 0 territorios                                                  |

Esto importa porque significa que **no hay drift**: lo que hay en las migraciones
es exactamente lo que hay en `schema.prisma`. Sin eso, `migrate deploy` habría
dejado la base incompleta.

---

## 1. Conceptos que evitan el 90% de los accidentes

**Supabase entrega tres cadenas de conexión distintas** (Dashboard → _Connect_).
No son intercambiables:

| Conexión                        | Puerto | Para qué sirve                                         |
| ------------------------------- | ------ | ------------------------------------------------------ |
| Direct connection               | 5432   | Migraciones. Solo IPv6 salvo que pagues el add-on IPv4 |
| Session pooler (`pooler.…`)     | 5432   | Migraciones cuando no tienes IPv6. **Recomendada**     |
| Transaction pooler (`pooler.…`) | 6543   | Runtime en Vercel/serverless. **No sirve para migrar** |

El pooler en modo transacción no soporta el DDL ni los advisory locks que usa
Prisma Migrate. Por eso este repo ahora separa las dos:

- `DATABASE_URL` → la usa la app en runtime (`server/database/prisma.ts`). Va al **6543**.
- `DIRECT_DATABASE_URL` → la usa solo el CLI de Prisma vía `prisma.config.ts`. Va al **5432**.

**Comandos que nunca debes correr contra Supabase:**

| Comando                        | Qué hace                                                                |
| ------------------------------ | ----------------------------------------------------------------------- |
| `prisma migrate reset`         | Borra toda la base y vuelve a aplicar migraciones                       |
| `prisma db push`               | Sincroniza por diferencia: puede eliminar columnas con datos sin avisar |
| `prisma db push --force-reset` | Borra la base entera                                                    |
| `npm run prisma:seed`          | Seed completo, inserta datos de prueba                                  |

Los tres primeros no tienen protección: son comandos de Prisma. El cuarto sí — el
seed completo ahora se niega a correr contra una base no local.

---

## 2. Preparar el proyecto en Supabase

1. Crea el proyecto y guarda la contraseña de la base de datos en tu gestor de
   contraseñas. Supabase **no la vuelve a mostrar**.
2. Dashboard → _Connect_ → copia las tres cadenas.
3. Anota la región: la necesitas para el host del pooler.

No crees tablas a mano ni uses el editor SQL para el esquema. Todo el esquema
sale de las migraciones.

---

## 3. Configurar el entorno local apuntando a Supabase

En tu `.env` local (que ya está en `.gitignore`):

```bash
# Runtime: pooler en modo transacción (6543)
# uselibpqcompat es necesario: sin él, pg exige validar el certificado y falla.
DATABASE_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require&uselibpqcompat=true

# CLI de Prisma: session pooler (5432), o direct connection si tienes IPv6
DIRECT_DATABASE_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require
```

Si la contraseña tiene caracteres especiales (`@`, `#`, `/`, `:`), hay que
codificarlos en porcentaje o la URL se parte mal. `@` → `%40`, `#` → `%23`,
`/` → `%2F`, `:` → `%3A`.

**Verificación:**

```bash
npm run db:status
```

Esperado: conecta e informa que **no hay migraciones aplicadas** (base nueva). Si
falla la conexión, ve a la sección 10 antes de seguir.

---

## 4. Respaldo previo

En una base recién creada no hay nada que respaldar, así que este paso aplica de
la migración 2 en adelante. Hazlo **siempre** antes de un `migrate deploy` sobre
una base con datos:

```bash
npx supabase db dump --db-url "$DIRECT_DATABASE_URL" -f respaldo-$(date +%F).sql
```

Alternativa con `pg_dump` (necesita una versión igual o mayor a la del servidor):

```bash
pg_dump "$DIRECT_DATABASE_URL" --schema=public --no-owner --no-privileges -Fc -f respaldo.dump
```

Los proyectos del plan gratuito **no tienen respaldos automáticos**. No asumas
que Supabase te va a salvar: el archivo lo haces tú.

**Verificación:** el archivo existe y pesa más que unos pocos KB.

---

## 5. Aplicar el esquema

```bash
npx prisma migrate deploy
```

`migrate deploy` solo aplica migraciones pendientes en orden. **Nunca borra nada
y nunca pregunta.** Es el único comando de migración apto para una base real.

**Verificación (dos comandos, los dos deben pasar):**

```bash
npm run db:status   # → "Database schema is up to date!"
npm run db:verify   # → "No difference detected."
```

El segundo es el importante: compara la base real contra `schema.prisma`. Si
dice algo distinto de _No difference detected_, **no sigas** — la base quedó
distinta de lo que el código espera.

---

## 6. Seed mínimo

Solo catálogos y un usuario administrador. No inserta miembros, territorios,
reuniones ni ofrendas.

```bash
SEED_ALLOW_REMOTE=true \
SEED_ADMIN_EMAIL=tu-correo@dominio.com \
SEED_ADMIN_PASSWORD='una-clave-larga-de-verdad' \
npm run prisma:seed:minimal
```

Las tres variables son obligatorias contra una base remota:

- Sin `SEED_ALLOW_REMOTE=true` el script se detiene. Es la red de seguridad
  contra el `npm run prisma:seed:minimal` escrito por costumbre.
- Sin `SEED_ADMIN_*` también se detiene: los valores por defecto
  (`admin@local.test` / `Admin12345!`) están publicados en este repositorio.
- La contraseña debe tener 12 caracteres o más.

Qué inserta, todo con `upsert` idempotente:

| Catálogo              | Filas |
| --------------------- | ----- |
| Permisos              | 23    |
| Roles                 | 8     |
| Rol↔permiso           | 82    |
| Tipos de reunión      | 7     |
| Categorías de ofrenda | 5     |
| Tipos de asistencia   | 5     |
| Usuario admin         | 1     |

Los catálogos de miembros (roles de comunidad, ministerios) los inserta la
migración `20260820140000_seed_member_catalogs`, así que ya están tras el paso 5.

Volver a ejecutarlo es seguro: no duplica filas. Si el usuario administrador ya
existe, **conserva su contraseña** en lugar de reescribirla. Para restablecerla a
propósito: `SEED_ADMIN_RESET_PASSWORD=true`.

**Verificación:**

```bash
npx prisma studio    # usa DIRECT_DATABASE_URL
```

Revisa que `usu_usuario` tenga exactamente 1 fila y que `mie_miembro`,
`reu_reunion` y `dof_detalle_ofrenda` estén en 0.

---

## 7. Probar la aplicación

```bash
npm run dev
```

Entra con el correo y la contraseña del paso 6. Verifica en este orden:

1. El login funciona y llegas al dashboard.
2. Los catálogos aparecen poblados (tipos de reunión, categorías de ofrenda).
3. Crear un registro nuevo funciona (una zona, un miembro).

`npm run dev` ejecuta `scripts/setup-db.mjs`, que ahora **no toca bases
remotas**: si no conecta, falla y te dice que uses `migrate deploy`. Antes podía
intentar un `db push`, que es justo lo que no queremos contra Supabase.

---

## 8. Configurar Vercel

```bash
npx vercel env add DATABASE_URL production --sensitive   # pooler :6543
npx vercel env add JWT_SECRET production --sensitive
npx vercel env add NUXT_PUBLIC_APP_NAME production
npx vercel env add APP_BASE_URL production               # https://tu-dominio
npx vercel env add SMTP_HOST production
npx vercel env add SMTP_PORT production
npx vercel env add SMTP_SECURE production
npx vercel env add SMTP_USER production
npx vercel env add SMTP_PASSWORD production --sensitive
npx vercel env add MAIL_FROM production
```

`DIRECT_DATABASE_URL` **no** hace falta en Vercel: solo la usa el CLI desde tu
máquina. Si la agregas, tampoco estorba.

**No pongas `prisma migrate deploy` en el script de `build`.** Los builds de
Vercel corren en paralelo y sin supervisión; una migración destructiva se
aplicaría sola. Las migraciones se ejecutan a mano desde tu máquina, con respaldo
hecho, y después se despliega.

Orden correcto de un despliegue con cambio de esquema:

1. Respaldo (paso 4).
2. `npx prisma migrate deploy`.
3. `npm run db:verify` → _No difference detected_.
4. `git push` / `vercel --prod`.

---

## 9. Cambios de esquema posteriores

Aquí es donde se pierden datos si se hace mal. La regla base: **el cambio se
desarrolla y se revisa en local; a Supabase solo llega `migrate deploy`.**

### 9.1 Flujo estándar

```bash
# 1. Apunta el CLI a tu base LOCAL (no a Supabase)
#    En .env: DIRECT_DATABASE_URL vacío y DATABASE_URL local.

# 2. Edita prisma/schema.prisma

# 3. Genera la migración contra la base local
npx prisma migrate dev --name agrega_campo_telefono

# 4. LEE el SQL generado antes de seguir
cat prisma/migrations/*_agrega_campo_telefono/migration.sql

# 5. Verifica que migraciones y schema coinciden
npm run db:verify

# 6. Apunta a Supabase y aplica
npx prisma migrate deploy
npm run db:verify
```

`migrate dev` necesita una base sombra (la crea y la destruye). Si tu usuario de
Postgres local no puede crear bases, define `SHADOW_DATABASE_URL` apuntando a una
base local vacía dedicada a eso.

### 9.2 Agregar un campo

**Opcional (nullable):** no tiene riesgo. `ALTER TABLE ... ADD COLUMN`.

**Obligatorio (NOT NULL) en una tabla con filas:** no se puede en un solo paso
sin default. Tres migraciones:

1. Agregar la columna como opcional.
2. Rellenar los datos existentes (`UPDATE` escrito a mano en una migración).
3. Marcarla `NOT NULL`.

Si intentas hacerlo de una, Postgres rechaza la migración a media aplicación y te
deja el esquema en un estado intermedio.

### 9.3 Eliminar un campo — patrón expand/contract

Nunca borres una columna en el mismo despliegue en que dejas de usarla. Si hay
que hacer rollback del código, la columna ya no existe y la versión anterior
revienta.

1. **Expand:** despliega el código que ya no lee ni escribe esa columna. La
   columna sigue en la base.
2. Deja pasar el tiempo suficiente para confirmar que nada la usa (unos días, o
   el ciclo que manejes).
3. **Contract:** migración que la elimina, con respaldo hecho antes.

`migrate deploy` **no advierte** sobre operaciones destructivas: no hay prompt de
confirmación como en `migrate dev`. Por eso el paso 4 de esta guía no es opcional.

### 9.4 Renombrar un campo o una tabla

Prisma genera `DROP COLUMN` + `ADD COLUMN`, lo que **borra los datos**. Hay que
editar el SQL a mano:

```sql
-- Reemplazar lo que generó Prisma por:
ALTER TABLE "mie_miembro" RENAME COLUMN "mie_telefono" TO "mie_telefono_movil";
```

Después de editar, corre `npm run db:verify` para confirmar que el SQL editado
sigue produciendo el esquema que describe `schema.prisma`.

Recuerda que los nombres físicos siguen el estándar del proyecto
(`.agents/skills/database-standards/`): minúsculas, español, `snake_case`,
singular, con prefijo de tres letras.

### 9.5 Si algo sale mal a media migración

`migrate deploy` marca la migración como fallida y se detiene. La base queda con
lo que alcanzó a aplicar.

```bash
npm run db:status                                   # muestra cuál falló
# Corrige el SQL de esa migración, luego:
npx prisma migrate resolve --rolled-back <nombre_migracion>
npx prisma migrate deploy
```

Si el daño ya está hecho, restaura el respaldo del paso 4. Ese es el único
rollback real de datos que existe.

---

## 10. Problemas frecuentes

**`Error opening a TLS connection: self-signed certificate in certificate chain`**
Ocurre en el **runtime**, no en el CLI. El driver `pg` 8.21 trata `sslmode=require`
como `verify-full` (validación completa contra las CA del sistema), y la cadena
del pooler de Supabase no está en ese almacén. El motor del CLI de Prisma usa
semántica libpq, por eso `migrate deploy` sí pasa con `sslmode=require` y la app
no: son dos rutas TLS distintas sobre la misma base.

Comprobado en este proyecto: las dos formas siguientes conectan.

```
?sslmode=require&uselibpqcompat=true    # la que quedó configurada
?sslmode=no-verify                      # equivalente, sintaxis propia de pg
```

Ambas **cifran** el tráfico pero no validan el certificado. Para validarlo de
verdad, descarga el certificado de Supabase (Dashboard → Settings → Database →
SSL Configuration) y usa `?sslmode=verify-full&sslrootcert=/ruta/prod-ca.crt`;
en Vercel el archivo tiene que viajar en el bundle del despliegue.

Sin ningún parámetro `sslmode` el driver abre la conexión **sin TLS**: `pg`
interpreta la ausencia como "sin SSL", no como "SSL opcional". Que la URL lleve
`pgbouncer=true` no ayuda — ese parámetro lo ignora `pg`, solo lo entiende el
motor propio de Prisma.

**`Can't reach database server` con la direct connection**
La direct connection (`db.<ref>.supabase.co`) es solo IPv6 en proyectos nuevos.
Si tu red no tiene IPv6, usa el session pooler en el 5432. Es la causa más común.

**`prepared statement "s0" already exists`**
Estás usando el pooler en modo transacción (6543) para migrar. Cambia
`DIRECT_DATABASE_URL` al 5432.

**`Error: P1002` / advisory lock timeout en `migrate deploy`**
Mismo origen: el 6543 no mantiene la sesión. Usa el 5432.

**La app conecta pero el correo no sale**
Las variables SMTP no viajan solas. Revisa `npm run test:smtp` y la sección 8.

---

## 11. Referencia rápida de comandos

| Comando                       | Qué hace                                         | Seguro en producción |
| ----------------------------- | ------------------------------------------------ | -------------------- |
| `npm run db:status`           | Migraciones aplicadas y pendientes               | Sí (solo lee)        |
| `npm run db:verify`           | Compara la base contra `schema.prisma`           | Sí (solo lee)        |
| `npm run db:deploy`           | Aplica migraciones pendientes                    | Sí, con respaldo     |
| `npm run prisma:seed:minimal` | Catálogos + 1 usuario, idempotente               | Sí, con respaldo     |
| `npm run prisma:migrate`      | `migrate dev` — crea migraciones                 | **No**               |
| `npm run prisma:seed`         | Seed completo con datos de prueba                | **No**               |
| `prisma migrate reset`        | Borra la base                                    | **Nunca**            |
| `prisma db push`              | Sincroniza por diferencia, puede borrar columnas | **Nunca**            |

---

## Apéndice: base de Supabase que ya tiene tablas

Si por alguna razón el esquema ya está aplicado en Supabase sin que Prisma lo
sepa (se corrió `db push`, o se crearon las tablas a mano), `migrate deploy`
fallará al chocar con objetos existentes. En ese caso hay que hacer _baseline_:
marcar las migraciones como ya aplicadas sin ejecutarlas.

```bash
# 1. Confirma que la base coincide con schema.prisma
npm run db:verify        # → No difference detected

# 2. Marca cada migración como aplicada, en orden
npx prisma migrate resolve --applied 20260531004533_init_schema
# … repetir para las 15, en orden cronológico

# 3. Verifica
npm run db:status        # → Database schema is up to date!
```

Si el paso 1 **no** da _No difference detected_, no hagas baseline: la base y el
código no coinciden y hay que resolver esa diferencia primero.
