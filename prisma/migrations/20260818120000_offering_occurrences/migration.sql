-- Registro de ofrendas por ocurrencia.
-- Cada fecha en que una reunión debía realizarse pasa a ser una fila real, para que un
-- pendiente pueda existir antes de que alguien capture datos.

-- 1. Tipos nuevos -----------------------------------------------------------------------

CREATE TYPE "mme_modo_mensual" AS ENUM ('dia_fijo', 'ordinal');

CREATE TYPE "eoc_estado_ocurrencia" AS ENUM ('pendiente', 'registrada');

-- 2. Reunión: recurrencia mensual configurable y bandera de actividad -------------------

ALTER TABLE "reu_reunion"
    ADD COLUMN "reu_modo_mensual" "mme_modo_mensual",
    ADD COLUMN "reu_ordinal_semana" SMALLINT,
    ADD COLUMN "reu_dia_semana" SMALLINT,
    ADD COLUMN "reu_activa" BOOLEAN NOT NULL DEFAULT true;

-- Una reunión cancelada deja de generar ocurrencias; el resto sigue activa.
UPDATE "reu_reunion" SET "reu_activa" = false WHERE "reu_estado" = 'cancelada';

-- Las reuniones mensuales existentes conservan su comportamiento actual: el día del ancla.
UPDATE "reu_reunion" SET "reu_modo_mensual" = 'dia_fijo' WHERE "reu_frecuencia" = 'mensual';

ALTER TABLE "reu_reunion"
    ADD CONSTRAINT "ck_reu_ordinal_semana" CHECK ("reu_ordinal_semana" IS NULL OR "reu_ordinal_semana" BETWEEN 1 AND 5),
    ADD CONSTRAINT "ck_reu_dia_semana" CHECK ("reu_dia_semana" IS NULL OR "reu_dia_semana" BETWEEN 0 AND 6);

-- El estado de una plantilla recurrente no tiene sentido: pertenece a cada ocurrencia.
DROP INDEX "ix_reu_estado";
ALTER TABLE "reu_reunion" DROP COLUMN "reu_estado";
DROP TYPE "ere_estado_reunion";

CREATE INDEX "ix_reu_activa" ON "reu_reunion" ("reu_activa");

COMMENT ON COLUMN "reu_reunion"."reu_modo_mensual" IS 'Modo de cálculo de la recurrencia mensual; nulo para el resto de frecuencias.';
COMMENT ON COLUMN "reu_reunion"."reu_ordinal_semana" IS 'Posición del día dentro del mes, de 1 a 4, o 5 para el último.';
COMMENT ON COLUMN "reu_reunion"."reu_dia_semana" IS 'Día de la semana, de 0 domingo a 6 sábado.';
COMMENT ON COLUMN "reu_reunion"."reu_activa" IS 'Una reunión inactiva deja de generar ocurrencias pendientes.';

-- 3. Tabla de ocurrencias ---------------------------------------------------------------

CREATE TABLE "reo_reunion_ocurrencia" (
    "reo_id" SERIAL NOT NULL,
    "reo_id_reu" INTEGER NOT NULL,
    "reo_fecha" DATE NOT NULL,
    "reo_estado" "eoc_estado_ocurrencia" NOT NULL DEFAULT 'pendiente',
    "reo_asistencia" INTEGER,
    "reo_monto_total" DECIMAL(12,2),
    "reo_moneda" VARCHAR(10) NOT NULL DEFAULT 'USD',
    "reo_nota" VARCHAR(600),
    "reo_id_sec" INTEGER NOT NULL,
    "reo_id_mie_lider" INTEGER,
    "reo_id_usu_registro" INTEGER,
    "reo_fecha_registro" TIMESTAMP(3),
    "reo_id_usu_modificacion" INTEGER,
    "reo_fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reo_fecha_modificacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pk_reo_reunion_ocurrencia" PRIMARY KEY ("reo_id"),
    CONSTRAINT "ck_reo_asistencia" CHECK ("reo_asistencia" IS NULL OR "reo_asistencia" >= 0),
    CONSTRAINT "ck_reo_monto_total" CHECK ("reo_monto_total" IS NULL OR "reo_monto_total" >= 0)
);

CREATE UNIQUE INDEX "uk_reo_reunion_fecha" ON "reo_reunion_ocurrencia" ("reo_id_reu", "reo_fecha");
CREATE INDEX "ix_reo_estado_fecha" ON "reo_reunion_ocurrencia" ("reo_estado", "reo_fecha");
CREATE INDEX "ix_reo_reunion" ON "reo_reunion_ocurrencia" ("reo_id_reu");
CREATE INDEX "ix_reo_sector" ON "reo_reunion_ocurrencia" ("reo_id_sec");
CREATE INDEX "ix_reo_usuario_registro" ON "reo_reunion_ocurrencia" ("reo_id_usu_registro");

