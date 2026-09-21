# Variables de entorno en Vercel

Ejecuta estos comandos en **PowerShell**, desde la raíz de este repositorio. La CLI solicita el
valor de cada variable de forma interactiva: escribe los secretos cuando aparezca el prompt, sin
ponerlos en el comando ni guardarlos en este archivo.

## Preparar la CLI y enlazar el proyecto

```powershell
npx vercel login
npx vercel whoami
npx vercel link
```

En `vercel link`, selecciona el equipo y el proyecto que sirve `elim-system.vercel.app`.
Confirma el proyecto enlazado antes de modificar variables:

```powershell
Get-Content .vercel/project.json
npx vercel env ls production
```

## Agregar variables a Production

Usa `env add` cuando la variable todavía no existe en ese entorno. Cada comando pedirá el valor.
Las variables con `--sensitive` ocultan su valor en el panel de Vercel.

```powershell
npx vercel env add DATABASE_URL production --sensitive
npx vercel env add JWT_SECRET production --sensitive
npx vercel env add NUXT_PUBLIC_APP_NAME production
npx vercel env add APP_BASE_URL production

npx vercel env add SMTP_HOST production
npx vercel env add SMTP_PORT production
npx vercel env add SMTP_SECURE production
npx vercel env add SMTP_USER production --sensitive
npx vercel env add SMTP_PASSWORD production --sensitive
npx vercel env add MAIL_FROM production

npx vercel env add USER_INVITATION_TTL_HOURS production
npx vercel env add PASSWORD_RESET_TTL_HOURS production
```

Para `APP_BASE_URL`, usa `https://elim-system.vercel.app` mientras ese sea el dominio público de
la aplicación. `DATABASE_URL` debe apuntar a PostgreSQL accesible desde Vercel. Las variables
SMTP deben corresponder a un proveedor real; los valores locales de Mailpit no funcionan allí.
`JWT_SECRET` necesita al menos 32 caracteres.

## Actualizar variables existentes

Usa `env update` para cambiar una variable ya creada. La CLI pedirá el nuevo valor. Ejemplos:

```powershell
npx vercel env update DATABASE_URL production
npx vercel env update JWT_SECRET production
npx vercel env update APP_BASE_URL production
npx vercel env update SMTP_PASSWORD production
```

La forma general es:

```powershell
npx vercel env update NOMBRE production
```

Para comprobar qué claves están configuradas, sin descargar sus valores:

```powershell
npx vercel env ls production
```

## Preview y Development

Repite los comandos con `preview` o `development` como entorno. Usa una base de datos, un secreto
JWT y credenciales SMTP distintos para Preview. Por ejemplo:

```powershell
npx vercel env add DATABASE_URL preview --sensitive
npx vercel env add JWT_SECRET preview --sensitive
npx vercel env add APP_BASE_URL preview
npx vercel env update DATABASE_URL preview
npx vercel env ls preview
npx vercel env ls development
```

Las variables `--sensitive` solo están disponibles para Production y Preview. Para descargar las
variables de Development a un archivo local ignorado por Git:

```powershell
npx vercel env pull .env.local --environment=development
```

`env pull` reemplaza el contenido del archivo de destino. No descargues variables de Production
si no necesitas tener esos secretos en tu equipo.

## Aplicar los cambios

Los cambios de variables se aplican a **despliegues nuevos**, no al que ya está publicado. Tras
agregar o actualizar una variable, crea un nuevo despliegue desde la integración Git o desde
**Vercel > Deployments > Redeploy**. Si deseas desplegar el código local directamente a Production:

```powershell
npx vercel --prod
```

Antes de ese último comando, revisa que el código local sea exactamente el que quieres publicar.

## Variables que no suelen subirse a Vercel

- `PORT` y `NODE_ENV`: los gestiona la plataforma.
- `SEED_ADMIN_*` y `SEED_ALLOW_REMOTE`: son para tareas de seed, no para servir la aplicación.
- `SHADOW_DATABASE_URL`: es solo para migraciones de desarrollo sobre una base desechable.
- `DIRECT_DATABASE_URL`: se usa con Prisma CLI para migraciones; no la necesita la aplicación en
  ejecución normal. Configúrala únicamente en el entorno seguro donde correrás migraciones.

Consulta también [README-VERCEL.md](../README-VERCEL.md) para el proceso de despliegue completo.

## Fuentes oficiales

- [Vercel CLI: `env`](https://vercel.com/docs/cli/env)
- [Administrar variables entre entornos](https://vercel.com/docs/environment-variables/manage-across-environments)
- [Administrar variables de entorno](https://vercel.com/docs/environment-variables/managing-environment-variables)
