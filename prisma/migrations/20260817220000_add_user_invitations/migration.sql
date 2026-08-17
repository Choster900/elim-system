-- Store one-time invitations used to authenticate the first access of a system user.
CREATE TABLE "public"."inv_invitacion_usuario" (
    "inv_id" SERIAL NOT NULL,
    "inv_id_usu" INTEGER NOT NULL,
    "inv_resumen_token" VARCHAR(100) NOT NULL,
    "inv_fecha_expiracion" TIMESTAMP(3) NOT NULL,
    "inv_fecha_uso" TIMESTAMP(3),
    "inv_fecha_revocacion" TIMESTAMP(3),
    "inv_id_usu_creador" INTEGER,
    "inv_fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inv_fecha_modificacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pk_inv_invitacion_usuario" PRIMARY KEY ("inv_id"),
    CONSTRAINT "ck_inv_fecha_expiracion" CHECK (
        "inv_fecha_expiracion" > "inv_fecha_creacion"
    )
);

CREATE UNIQUE INDEX "uk_inv_resumen_token"
ON "public"."inv_invitacion_usuario"("inv_resumen_token");

-- Non-unique index names follow the existing local ix_ convention; the 2017 standard does not
-- define names for this kind of index.
CREATE INDEX "ix_inv_usuario"
ON "public"."inv_invitacion_usuario"("inv_id_usu");

CREATE INDEX "ix_inv_fecha_expiracion"
ON "public"."inv_invitacion_usuario"("inv_fecha_expiracion");

CREATE INDEX "ix_inv_usuario_creador"
ON "public"."inv_invitacion_usuario"("inv_id_usu_creador");

ALTER TABLE "public"."inv_invitacion_usuario"
ADD CONSTRAINT "fk_inv_id_usu"
FOREIGN KEY ("inv_id_usu")
REFERENCES "public"."usu_usuario"("usu_id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "public"."inv_invitacion_usuario"
ADD CONSTRAINT "fk_inv_id_usu_creador"
FOREIGN KEY ("inv_id_usu_creador")
REFERENCES "public"."usu_usuario"("usu_id")
ON DELETE SET NULL
ON UPDATE CASCADE;

COMMENT ON TABLE "public"."inv_invitacion_usuario" IS
'Invitación de un solo uso para el primer acceso o restablecimiento de un usuario.';

COMMENT ON COLUMN "public"."inv_invitacion_usuario"."inv_id" IS
'Identificador interno de la invitación.';
COMMENT ON COLUMN "public"."inv_invitacion_usuario"."inv_id_usu" IS
'Usuario destinatario de la invitación.';
COMMENT ON COLUMN "public"."inv_invitacion_usuario"."inv_resumen_token" IS
'Resumen SHA-256 del token secreto enviado por correo.';
COMMENT ON COLUMN "public"."inv_invitacion_usuario"."inv_fecha_expiracion" IS
'Fecha y hora límite para utilizar el token.';
COMMENT ON COLUMN "public"."inv_invitacion_usuario"."inv_fecha_uso" IS
'Fecha y hora en que la invitación fue consumida.';
COMMENT ON COLUMN "public"."inv_invitacion_usuario"."inv_fecha_revocacion" IS
'Fecha y hora en que la invitación fue invalidada.';
COMMENT ON COLUMN "public"."inv_invitacion_usuario"."inv_id_usu_creador" IS
'Administrador que generó la invitación.';
COMMENT ON COLUMN "public"."inv_invitacion_usuario"."inv_fecha_creacion" IS
'Fecha y hora de creación de la invitación.';
COMMENT ON COLUMN "public"."inv_invitacion_usuario"."inv_fecha_modificacion" IS
'Fecha y hora de la última modificación.';
