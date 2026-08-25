# Despliegue seguro en Vercel

Esta guía explica cómo desplegar esta aplicación Nuxt 4/Nitro en Vercel sin publicar
credenciales y cómo configurar las variables de entorno que no viajan con el repositorio.

> [!IMPORTANT]
> No elimines `.env` del `.gitignore` ni copies sus valores al código. Vercel no recibe los
> archivos `.env` ignorados por Git: las variables deben cargarse en Vercel antes del primer
> build. Si un secreto fue incluido alguna vez en un commit, ignorar el archivo después no lo
> elimina del historial; rota el secreto y limpia el historial por separado.

## Requisitos

- Repositorio alojado en GitHub, GitLab o Bitbucket.
- Proyecto y cuenta de Vercel con acceso limitado a las personas necesarias.
- Base de datos PostgreSQL administrada, accesible desde Vercel y protegida con TLS.
- Servidor SMTP real si se usarán invitaciones por correo. `127.0.0.1:1025` solo sirve para
  Mailpit en desarrollo local.
- Migraciones de `prisma/migrations/` revisadas y confirmadas en Git.

## Variables de entorno del proyecto

La lista se obtiene de `.env.example` y `config/env.ts`. Los valores siguientes son ejemplos;
no deben copiarse literalmente a producción.

### Obligatorias

| Variable               | Entornos             | Sensible | Descripción                                                                                                            |
| ---------------------- | -------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`         | Production y Preview | Sí       | URL PostgreSQL completa. Usa credenciales distintas y, preferiblemente, bases distintas para Production y Preview.     |
| `JWT_SECRET`           | Production y Preview | Sí       | Secreto aleatorio de al menos 32 caracteres. Debe ser diferente por entorno. Cambiarlo cierra las sesiones existentes. |
| `NUXT_PUBLIC_APP_NAME` | Production y Preview | No       | Nombre visible de la aplicación. Por llevar `NUXT_PUBLIC_`, puede quedar expuesto al navegador.                        |

Puedes generar un `JWT_SECRET` fuerte sin depender de un generador web:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Guarda el resultado directamente en un gestor de contraseñas y en Vercel. No lo pegues en
chats, tickets, capturas, logs ni archivos versionados.

### Recomendadas para producción

| Variable                    | Sensible | Valor esperado                                                                                                               |
| --------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `APP_BASE_URL`              | No       | URL pública exacta, por ejemplo `https://app.example.com`. Se usa para construir los enlaces de invitación.                  |
| `SMTP_HOST`                 | No       | Host del proveedor SMTP, nunca `127.0.0.1` en Vercel.                                                                        |
| `SMTP_PORT`                 | No       | Puerto del proveedor, normalmente `465` o `587`.                                                                             |
| `SMTP_SECURE`               | No       | `true` para TLS directo, normalmente puerto 465; `false` para STARTTLS, normalmente 587. Confirma el valor con el proveedor. |
| `SMTP_USER`                 | Sí       | Usuario SMTP.                                                                                                                |
| `SMTP_PASSWORD`             | Sí       | Contraseña o token SMTP.                                                                                                     |
| `MAIL_FROM`                 | No       | Remitente autorizado, por ejemplo `Elim <no-reply@example.com>`. El dominio debe estar verificado con el proveedor.          |
| `USER_INVITATION_TTL_HOURS` | No       | Vigencia de la invitación entre 1 y 168 horas. El valor predeterminado es `24`.                                              |

Si todavía no se utilizarán invitaciones por correo, las variables SMTP tienen valores
predeterminados, pero cualquier intento de enviar correo fallará en Vercel hasta configurar un
proveedor real.

### No configurar como variables normales de la aplicación

- `PORT` y `NODE_ENV`: Vercel controla ambos valores durante el build y la ejecución.
- `SEED_ADMIN_EMAIL`, `SEED_ADMIN_USERNAME` y `SEED_ADMIN_PASSWORD`: solo los lee
  `npm run prisma:seed`. No son necesarias para servir la aplicación. Si se ejecuta el seed,
  proporciona credenciales temporales fuertes y cambia inmediatamente la contraseña inicial.
- Variables `VERCEL_*` o `NUXT_ENV_VERCEL_*`: Vercel puede inyectarlas automáticamente; no
  reemplazan ninguna variable requerida en las tablas anteriores.

## 1. Preparar la base de datos

