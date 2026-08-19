-- Desglose de la asistencia por tipo de persona.
-- Mismo patrón que las categorías de ofrenda: un catálogo y un detalle por ocurrencia.

CREATE TABLE "tas_tipo_asistencia" (
    "tas_id" SERIAL NOT NULL,
    "tas_codigo" VARCHAR(100) NOT NULL,
    "tas_nombre" VARCHAR(100) NOT NULL,
    "tas_descripcion" VARCHAR(300),
    "tas_activo" BOOLEAN NOT NULL DEFAULT true,
    "tas_orden" INTEGER NOT NULL DEFAULT 0,
    "tas_fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tas_fecha_modificacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pk_tas_tipo_asistencia" PRIMARY KEY ("tas_id")
);

CREATE UNIQUE INDEX "uk_tas_codigo" ON "tas_tipo_asistencia" ("tas_codigo");
CREATE UNIQUE INDEX "uk_tas_nombre" ON "tas_tipo_asistencia" ("tas_nombre");
CREATE INDEX "ix_tas_activo" ON "tas_tipo_asistencia" ("tas_activo");

COMMENT ON TABLE "tas_tipo_asistencia" IS 'Catálogo de tipos de asistencia a una reunión.';

CREATE TABLE "dea_detalle_asistencia" (
    "dea_id" SERIAL NOT NULL,
    "dea_id_reo" INTEGER NOT NULL,
    "dea_id_tas" INTEGER NOT NULL,
    "dea_cantidad" INTEGER NOT NULL,
    "dea_nota" VARCHAR(300),
    "dea_fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dea_fecha_modificacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pk_dea_detalle_asistencia" PRIMARY KEY ("dea_id"),
    CONSTRAINT "ck_dea_cantidad" CHECK ("dea_cantidad" >= 0)
);

CREATE UNIQUE INDEX "uk_dea_ocurrencia_tipo" ON "dea_detalle_asistencia" ("dea_id_reo", "dea_id_tas");
CREATE INDEX "ix_dea_ocurrencia" ON "dea_detalle_asistencia" ("dea_id_reo");
CREATE INDEX "ix_dea_tipo" ON "dea_detalle_asistencia" ("dea_id_tas");

ALTER TABLE "dea_detalle_asistencia"
    ADD CONSTRAINT "fk_dea_id_reo" FOREIGN KEY ("dea_id_reo") REFERENCES "reo_reunion_ocurrencia" ("reo_id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "fk_dea_id_tas" FOREIGN KEY ("dea_id_tas") REFERENCES "tas_tipo_asistencia" ("tas_id") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMENT ON TABLE "dea_detalle_asistencia" IS 'Cuántas personas de cada tipo asistieron a una fecha concreta.';
COMMENT ON COLUMN "dea_detalle_asistencia"."dea_cantidad" IS 'Personas de ese tipo; el total de la ocurrencia es la suma de sus detalles.';

-- Catálogo inicial. El orden es el que se verá en la pantalla de captura.
INSERT INTO "tas_tipo_asistencia"
    ("tas_codigo", "tas_nombre", "tas_descripcion", "tas_orden", "tas_fecha_modificacion")
VALUES
    ('HERMANOS', 'Hermanos', 'Miembros de la iglesia.', 1, CURRENT_TIMESTAMP),
    ('AMIGOS', 'Amigos', 'Visitas que ya asisten con regularidad.', 2, CURRENT_TIMESTAMP),
    ('NUEVOS', 'Nuevos', 'Personas que asisten por primera vez.', 3, CURRENT_TIMESTAMP),
    ('NINOS', 'Niños', 'Menores de edad.', 4, CURRENT_TIMESTAMP),
    ('JOVENES', 'Jóvenes', 'Ministerio juvenil.', 5, CURRENT_TIMESTAMP);
