-- Store one-time password recovery links requested by system users.
CREATE TABLE "public"."rcu_recuperacion_clave_usuario" (
    "rcu_id" SERIAL NOT NULL,
    "rcu_id_usu" INTEGER NOT NULL,
    "rcu_resumen_token" VARCHAR(100) NOT NULL,
    "rcu_fecha_expiracion" TIMESTAMP(3) NOT NULL,
    "rcu_fecha_uso" TIMESTAMP(3),
    "rcu_fecha_revocacion" TIMESTAMP(3),
    "rcu_fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rcu_fecha_modificacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pk_rcu_recuperacion_clave_usuario" PRIMARY KEY ("rcu_id"),
    CONSTRAINT "ck_rcu_fecha_expiracion" CHECK (
        "rcu_fecha_expiracion" > "rcu_fecha_creacion"
    )
);

CREATE UNIQUE INDEX "uk_rcu_resumen_token"
ON "public"."rcu_recuperacion_clave_usuario"("rcu_resumen_token");

-- Non-unique index names follow the existing local ix_ convention; the 2017 standard does not
-- define names for this kind of index.
CREATE INDEX "ix_rcu_usuario"
ON "public"."rcu_recuperacion_clave_usuario"("rcu_id_usu");

CREATE INDEX "ix_rcu_fecha_expiracion"
ON "public"."rcu_recuperacion_clave_usuario"("rcu_fecha_expiracion");

ALTER TABLE "public"."rcu_recuperacion_clave_usuario"
ADD CONSTRAINT "fk_rcu_id_usu"
FOREIGN KEY ("rcu_id_usu")
REFERENCES "public"."usu_usuario"("usu_id")
ON DELETE CASCADE
ON UPDATE CASCADE;

COMMENT ON TABLE "public"."rcu_recuperacion_clave_usuario" IS
'Recuperación de contraseña de un solo uso solicitada por un usuario del sistema.';

COMMENT ON COLUMN "public"."rcu_recuperacion_clave_usuario"."rcu_id" IS
'Identificador interno de la recuperación de contraseña.';
COMMENT ON COLUMN "public"."rcu_recuperacion_clave_usuario"."rcu_id_usu" IS
'Usuario que solicitó recuperar su contraseña.';
COMMENT ON COLUMN "public"."rcu_recuperacion_clave_usuario"."rcu_resumen_token" IS
'Resumen SHA-256 del token secreto enviado por correo.';
COMMENT ON COLUMN "public"."rcu_recuperacion_clave_usuario"."rcu_fecha_expiracion" IS
'Fecha y hora límite para utilizar el enlace de recuperación.';
COMMENT ON COLUMN "public"."rcu_recuperacion_clave_usuario"."rcu_fecha_uso" IS
'Fecha y hora en que el token fue consumido.';
COMMENT ON COLUMN "public"."rcu_recuperacion_clave_usuario"."rcu_fecha_revocacion" IS
'Fecha y hora en que el token fue invalidado.';
COMMENT ON COLUMN "public"."rcu_recuperacion_clave_usuario"."rcu_fecha_creacion" IS
'Fecha y hora de creación de la recuperación.';
COMMENT ON COLUMN "public"."rcu_recuperacion_clave_usuario"."rcu_fecha_modificacion" IS
'Fecha y hora de la última modificación.';