1. Crea una base para producción y otra aislada para previews/staging.
2. Crea usuarios PostgreSQL distintos y concédeles solo los permisos necesarios.
3. Exige TLS y limita el acceso desde el panel del proveedor cuando sea posible.
4. Guarda cada URL como `DATABASE_URL` únicamente en su entorno correspondiente de Vercel.
5. Conserva copias de seguridad y prueba la restauración antes de aplicar migraciones
   destructivas.

Nunca asignes la base de producción al entorno Preview. Cada rama y pull request puede generar
un deployment de preview y ejecutar código todavía no aprobado.

## 2. Importar el proyecto

1. En Vercel, selecciona **Add New > Project** e importa el repositorio.
2. Confirma que el framework detectado sea **Nuxt.js** y que **Root Directory** sea la raíz del
   repositorio.
3. Usa Node.js 22 para mantener paridad con el `Dockerfile` del proyecto.
4. Mantén la salida administrada por el preset de Nuxt/Vercel; no configures `.output/` como
   directorio estático.
5. En **Build Command**, usa:

    ```bash
    npm run prisma:generate && npm run build
    ```

    Generar Prisma en cada build evita reutilizar un cliente desactualizado desde la caché de
    dependencias. No agregues `prisma migrate dev`, `prisma db push` ni el seed al build.

## 3. Cargar las variables en Vercel

Antes del primer deployment, abre **Project > Settings > Environment Variables**.

1. Carga primero las variables de **Production**.
2. Marca `DATABASE_URL`, `JWT_SECRET`, `SMTP_USER` y `SMTP_PASSWORD` como **Sensitive**.
3. Carga valores diferentes para **Preview**; usa una base y una cuenta SMTP de pruebas.
4. Carga en **Development** solo valores de desarrollo que el equipo deba sincronizar. Vercel
   no permite marcar como Sensitive las variables de Development, porque pueden descargarse.
5. Revisa que ninguna variable secreta comience con `NUXT_PUBLIC_`.

Las modificaciones de variables solo se aplican a deployments nuevos. Después de agregar,
cambiar o rotar una variable, crea un redeploy; el deployment anterior conserva su configuración.

### Alternativa con Vercel CLI

Ejecuta los comandos desde la raíz. La CLI solicita los valores de forma interactiva, lo que
evita escribir secretos en el historial de la terminal:

```bash
npx vercel link
npx vercel env add DATABASE_URL production --sensitive
npx vercel env add JWT_SECRET production --sensitive
npx vercel env add NUXT_PUBLIC_APP_NAME production
npx vercel env add APP_BASE_URL production
npx vercel env ls production
```

Repite las claves necesarias para `preview` usando valores aislados:

```bash
npx vercel env add DATABASE_URL preview --sensitive
npx vercel env add JWT_SECRET preview --sensitive
npx vercel env add NUXT_PUBLIC_APP_NAME preview
npx vercel env add APP_BASE_URL preview
npx vercel env ls preview
```

No uses `echo "secreto" | vercel env add ...`: el valor puede quedar en el historial o en logs.
Para desarrollo local se puede descargar el entorno Development, que se guarda en texto plano:

```bash
npx vercel env pull .env.local --environment=development
```

`.env.local` y `.vercel/` ya están ignorados por Git. Aun así, protege el equipo local y elimina
el archivo cuando ya no sea necesario. Para una ejecución puntual sin escribir secretos en disco:

```bash
npx vercel env run -e development -- npm run dev
```

## 4. Aplicar migraciones Prisma

El build solo genera Prisma Client; no modifica el esquema de la base. Cuando un release incluya
migraciones:

1. Revisa el SQL en `prisma/migrations/` y crea un backup.
2. Prueba primero `npx prisma migrate deploy` contra la base aislada de Preview/staging.
3. Ejecuta `npx prisma migrate deploy` una sola vez contra Production desde un pipeline protegido
   con aprobación manual y secretos restringidos.
4. Despliega o promueve exactamente el commit compatible con esa migración.

En producción usa solamente `prisma migrate deploy`. `prisma migrate dev`, `prisma db push` y
`prisma migrate reset` no forman parte de un despliegue seguro. Tampoco ejecutes migraciones en
cada build de Preview: varios builds simultáneos pueden competir y una Preview nunca debe alterar
la base de Production.

## 5. Desplegar y promover