ALTER TABLE "reo_reunion_ocurrencia"
    ADD CONSTRAINT "fk_reo_id_reu" FOREIGN KEY ("reo_id_reu") REFERENCES "reu_reunion" ("reu_id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "fk_reo_id_sec" FOREIGN KEY ("reo_id_sec") REFERENCES "sec_sector" ("sec_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "fk_reo_id_mie_lider" FOREIGN KEY ("reo_id_mie_lider") REFERENCES "mie_miembro" ("mie_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "fk_reo_id_usu_registro" FOREIGN KEY ("reo_id_usu_registro") REFERENCES "usu_usuario" ("usu_id") ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "fk_reo_id_usu_modificacion" FOREIGN KEY ("reo_id_usu_modificacion") REFERENCES "usu_usuario" ("usu_id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMENT ON TABLE "reo_reunion_ocurrencia" IS 'Cada fecha en que una reunión debía realizarse, con su captura de asistencia y ofrenda.';
COMMENT ON COLUMN "reo_reunion_ocurrencia"."reo_fecha" IS 'Fecha programada según la regla de recurrencia de la reunión.';
COMMENT ON COLUMN "reo_reunion_ocurrencia"."reo_estado" IS 'Pendiente mientras nadie capture datos; registrada una vez capturados.';
COMMENT ON COLUMN "reo_reunion_ocurrencia"."reo_asistencia" IS 'Personas que asistieron; nulo mientras siga pendiente, que no es lo mismo que cero.';
COMMENT ON COLUMN "reo_reunion_ocurrencia"."reo_id_sec" IS 'Sector responsable en esa fecha; se conserva aunque la reunión cambie de sector.';
COMMENT ON COLUMN "reo_reunion_ocurrencia"."reo_id_mie_lider" IS 'Líder responsable en esa fecha; se conserva aunque la reunión cambie de líder.';
COMMENT ON COLUMN "reo_reunion_ocurrencia"."reo_id_usu_registro" IS 'Usuario que capturó los datos por primera vez.';
COMMENT ON COLUMN "reo_reunion_ocurrencia"."reo_id_usu_modificacion" IS 'Último usuario que corrigió los datos ya capturados.';

-- 4. Traslado de las ofrendas existentes ------------------------------------------------

-- Columna puente temporal para repuntar los detalles sin perder la correspondencia.
ALTER TABLE "reo_reunion_ocurrencia" ADD COLUMN "reo_tmp_ofr_id" INTEGER;

INSERT INTO "reo_reunion_ocurrencia" (
    "reo_id_reu", "reo_fecha", "reo_estado", "reo_asistencia", "reo_monto_total",
    "reo_moneda", "reo_nota", "reo_id_sec", "reo_id_mie_lider",
    "reo_id_usu_registro", "reo_fecha_registro",
    "reo_fecha_creacion", "reo_fecha_modificacion", "reo_tmp_ofr_id"
)
SELECT
    o."ofr_id_reu",
    o."ofr_fecha",
    'registrada',
    o."ofr_asistencia",
    o."ofr_monto_total",
    o."ofr_moneda",
    o."ofr_nota",
    r."reu_id_sec",
    r."reu_id_mie_lider",
    o."ofr_id_usu_registro",
    o."ofr_fecha_creacion",
    o."ofr_fecha_creacion",
    o."ofr_fecha_modificacion",
    o."ofr_id"
FROM "ofr_ofrenda" o
JOIN "reu_reunion" r ON r."reu_id" = o."ofr_id_reu";

-- 5. Detalle de ofrenda: repuntar a la ocurrencia ---------------------------------------

ALTER TABLE "dof_detalle_ofrenda" ADD COLUMN "dof_id_reo" INTEGER;

UPDATE "dof_detalle_ofrenda" d
SET "dof_id_reo" = o."reo_id"
FROM "reo_reunion_ocurrencia" o
WHERE o."reo_tmp_ofr_id" = d."dof_id_ofr";

DELETE FROM "dof_detalle_ofrenda" WHERE "dof_id_reo" IS NULL;

ALTER TABLE "dof_detalle_ofrenda" ALTER COLUMN "dof_id_reo" SET NOT NULL;

ALTER TABLE "dof_detalle_ofrenda" DROP CONSTRAINT "fk_dof_id_ofr";
DROP INDEX "uk_dof_ofrenda_categoria";
DROP INDEX "ix_dof_ofrenda";
ALTER TABLE "dof_detalle_ofrenda" DROP COLUMN "dof_id_ofr";

CREATE UNIQUE INDEX "uk_dof_ocurrencia_categoria" ON "dof_detalle_ofrenda" ("dof_id_reo", "dof_id_cof");
CREATE INDEX "ix_dof_ocurrencia" ON "dof_detalle_ofrenda" ("dof_id_reo");

ALTER TABLE "dof_detalle_ofrenda"
    ADD CONSTRAINT "fk_dof_id_reo" FOREIGN KEY ("dof_id_reo") REFERENCES "reo_reunion_ocurrencia" ("reo_id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMENT ON COLUMN "dof_detalle_ofrenda"."dof_id_reo" IS 'Ocurrencia a la que pertenece este desglose por categoría.';

-- 6. Retiro de la tabla absorbida -------------------------------------------------------

ALTER TABLE "reo_reunion_ocurrencia" DROP COLUMN "reo_tmp_ofr_id";

DROP TABLE "ofr_ofrenda";
