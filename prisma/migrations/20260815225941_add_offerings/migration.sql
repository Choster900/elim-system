-- CreateTable
CREATE TABLE "cof_categoria_ofrenda" (
    "cof_id" SERIAL NOT NULL,
    "cof_codigo" VARCHAR(100) NOT NULL,
    "cof_nombre" VARCHAR(100) NOT NULL,
    "cof_descripcion" VARCHAR(300),
    "cof_activo" BOOLEAN NOT NULL DEFAULT true,
    "cof_orden" INTEGER NOT NULL DEFAULT 0,
    "cof_fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cof_fecha_modificacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pk_cof_categoria_ofrenda" PRIMARY KEY ("cof_id")
);

-- CreateTable
CREATE TABLE "ofr_ofrenda" (
    "ofr_id" SERIAL NOT NULL,
    "ofr_id_reu" INTEGER NOT NULL,
    "ofr_fecha" DATE NOT NULL,
    "ofr_asistencia" INTEGER NOT NULL DEFAULT 0,
    "ofr_monto_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "ofr_moneda" VARCHAR(10) NOT NULL DEFAULT 'USD',
    "ofr_nota" VARCHAR(600),
    "ofr_id_usu_registro" INTEGER,
    "ofr_fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ofr_fecha_modificacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pk_ofr_ofrenda" PRIMARY KEY ("ofr_id")
);

-- CreateTable
CREATE TABLE "dof_detalle_ofrenda" (
    "dof_id" SERIAL NOT NULL,
    "dof_id_ofr" INTEGER NOT NULL,
    "dof_id_cof" INTEGER NOT NULL,
    "dof_monto" DECIMAL(12,2) NOT NULL,
    "dof_nota" VARCHAR(300),
    "dof_fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dof_fecha_modificacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pk_dof_detalle_ofrenda" PRIMARY KEY ("dof_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uk_cof_codigo" ON "cof_categoria_ofrenda"("cof_codigo");

-- CreateIndex
CREATE UNIQUE INDEX "uk_cof_nombre" ON "cof_categoria_ofrenda"("cof_nombre");

-- CreateIndex
CREATE INDEX "ix_cof_activo" ON "cof_categoria_ofrenda"("cof_activo");

-- CreateIndex
CREATE INDEX "ix_ofr_reunion" ON "ofr_ofrenda"("ofr_id_reu");

-- CreateIndex
CREATE INDEX "ix_ofr_fecha" ON "ofr_ofrenda"("ofr_fecha");

-- CreateIndex
CREATE INDEX "ix_ofr_usuario_registro" ON "ofr_ofrenda"("ofr_id_usu_registro");

-- CreateIndex
CREATE UNIQUE INDEX "uk_ofr_reunion_fecha" ON "ofr_ofrenda"("ofr_id_reu", "ofr_fecha");

-- CreateIndex
CREATE INDEX "ix_dof_ofrenda" ON "dof_detalle_ofrenda"("dof_id_ofr");

-- CreateIndex
CREATE INDEX "ix_dof_categoria" ON "dof_detalle_ofrenda"("dof_id_cof");

-- CreateIndex
CREATE UNIQUE INDEX "uk_dof_ofrenda_categoria" ON "dof_detalle_ofrenda"("dof_id_ofr", "dof_id_cof");

-- AddForeignKey
ALTER TABLE "ofr_ofrenda" ADD CONSTRAINT "fk_ofr_id_reu" FOREIGN KEY ("ofr_id_reu") REFERENCES "reu_reunion"("reu_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ofr_ofrenda" ADD CONSTRAINT "fk_ofr_id_usu_registro" FOREIGN KEY ("ofr_id_usu_registro") REFERENCES "usu_usuario"("usu_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dof_detalle_ofrenda" ADD CONSTRAINT "fk_dof_id_ofr" FOREIGN KEY ("dof_id_ofr") REFERENCES "ofr_ofrenda"("ofr_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dof_detalle_ofrenda" ADD CONSTRAINT "fk_dof_id_cof" FOREIGN KEY ("dof_id_cof") REFERENCES "cof_categoria_ofrenda"("cof_id") ON DELETE RESTRICT ON UPDATE CASCADE;