Con la integración Git, una rama distinta de la rama de producción crea una Preview. También se
puede crear desde la CLI:

```bash
npx vercel
```

Valida esa URL antes de promoverla:

- `GET /api/healthcheck` responde correctamente.
- La página de login carga y una sesión funciona.
- Las operaciones de lectura y escritura usan la base de Preview.
- Un correo de invitación llega al buzón de pruebas y apunta a la URL correcta.
- Los logs no muestran credenciales, tokens, contraseñas temporales ni datos personales.

Después de aprobar la Preview, fusiona el cambio a la rama de producción o promueve ese
deployment. Al promover una Preview, Vercel vuelve a construir el mismo código con las variables
de Production:

```bash
npx vercel promote <deployment-url>
```

Para un deployment directo de producción, reservado para usuarios autorizados:

```bash
npx vercel --prod
```

## 6. Controles posteriores

1. Configura el dominio definitivo y actualiza `APP_BASE_URL` con `https://`; luego redeploya.
2. Activa **Deployment Protection** para Preview y conserva la protección de pull requests desde
   forks.
3. Restringe los roles del equipo de Vercel y de la base de datos siguiendo mínimo privilegio.
4. Revisa Build Logs y Runtime Logs sin imprimir `process.env` ni objetos de configuración.
5. Configura alertas, backups y rotación periódica de `JWT_SECRET`, credenciales PostgreSQL y SMTP.
6. Conserva el deployment anterior para rollback. Si el release falla:

    ```bash
    npx vercel rollback
    ```

    Un rollback de Vercel no revierte migraciones de base de datos. Las migraciones deben diseñarse
    para ser compatibles con el release anterior o contar con un plan de reversión probado.

## Solución de problemas

### `Environment validation failed`

Falta `DATABASE_URL`, `JWT_SECRET` o `NUXT_PUBLIC_APP_NAME`, el JWT tiene menos de 32 caracteres o
la URL de PostgreSQL no es válida. Corrige el entorno afectado y crea un deployment nuevo.

### Funciona localmente, pero no en Vercel

El `.env` local no se sube. Comprueba **Settings > Environment Variables**, el alcance
Production/Preview y que se haya desplegado de nuevo después del cambio.

### Prisma Client está desactualizado

Confirma que el Build Command ejecute `npm run prisma:generate && npm run build` y fuerza un nuevo
deployment si el build anterior reutilizó caché.

### La aplicación no conecta a PostgreSQL

Comprueba TLS, credenciales, restricciones de red, límites de conexiones y que `DATABASE_URL`
pertenezca al entorno correcto. No muestres la URL completa en tickets o logs; redacta usuario,
contraseña, host y parámetros sensibles.

### No llegan invitaciones

Revisa la configuración SMTP, la verificación del dominio remitente y `APP_BASE_URL`. Los valores
locales de Mailpit no funcionan desde Vercel.

## Checklist de salida a producción

- [ ] `.env`, `.env.local` y `.vercel/` continúan ignorados por Git.
- [ ] No hay secretos en commits, historial, código, capturas ni logs.
- [ ] Production y Preview usan bases, JWT y SMTP separados.
- [ ] Las variables secretas de Production/Preview están marcadas como Sensitive.
- [ ] `APP_BASE_URL` usa el dominio final con HTTPS.
- [ ] Prisma Client se genera durante el build.
- [ ] Las migraciones se probaron, respaldaron y aplicaron mediante un paso controlado.
- [ ] Healthcheck, autenticación, base de datos y correo fueron verificados.
- [ ] Preview tiene Deployment Protection y el equipo aplica mínimo privilegio.
- [ ] Existe un plan probado de rollback de aplicación y recuperación de base de datos.

## Referencias oficiales

- [Nuxt en Vercel](https://vercel.com/docs/frameworks/full-stack/nuxt)
- [Variables de entorno de Vercel](https://vercel.com/docs/environment-variables)
- [Variables sensibles](https://vercel.com/docs/environment-variables/sensitive-environment-variables)
- [Vercel CLI: variables de entorno](https://vercel.com/docs/cli/env)
- [Promover una Preview a Production](https://vercel.com/docs/deployments/promote-preview-to-production)
- [Prisma en Vercel](https://www.prisma.io/docs/orm/prisma-client/deployment/serverless/deploy-to-vercel)
- [`prisma migrate deploy`](https://www.prisma.io/docs/cli/migrate/deploy)
