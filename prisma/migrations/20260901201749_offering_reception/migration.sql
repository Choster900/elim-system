-- CreateEnum
CREATE TYPE "ero_estado_recepcion_ofrenda" AS ENUM ('recibida', 'verificada', 'con_disparidad', 'anulada');

-- CreateTable
CREATE TABLE "rof_recepcion_ofrenda" (
    "rof_id" SERIAL NOT NULL,
    "rof_id_reo" INTEGER NOT NULL,
    "rof_codigo_sobre" VARCHAR(100),
    "rof_asistencia_sistema" INTEGER,
    "rof_monto_sistema" DECIMAL(19,2),
    "rof_asistencia_recibida" INTEGER,
    "rof_monto_recibido" DECIMAL(19,2) NOT NULL,
    "rof_diferencia_asistencia" INTEGER,
    "rof_diferencia_monto" DECIMAL(19,2),
    "rof_moneda" VARCHAR(10) NOT NULL DEFAULT 'USD',
    "rof_estado" "ero_estado_recepcion_ofrenda" NOT NULL DEFAULT 'recibida',
    "rof_id_usu_receptor" INTEGER,
    "rof_fecha_recepcion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rof_id_usu_revisor" INTEGER,
    "rof_fecha_revision" TIMESTAMP(3),
    "rof_nota" VARCHAR(600),
    "rof_fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rof_fecha_modificacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pk_rof_recepcion_ofrenda" PRIMARY KEY ("rof_id")
);

-- CreateTable
CREATE TABLE "dro_detalle_recepcion_ofrenda" (
    "dro_id" SERIAL NOT NULL,
    "dro_id_rof" INTEGER NOT NULL,
    "dro_id_cof" INTEGER NOT NULL,
    "dro_monto" DECIMAL(19,2) NOT NULL,
    "dro_nota" VARCHAR(300),
    "dro_fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dro_fecha_modificacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pk_dro_detalle_recepcion_ofrenda" PRIMARY KEY ("dro_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uk_rof_ocurrencia" ON "rof_recepcion_ofrenda"("rof_id_reo");

-- CreateIndex
CREATE UNIQUE INDEX "uk_rof_codigo_sobre" ON "rof_recepcion_ofrenda"("rof_codigo_sobre");

-- CreateIndex
CREATE INDEX "ix_rof_estado_recepcion" ON "rof_recepcion_ofrenda"("rof_estado", "rof_fecha_recepcion");

-- CreateIndex
CREATE INDEX "ix_rof_usuario_receptor" ON "rof_recepcion_ofrenda"("rof_id_usu_receptor");

-- CreateIndex
CREATE INDEX "ix_rof_usuario_revisor" ON "rof_recepcion_ofrenda"("rof_id_usu_revisor");

-- CreateIndex
CREATE INDEX "ix_dro_recepcion" ON "dro_detalle_recepcion_ofrenda"("dro_id_rof");

-- CreateIndex
CREATE INDEX "ix_dro_categoria" ON "dro_detalle_recepcion_ofrenda"("dro_id_cof");

-- CreateIndex
CREATE UNIQUE INDEX "uk_dro_recepcion_categoria" ON "dro_detalle_recepcion_ofrenda"("dro_id_rof", "dro_id_cof");

-- AddForeignKey
ALTER TABLE "rof_recepcion_ofrenda" ADD CONSTRAINT "fk_rof_id_reo" FOREIGN KEY ("rof_id_reo") REFERENCES "reo_reunion_ocurrencia"("reo_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rof_recepcion_ofrenda" ADD CONSTRAINT "fk_rof_id_usu_receptor" FOREIGN KEY ("rof_id_usu_receptor") REFERENCES "usu_usuario"("usu_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rof_recepcion_ofrenda" ADD CONSTRAINT "fk_rof_id_usu_revisor" FOREIGN KEY ("rof_id_usu_revisor") REFERENCES "usu_usuario"("usu_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dro_detalle_recepcion_ofrenda" ADD CONSTRAINT "fk_dro_id_rof" FOREIGN KEY ("dro_id_rof") REFERENCES "rof_recepcion_ofrenda"("rof_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dro_detalle_recepcion_ofrenda" ADD CONSTRAINT "fk_dro_id_cof" FOREIGN KEY ("dro_id_cof") REFERENCES "cof_categoria_ofrenda"("cof_id") ON DELETE RESTRICT ON UPDATE CASCADE;
