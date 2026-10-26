CREATE TABLE "die_diezmo" (
    "die_id" SERIAL NOT NULL,
    "die_id_mie" INTEGER NOT NULL,
    "die_monto" DECIMAL(19,2) NOT NULL,
    "die_fecha" DATE NOT NULL,
    "die_nota" VARCHAR(300),
    "die_id_usu_receptor" INTEGER,
    "die_fecha_recepcion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "die_id_usu_modificacion" INTEGER,
    "die_fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "die_fecha_modificacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pk_die_diezmo" PRIMARY KEY ("die_id"),
    CONSTRAINT "ck_die_monto" CHECK ("die_monto" > 0)
);

CREATE INDEX "ix_die_fecha" ON "die_diezmo"("die_fecha");

CREATE INDEX "ix_die_miembro" ON "die_diezmo"("die_id_mie");

CREATE INDEX "ix_die_usuario_receptor" ON "die_diezmo"("die_id_usu_receptor");

ALTER TABLE "die_diezmo" ADD CONSTRAINT "fk_die_id_mie" FOREIGN KEY ("die_id_mie") REFERENCES "mie_miembro"("mie_id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "die_diezmo" ADD CONSTRAINT "fk_die_id_usu_receptor" FOREIGN KEY ("die_id_usu_receptor") REFERENCES "usu_usuario"("usu_id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "die_diezmo" ADD CONSTRAINT "fk_die_id_usu_modificacion" FOREIGN KEY ("die_id_usu_modificacion") REFERENCES "usu_usuario"("usu_id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMENT ON TABLE "public"."die_diezmo" IS 'Sobre de diezmo entregado por un miembro y recibido por el comité de apoyo.';
COMMENT ON COLUMN "public"."die_diezmo"."die_id" IS 'Identificador interno del diezmo.';
COMMENT ON COLUMN "public"."die_diezmo"."die_id_mie" IS 'Miembro que entregó el sobre de diezmo.';
COMMENT ON COLUMN "public"."die_diezmo"."die_monto" IS 'Monto en dólares que trae el sobre; siempre mayor que cero.';
COMMENT ON COLUMN "public"."die_diezmo"."die_fecha" IS 'Día al que corresponde el diezmo según el comité.';
COMMENT ON COLUMN "public"."die_diezmo"."die_nota" IS 'Observación opcional del comité sobre el sobre.';
COMMENT ON COLUMN "public"."die_diezmo"."die_id_usu_receptor" IS 'Usuario del comité que registró el sobre.';
COMMENT ON COLUMN "public"."die_diezmo"."die_fecha_recepcion" IS 'Momento en que el comité registró el sobre.';
COMMENT ON COLUMN "public"."die_diezmo"."die_id_usu_modificacion" IS 'Usuario que corrigió el registro por última vez.';
COMMENT ON COLUMN "public"."die_diezmo"."die_fecha_creacion" IS 'Fecha de creación del registro.';
COMMENT ON COLUMN "public"."die_diezmo"."die_fecha_modificacion" IS 'Fecha de la última modificación del registro.';
