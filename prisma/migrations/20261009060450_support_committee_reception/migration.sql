CREATE TYPE "tde_tipo_denominacion" AS ENUM ('billete', 'moneda');

DROP INDEX "uk_rof_codigo_sobre";

ALTER TABLE "dro_detalle_recepcion_ofrenda" ADD COLUMN     "dro_monto_sistema" DECIMAL(19,2) NOT NULL DEFAULT 0,
ALTER COLUMN "dro_id_cof" DROP NOT NULL;

UPDATE  "rof_recepcion_ofrenda"
SET     "rof_monto_sistema" = COALESCE("rof_monto_sistema", 0),
        "rof_diferencia_monto" = COALESCE("rof_diferencia_monto", "rof_monto_recibido" - COALESCE("rof_monto_sistema", 0))
WHERE   "rof_monto_sistema" IS NULL
        OR "rof_diferencia_monto" IS NULL;

ALTER TABLE "rof_recepcion_ofrenda" DROP COLUMN "rof_asistencia_recibida",
DROP COLUMN "rof_asistencia_sistema",
DROP COLUMN "rof_codigo_sobre",
DROP COLUMN "rof_diferencia_asistencia",
ALTER COLUMN "rof_monto_sistema" SET NOT NULL,
ALTER COLUMN "rof_diferencia_monto" SET NOT NULL;

CREATE TABLE "den_denominacion" (
    "den_id" SERIAL NOT NULL,
    "den_codigo" VARCHAR(100) NOT NULL,
    "den_nombre" VARCHAR(100) NOT NULL,
    "den_valor" DECIMAL(19,2) NOT NULL,
    "den_tipo" "tde_tipo_denominacion" NOT NULL,
    "den_orden" INTEGER NOT NULL DEFAULT 0,
    "den_activo" BOOLEAN NOT NULL DEFAULT true,
    "den_fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "den_fecha_modificacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pk_den_denominacion" PRIMARY KEY ("den_id")
);

CREATE TABLE "dxd_detalle_denominacion" (
    "dxd_id" SERIAL NOT NULL,
    "dxd_detalle" INTEGER NOT NULL,
    "dxd_denominacion" INTEGER NOT NULL,
    "dxd_cantidad" INTEGER NOT NULL,
    "dxd_monto" DECIMAL(19,2) NOT NULL,
    "dxd_fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dxd_fecha_modificacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pk_dxd_detalle_denominacion" PRIMARY KEY ("dxd_id")
);

CREATE UNIQUE INDEX "uk_den_codigo" ON "den_denominacion"("den_codigo");

CREATE UNIQUE INDEX "uk_den_nombre" ON "den_denominacion"("den_nombre");

CREATE INDEX "ix_den_activo" ON "den_denominacion"("den_activo");

CREATE INDEX "ix_dxd_denominacion" ON "dxd_detalle_denominacion"("dxd_denominacion");

CREATE UNIQUE INDEX "uk_dxd_detalle_denominacion" ON "dxd_detalle_denominacion"("dxd_detalle", "dxd_denominacion");

