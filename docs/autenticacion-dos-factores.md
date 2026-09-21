# Verificación en dos pasos

Cada usuario puede configurar su propio método en `/settings`:

- **TOTP:** escanea el QR con una aplicación autenticadora, confirma un código de 6 dígitos y
  guarda los ocho códigos de recuperación. Cada código de recuperación funciona una sola vez.
- **Correo:** confirma el código de 8 dígitos enviado a la dirección de la cuenta. El código vence
  en 5 minutos y tiene un máximo de cinco intentos.
- **Teléfono:** se muestra como opción futura, deshabilitada hasta integrar un proveedor de SMS.

El segundo factor se solicita después de verificar la contraseña. Hasta superar el desafío no se
crean cookies ni sesiones de acceso. Cambiar o desactivar el método cierra las sesiones existentes
y requiere volver a iniciar sesión. Para desactivar TOTP se exige contraseña y TOTP (o un código
de recuperación); para desactivar el método por correo se exige contraseña y un código enviado al
correo. Para cambiar de método, primero se desactiva el actual.

## Preparación del despliegue

La migración `20260921150000_user_multifactor_authentication` agrega los campos y tablas de MFA.
No se aplica automáticamente con `npm run build`. Revísala y aplícala mediante el flujo protegido
de migraciones del proyecto **antes** de publicar el código que usa esos campos:

```powershell
npx prisma migrate deploy
```

La opción por correo requiere las variables SMTP y `MAIL_FROM` configuradas en Vercel. Consulta
[variables de entorno](vercel-variables-entorno.md). La aplicación TOTP funciona sin un proveedor
externo. La hora del servidor y la del teléfono deben estar sincronizadas; se acepta un margen de
un período de 30 segundos a cada lado.

Los secretos TOTP se cifran en la base de datos con AES-256-GCM usando una clave derivada de
`JWT_SECRET`. **Cambiar `JWT_SECRET` deja ilegibles los secretos TOTP configurados**. Antes de rotarlo,
planifica el restablecimiento y nueva inscripción de los usuarios TOTP. Los códigos de correo y
recuperación se almacenan como resúmenes HMAC, no en texto plano.

La migración reinicia el antiguo indicador `usu_doble_factor`: antes era un booleano editable por
administración, sin un segundo factor operativo. A partir de este cambio refleja el método que
el usuario activó y confirmó. El prefijo existente `usu` se conserva; las tablas nuevas usan
`dfa` (desafío de factor) y `crf` (código de recuperación de factor). Los índices no únicos siguen
la convención local `ix_`, aún no definida por el estándar de base de datos 2017.

No se han añadido mensajes SMS ni enlaces de activación por teléfono.
