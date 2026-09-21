-- Métodos y desafíos de segundo factor para cuentas del sistema.
CREATE TYPE "public"."emu_metodo_doble_factor" AS ENUM ('ninguno', 'totp', 'correo');
CREATE TYPE "public"."edf_destino_factor" AS ENUM ('ingreso', 'activar_correo', 'desactivar_correo', 'desactivar_totp');

ALTER TABLE "public"."usu_usuario"
ADD COLUMN "usu_metodo_doble_factor" "public"."emu_metodo_doble_factor" NOT NULL DEFAULT 'ninguno',
ADD COLUMN "usu_secreto_totp" VARCHAR(300),
ADD COLUMN "usu_secreto_totp_pendiente" VARCHAR(300),
ADD COLUMN "usu_fecha_expiracion_totp_pendiente" TIMESTAMP(3),
ADD COLUMN "usu_paso_totp_ultimo" INTEGER,
ADD COLUMN "usu_version_doble_factor" INTEGER NOT NULL DEFAULT 0;

-- El indicador anterior no configuraba un factor real; se reinicia para reflejar el método activo.
UPDATE "public"."usu_usuario" SET "usu_doble_factor" = FALSE;

CREATE TABLE "public"."dfa_desafio_factor" (
    "dfa_id" SERIAL NOT NULL,
    "dfa_id_usu" INTEGER NOT NULL,
    "dfa_resumen_token" VARCHAR(100) NOT NULL,
    "dfa_resumen_codigo" VARCHAR(100),
    "dfa_destino" "public"."edf_destino_factor" NOT NULL,
    "dfa_intento" INTEGER NOT NULL DEFAULT 0,
    "dfa_fecha_expiracion" TIMESTAMP(3) NOT NULL,
    "dfa_fecha_uso" TIMESTAMP(3),
    "dfa_fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pk_dfa_desafio_factor" PRIMARY KEY ("dfa_id"),
    CONSTRAINT "ck_dfa_intento" CHECK ("dfa_intento" >= 0),
    CONSTRAINT "ck_dfa_fecha_expiracion" CHECK ("dfa_fecha_expiracion" > "dfa_fecha_creacion")
);

CREATE TABLE "public"."crf_codigo_recuperacion_factor" (
    "crf_id" SERIAL NOT NULL,
    "crf_id_usu" INTEGER NOT NULL,
    "crf_resumen_codigo" VARCHAR(100) NOT NULL,
    "crf_fecha_uso" TIMESTAMP(3),
    "crf_fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pk_crf_codigo_recuperacion_factor" PRIMARY KEY ("crf_id")
);

CREATE UNIQUE INDEX "uk_dfa_resumen_token" ON "public"."dfa_desafio_factor"("dfa_resumen_token");
CREATE UNIQUE INDEX "uk_crf_resumen_codigo" ON "public"."crf_codigo_recuperacion_factor"("crf_resumen_codigo");

-- ix_ es la convención local para índices no únicos; el estándar 2017 no los define.
CREATE INDEX "ix_dfa_usuario_fecha" ON "public"."dfa_desafio_factor"("dfa_id_usu", "dfa_fecha_creacion");
CREATE INDEX "ix_dfa_fecha_expiracion" ON "public"."dfa_desafio_factor"("dfa_fecha_expiracion");
CREATE INDEX "ix_crf_usuario" ON "public"."crf_codigo_recuperacion_factor"("crf_id_usu");

ALTER TABLE "public"."dfa_desafio_factor"
ADD CONSTRAINT "fk_dfa_id_usu" FOREIGN KEY ("dfa_id_usu")
REFERENCES "public"."usu_usuario"("usu_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."crf_codigo_recuperacion_factor"
ADD CONSTRAINT "fk_crf_id_usu" FOREIGN KEY ("crf_id_usu")
REFERENCES "public"."usu_usuario"("usu_id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMENT ON TABLE "public"."dfa_desafio_factor" IS 'Desafío de un solo uso para ingreso o cambio de factor por correo.';
COMMENT ON COLUMN "public"."dfa_desafio_factor"."dfa_id" IS 'Identificador interno del desafío.';
COMMENT ON COLUMN "public"."dfa_desafio_factor"."dfa_id_usu" IS 'Usuario que debe verificar el segundo factor.';
COMMENT ON COLUMN "public"."dfa_desafio_factor"."dfa_resumen_token" IS 'Resumen del identificador público del desafío.';
COMMENT ON COLUMN "public"."dfa_desafio_factor"."dfa_resumen_codigo" IS 'Resumen HMAC del código enviado por correo.';
COMMENT ON COLUMN "public"."dfa_desafio_factor"."dfa_destino" IS 'Operación autorizada por el desafío.';
COMMENT ON COLUMN "public"."dfa_desafio_factor"."dfa_intento" IS 'Cantidad de verificaciones fallidas.';
COMMENT ON COLUMN "public"."dfa_desafio_factor"."dfa_fecha_expiracion" IS 'Fecha límite para verificar el desafío.';
COMMENT ON COLUMN "public"."dfa_desafio_factor"."dfa_fecha_uso" IS 'Fecha en que se consumió el desafío.';
COMMENT ON COLUMN "public"."dfa_desafio_factor"."dfa_fecha_creacion" IS 'Fecha de creación del desafío.';

COMMENT ON TABLE "public"."crf_codigo_recuperacion_factor" IS 'Código de recuperación TOTP de un solo uso.';
COMMENT ON COLUMN "public"."crf_codigo_recuperacion_factor"."crf_id" IS 'Identificador interno del código.';
COMMENT ON COLUMN "public"."crf_codigo_recuperacion_factor"."crf_id_usu" IS 'Propietario del código.';
COMMENT ON COLUMN "public"."crf_codigo_recuperacion_factor"."crf_resumen_codigo" IS 'Resumen HMAC del código de recuperación.';
COMMENT ON COLUMN "public"."crf_codigo_recuperacion_factor"."crf_fecha_uso" IS 'Fecha en que se consumió el código.';
COMMENT ON COLUMN "public"."crf_codigo_recuperacion_factor"."crf_fecha_creacion" IS 'Fecha de creación del código.';

COMMENT ON COLUMN "public"."usu_usuario"."usu_metodo_doble_factor" IS 'Método activo de segundo factor.';
COMMENT ON COLUMN "public"."usu_usuario"."usu_secreto_totp" IS 'Secreto TOTP cifrado con AES-256-GCM.';
COMMENT ON COLUMN "public"."usu_usuario"."usu_secreto_totp_pendiente" IS 'Secreto TOTP pendiente de confirmar.';
COMMENT ON COLUMN "public"."usu_usuario"."usu_fecha_expiracion_totp_pendiente" IS 'Vencimiento de la configuración TOTP pendiente.';
COMMENT ON COLUMN "public"."usu_usuario"."usu_paso_totp_ultimo" IS 'Último período TOTP usado.';
COMMENT ON COLUMN "public"."usu_usuario"."usu_version_doble_factor" IS 'Versión que invalida tokens previos al cambio de factor.';