ALTER TABLE "dxd_detalle_denominacion" ADD CONSTRAINT "fk_dxd_detalle" FOREIGN KEY ("dxd_detalle") REFERENCES "dro_detalle_recepcion_ofrenda"("dro_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "dxd_detalle_denominacion" ADD CONSTRAINT "fk_dxd_denominacion" FOREIGN KEY ("dxd_denominacion") REFERENCES "den_denominacion"("den_id") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMENT ON TYPE "public"."tde_tipo_denominacion" IS 'Forma física de una denominación de dinero: billete o moneda.';

COMMENT ON TABLE "public"."den_denominacion" IS 'Catálogo de billetes y monedas que el comité de apoyo cuenta al recibir un sobre.';
COMMENT ON COLUMN "public"."den_denominacion"."den_id" IS 'Identificador interno de la denominación.';
COMMENT ON COLUMN "public"."den_denominacion"."den_codigo" IS 'Código único de la denominación.';
COMMENT ON COLUMN "public"."den_denominacion"."den_nombre" IS 'Nombre visible de la denominación.';
COMMENT ON COLUMN "public"."den_denominacion"."den_valor" IS 'Valor en dólares de una unidad de la denominación.';
COMMENT ON COLUMN "public"."den_denominacion"."den_tipo" IS 'Indica si la denominación es billete o moneda.';
COMMENT ON COLUMN "public"."den_denominacion"."den_orden" IS 'Orden en que se presenta la denominación durante el conteo.';
COMMENT ON COLUMN "public"."den_denominacion"."den_activo" IS 'Indica si la denominación se ofrece para contar.';
COMMENT ON COLUMN "public"."den_denominacion"."den_fecha_creacion" IS 'Fecha de creación del registro.';
COMMENT ON COLUMN "public"."den_denominacion"."den_fecha_modificacion" IS 'Fecha de la última modificación del registro.';

COMMENT ON TABLE "public"."dxd_detalle_denominacion" IS 'Cantidad contada de una denominación dentro de un tipo de ofrenda de un sobre recibido.';
COMMENT ON COLUMN "public"."dxd_detalle_denominacion"."dxd_id" IS 'Identificador interno del conteo.';
COMMENT ON COLUMN "public"."dxd_detalle_denominacion"."dxd_detalle" IS 'Detalle por tipo de ofrenda al que pertenece el conteo.';
COMMENT ON COLUMN "public"."dxd_detalle_denominacion"."dxd_denominacion" IS 'Denominación contada.';
COMMENT ON COLUMN "public"."dxd_detalle_denominacion"."dxd_cantidad" IS 'Cantidad de billetes o monedas contadas.';
COMMENT ON COLUMN "public"."dxd_detalle_denominacion"."dxd_monto" IS 'Monto resultante de la cantidad por el valor de la denominación al momento del conteo.';
COMMENT ON COLUMN "public"."dxd_detalle_denominacion"."dxd_fecha_creacion" IS 'Fecha de creación del registro.';
COMMENT ON COLUMN "public"."dxd_detalle_denominacion"."dxd_fecha_modificacion" IS 'Fecha de la última modificación del registro.';

COMMENT ON TABLE "public"."rof_recepcion_ofrenda" IS 'Recepción física del sobre de ofrenda de una fecha de reunión por el comité de apoyo.';
COMMENT ON COLUMN "public"."rof_recepcion_ofrenda"."rof_monto_sistema" IS 'Total registrado por el líder al momento de recibir el sobre.';
COMMENT ON COLUMN "public"."rof_recepcion_ofrenda"."rof_monto_recibido" IS 'Total contado por el comité de apoyo.';
COMMENT ON COLUMN "public"."rof_recepcion_ofrenda"."rof_diferencia_monto" IS 'Monto recibido menos monto registrado.';
COMMENT ON COLUMN "public"."rof_recepcion_ofrenda"."rof_id_usu_receptor" IS 'Usuario del comité que contó el sobre.';
COMMENT ON COLUMN "public"."rof_recepcion_ofrenda"."rof_id_usu_revisor" IS 'Usuario que corrigió el conteo por última vez.';
COMMENT ON COLUMN "public"."rof_recepcion_ofrenda"."rof_nota" IS 'Observación del comité; obligatoria cuando el conteo no cuadra.';

COMMENT ON COLUMN "public"."dro_detalle_recepcion_ofrenda"."dro_id_cof" IS 'Tipo de ofrenda contado; nulo cuando el líder registró solo el total.';
COMMENT ON COLUMN "public"."dro_detalle_recepcion_ofrenda"."dro_monto_sistema" IS 'Monto registrado por el líder para este tipo de ofrenda.';
COMMENT ON COLUMN "public"."dro_detalle_recepcion_ofrenda"."dro_monto" IS 'Monto contado por el comité para este tipo de ofrenda.';

INSERT INTO "den_denominacion" (
    "den_codigo",
    "den_nombre",
    "den_valor",
    "den_tipo",
    "den_orden",
    "den_activo",
    "den_fecha_creacion",
    "den_fecha_modificacion"
)
VALUES
    ('BIL-100', 'Billete de $100', 100.00, 'billete', 1, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('BIL-050', 'Billete de $50', 50.00, 'billete', 2, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('BIL-020', 'Billete de $20', 20.00, 'billete', 3, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('BIL-010', 'Billete de $10', 10.00, 'billete', 4, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('BIL-005', 'Billete de $5', 5.00, 'billete', 5, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('BIL-001', 'Billete de $1', 1.00, 'billete', 6, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('MON-100', 'Moneda de $1', 1.00, 'moneda', 7, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('MON-050', 'Moneda de 50¢', 0.50, 'moneda', 8, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('MON-025', 'Cora (25¢)', 0.25, 'moneda', 9, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('MON-010', 'Moneda de 10¢', 0.10, 'moneda', 10, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('MON-005', 'Moneda de 5¢', 0.05, 'moneda', 11, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('MON-001', 'Moneda de 1¢', 0.01, 'moneda', 12, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("den_codigo")
DO UPDATE SET
    "den_nombre" = EXCLUDED."den_nombre",
    "den_valor" = EXCLUDED."den_valor",
    "den_tipo" = EXCLUDED."den_tipo",
    "den_orden" = EXCLUDED."den_orden",
    "den_fecha_modificacion" = CURRENT_TIMESTAMP;

INSERT INTO "per_permiso" (
    "per_nombre",
    "per_codigo",
    "per_modulo",
    "per_recurso",
    "per_accion",
    "per_descripcion",
    "per_sistema",
    "per_estado",
    "per_fecha_creacion",
    "per_fecha_modificacion"
)
VALUES (
    'Recibir sobres de ofrenda',
    'finance.receive',
    'Finanzas',
    'finance',
    'receive',
    'Contar y recibir los sobres de ofrenda entregados por los líderes.',
    TRUE,
    'activo',
    NOW(),
    NOW()
)
ON CONFLICT ("per_codigo")
DO UPDATE SET
    "per_nombre" = EXCLUDED."per_nombre",
    "per_modulo" = EXCLUDED."per_modulo",
    "per_recurso" = EXCLUDED."per_recurso",
    "per_accion" = EXCLUDED."per_accion",
    "per_descripcion" = EXCLUDED."per_descripcion",
    "per_sistema" = EXCLUDED."per_sistema",
    "per_estado" = EXCLUDED."per_estado",
    "per_fecha_modificacion" = NOW();

INSERT INTO "rol_rol" (
    "rol_nombre",
    "rol_codigo",
    "rol_descripcion",
    "rol_sistema",
    "rol_estado",
    "rol_fecha_creacion",
    "rol_fecha_modificacion"
)
VALUES (
    'Comité de apoyo',
    'SUPPORT_COMMITTEE',
    'Recibe y cuenta los sobres de ofrenda entregados por los líderes.',
    TRUE,
    'activo',
    NOW(),
    NOW()
)
ON CONFLICT ("rol_codigo")
DO UPDATE SET
    "rol_nombre" = EXCLUDED."rol_nombre",
    "rol_descripcion" = EXCLUDED."rol_descripcion",
    "rol_sistema" = EXCLUDED."rol_sistema",
    "rol_estado" = EXCLUDED."rol_estado",
    "rol_fecha_modificacion" = NOW();

INSERT INTO "rxp_rol_permiso" ("rxp_rol", "rxp_permiso")
SELECT  rol."rol_id", per."per_id"
FROM    "rol_rol" AS rol
        CROSS JOIN "per_permiso" AS per
WHERE   (
            per."per_codigo" = 'finance.receive'
            AND rol."rol_codigo" IN (
                'SUPER_ADMIN', 'ADMINISTRATOR', 'FINANCE', 'SUPPORT_COMMITTEE'
            )
        )
        OR (
            per."per_codigo" = 'dashboard.view'
            AND rol."rol_codigo" = 'SUPPORT_COMMITTEE'
        )
ON CONFLICT ("rxp_rol", "rxp_permiso") DO NOTHING;
