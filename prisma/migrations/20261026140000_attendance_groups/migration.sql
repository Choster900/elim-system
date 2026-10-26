DROP INDEX "uk_tas_nombre";

ALTER TABLE "tas_tipo_asistencia" ADD COLUMN     "tas_id_gas" INTEGER;

CREATE TABLE "gas_grupo_asistencia" (
    "gas_id" SERIAL NOT NULL,
    "gas_codigo" VARCHAR(100) NOT NULL,
    "gas_nombre" VARCHAR(100) NOT NULL,
    "gas_descripcion" VARCHAR(300),
    "gas_suma_asistencia" BOOLEAN NOT NULL DEFAULT true,
    "gas_activo" BOOLEAN NOT NULL DEFAULT true,
    "gas_orden" INTEGER NOT NULL DEFAULT 0,
    "gas_fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gas_fecha_modificacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pk_gas_grupo_asistencia" PRIMARY KEY ("gas_id")
);

CREATE UNIQUE INDEX "uk_gas_codigo" ON "gas_grupo_asistencia"("gas_codigo");

CREATE UNIQUE INDEX "uk_gas_nombre" ON "gas_grupo_asistencia"("gas_nombre");

CREATE INDEX "ix_gas_activo" ON "gas_grupo_asistencia"("gas_activo");

CREATE INDEX "ix_tas_grupo" ON "tas_tipo_asistencia"("tas_id_gas");

CREATE UNIQUE INDEX "uk_tas_grupo_nombre" ON "tas_tipo_asistencia"("tas_id_gas", "tas_nombre");

ALTER TABLE "tas_tipo_asistencia" ADD CONSTRAINT "fk_tas_id_gas" FOREIGN KEY ("tas_id_gas") REFERENCES "gas_grupo_asistencia"("gas_id") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMENT ON TABLE "public"."gas_grupo_asistencia" IS 'Agrupación de los tipos de asistencia que se capturan juntos, como Niños, Jóvenes, Adultos o Resultados.';
COMMENT ON COLUMN "public"."gas_grupo_asistencia"."gas_id" IS 'Identificador interno del grupo de asistencia.';
COMMENT ON COLUMN "public"."gas_grupo_asistencia"."gas_codigo" IS 'Código único del grupo de asistencia.';
COMMENT ON COLUMN "public"."gas_grupo_asistencia"."gas_nombre" IS 'Nombre visible del grupo de asistencia.';
COMMENT ON COLUMN "public"."gas_grupo_asistencia"."gas_descripcion" IS 'Descripción del grupo de asistencia.';
COMMENT ON COLUMN "public"."gas_grupo_asistencia"."gas_suma_asistencia" IS 'Indica si las cantidades de sus tipos suman a la asistencia total de la reunión; los resultados no suman.';
COMMENT ON COLUMN "public"."gas_grupo_asistencia"."gas_activo" IS 'Indica si el grupo se ofrece al registrar asistencia.';
COMMENT ON COLUMN "public"."gas_grupo_asistencia"."gas_orden" IS 'Orden en que se presenta el grupo al registrar asistencia.';
COMMENT ON COLUMN "public"."gas_grupo_asistencia"."gas_fecha_creacion" IS 'Fecha de creación del registro.';
COMMENT ON COLUMN "public"."gas_grupo_asistencia"."gas_fecha_modificacion" IS 'Fecha de la última modificación del registro.';
COMMENT ON COLUMN "public"."tas_tipo_asistencia"."tas_id_gas" IS 'Grupo al que pertenece el tipo de asistencia; nulo en los tipos anteriores a la agrupación.';

INSERT INTO "gas_grupo_asistencia" (
    "gas_codigo",
    "gas_nombre",
    "gas_descripcion",
    "gas_suma_asistencia",
    "gas_activo",
    "gas_orden",
    "gas_fecha_creacion",
    "gas_fecha_modificacion"
)
VALUES
    ('NINOS', 'Niños', 'Asistencia de niños.', TRUE, TRUE, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('JOVENES', 'Jóvenes', 'Asistencia de jóvenes.', TRUE, TRUE, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('ADULTOS', 'Adultos', 'Asistencia de adultos.', TRUE, TRUE, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('RESULTADOS', 'Resultados', 'Frutos de la reunión; no suman a la asistencia porque esas personas ya se contaron.', FALSE, TRUE, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("gas_codigo")
DO UPDATE SET
    "gas_nombre" = EXCLUDED."gas_nombre",
    "gas_descripcion" = EXCLUDED."gas_descripcion",
    "gas_suma_asistencia" = EXCLUDED."gas_suma_asistencia",
    "gas_activo" = TRUE,
    "gas_orden" = EXCLUDED."gas_orden",
    "gas_fecha_modificacion" = CURRENT_TIMESTAMP;

UPDATE  "tas_tipo_asistencia"
SET     "tas_activo" = FALSE,
        "tas_fecha_modificacion" = CURRENT_TIMESTAMP
WHERE   "tas_codigo" IN ('HERMANOS', 'AMIGOS', 'NUEVOS', 'NINOS', 'JOVENES');

INSERT INTO "tas_tipo_asistencia" (
    "tas_id_gas",
    "tas_codigo",
    "tas_nombre",
    "tas_descripcion",
    "tas_activo",
    "tas_orden",
    "tas_fecha_creacion",
    "tas_fecha_modificacion"
)
SELECT  gas."gas_id",
        nuevo.codigo,
        nuevo.nombre,
        nuevo.descripcion,
        TRUE,
        nuevo.orden,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
FROM    (
            VALUES
                ('NINOS', 'NINOS_HERMANOS', 'Hermanos', 'Niños que son miembros de la iglesia.', 1),
                ('NINOS', 'NINOS_AMIGOS', 'Amigos', 'Niños que nos visitan.', 2),
                ('JOVENES', 'JOVENES_HERMANOS', 'Hermanos', 'Jóvenes que son miembros de la iglesia.', 3),
                ('JOVENES', 'JOVENES_AMIGOS', 'Amigos', 'Jóvenes que nos visitan.', 4),
                ('ADULTOS', 'ADULTOS_HERMANOS', 'Hermanos', 'Adultos que son miembros de la iglesia.', 5),
                ('ADULTOS', 'ADULTOS_AMIGOS', 'Amigos', 'Adultos que nos visitan.', 6),
                ('RESULTADOS', 'CONVERSIONES', 'Conversiones', 'Personas que aceptaron a Cristo en la reunión.', 7),
                ('RESULTADOS', 'RECONCILIACIONES', 'Reconciliaciones', 'Personas que se reconciliaron en la reunión.', 8),
                ('RESULTADOS', 'VISITAS_PROGRAMADAS', 'Visitas programadas', 'Visitas que se acordaron durante la reunión.', 9),
                ('RESULTADOS', 'BAUTISMOS', 'Bautismos', 'Personas bautizadas o anotadas para bautizarse.', 10)
        ) AS nuevo (grupo, codigo, nombre, descripcion, orden)
        INNER JOIN "gas_grupo_asistencia" AS gas ON gas."gas_codigo" = nuevo.grupo
ON CONFLICT ("tas_codigo")
DO UPDATE SET
    "tas_id_gas" = EXCLUDED."tas_id_gas",
    "tas_nombre" = EXCLUDED."tas_nombre",
    "tas_descripcion" = EXCLUDED."tas_descripcion",
    "tas_activo" = TRUE,
    "tas_orden" = EXCLUDED."tas_orden",
    "tas_fecha_modificacion" = CURRENT_TIMESTAMP;
