-- CreateEnum
CREATE TYPE "eme_estado_miembro" AS ENUM ('activo', 'inactivo', 'visitante', 'trasladado', 'fallecido');

-- CreateEnum
CREATE TYPE "gmi_genero_miembro" AS ENUM ('femenino', 'masculino', 'otro', 'sin_especificar');

-- CreateEnum
CREATE TYPE "eci_estado_civil_miembro" AS ENUM ('soltero', 'casado', 'divorciado', 'viudo', 'union_estable', 'sin_especificar');

-- CreateEnum
CREATE TYPE "eus_estado_usuario" AS ENUM ('activo', 'invitado', 'bloqueado');

-- CreateEnum
CREATE TYPE "ere_estado_registro" AS ENUM ('activo', 'inactivo');

-- CreateEnum
CREATE TYPE "ere_estado_reunion" AS ENUM ('programada', 'en_curso', 'completada', 'cancelada');

-- CreateEnum
CREATE TYPE "fre_frecuencia_reunion" AS ENUM ('unica', 'semanal', 'quincenal', 'mensual');

-- DropForeignKey
ALTER TABLE "auth_session" DROP CONSTRAINT "auth_session_user_id_fkey";

-- DropForeignKey
ALTER TABLE "role_permission" DROP CONSTRAINT "role_permission_permission_id_fkey";

-- DropForeignKey
ALTER TABLE "role_permission" DROP CONSTRAINT "role_permission_role_id_fkey";

-- DropForeignKey
ALTER TABLE "user_role" DROP CONSTRAINT "user_role_role_id_fkey";

-- DropForeignKey
ALTER TABLE "user_role" DROP CONSTRAINT "user_role_user_id_fkey";

-- DropTable
DROP TABLE "auth_session";

-- DropTable
DROP TABLE "member";

-- DropTable
DROP TABLE "permission";

-- DropTable
DROP TABLE "role";

-- DropTable
DROP TABLE "role_permission";

-- DropTable
DROP TABLE "user";

-- DropTable
DROP TABLE "user_role";

-- DropEnum
DROP TYPE "member_community_role";

-- DropEnum
DROP TYPE "member_gender";

-- DropEnum
DROP TYPE "member_marital_status";

-- DropEnum
DROP TYPE "member_status";

-- CreateTable
CREATE TABLE "mie_miembro" (
    "mie_id" SERIAL NOT NULL,
    "mie_codigo" VARCHAR(100) NOT NULL,
    "mie_primer_nombre" VARCHAR(100) NOT NULL,
    "mie_segundo_nombre" VARCHAR(100),
    "mie_primer_apellido" VARCHAR(100) NOT NULL,
    "mie_segundo_apellido" VARCHAR(100),
    "mie_nombre_preferido" VARCHAR(100),
    "mie_numero_documento" VARCHAR(100),
    "mie_fecha_nacimiento" DATE,
    "mie_genero" "gmi_genero_miembro" NOT NULL DEFAULT 'sin_especificar',
    "mie_estado_civil" "eci_estado_civil_miembro" NOT NULL DEFAULT 'sin_especificar',
    "mie_telefono" VARCHAR(100),
    "mie_telefono_alterno" VARCHAR(100),
    "mie_correo" VARCHAR(100),
    "mie_direccion" VARCHAR(300),
    "mie_municipio" VARCHAR(100),
    "mie_departamento" VARCHAR(100),
    "mie_ocupacion" VARCHAR(100),
    "mie_estado" "eme_estado_miembro" NOT NULL DEFAULT 'activo',
    "mie_fecha_ingreso" DATE,
    "mie_fecha_conversion" DATE,
    "mie_fecha_bautismo" DATE,
    "mie_distrito" VARCHAR(100),
    "mie_zona" VARCHAR(100),
    "mie_sector" VARCHAR(100),
    "mie_grupo_pequeno" VARCHAR(100),
    "mie_contacto_emergencia" VARCHAR(100),
    "mie_telefono_emergencia" VARCHAR(100),
    "mie_nota" VARCHAR(600),
    "mie_id_sec" INTEGER,
    "mie_fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mie_fecha_modificacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pk_mie_miembro" PRIMARY KEY ("mie_id")
);

-- CreateTable
CREATE TABLE "roc_rol_comunidad" (
    "roc_id" SERIAL NOT NULL,
    "roc_codigo" VARCHAR(100) NOT NULL,
    "roc_nombre" VARCHAR(100) NOT NULL,
    "roc_descripcion" VARCHAR(300),
    "roc_activo" BOOLEAN NOT NULL DEFAULT true,
    "roc_sistema" BOOLEAN NOT NULL DEFAULT false,
    "roc_fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roc_fecha_modificacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pk_roc_rol_comunidad" PRIMARY KEY ("roc_id")
);

-- CreateTable
CREATE TABLE "mxr_miembro_rol" (
    "mxr_id" SERIAL NOT NULL,
    "mxr_miembro" INTEGER NOT NULL,
    "mxr_rol" INTEGER NOT NULL,
    "mxr_fecha_inicio" DATE,
    "mxr_fecha_fin" DATE,
    "mxr_nota" VARCHAR(300),
    "mxr_fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mxr_fecha_modificacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pk_mxr_miembro_rol" PRIMARY KEY ("mxr_id")
);

-- CreateTable
CREATE TABLE "min_ministerio" (
    "min_id" SERIAL NOT NULL,
    "min_codigo" VARCHAR(100) NOT NULL,
    "min_nombre" VARCHAR(100) NOT NULL,
    "min_descripcion" VARCHAR(300),
    "min_activo" BOOLEAN NOT NULL DEFAULT true,
    "min_fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "min_fecha_modificacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pk_min_ministerio" PRIMARY KEY ("min_id")
);

-- CreateTable
CREATE TABLE "mxm_miembro_ministerio" (
    "mxm_id" SERIAL NOT NULL,
    "mxm_miembro" INTEGER NOT NULL,
    "mxm_ministerio" INTEGER NOT NULL,
    "mxm_funcion" VARCHAR(100),
    "mxm_fecha_inicio" DATE,
    "mxm_fecha_fin" DATE,
    "mxm_nota" VARCHAR(300),
    "mxm_fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mxm_fecha_modificacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pk_mxm_miembro_ministerio" PRIMARY KEY ("mxm_id")
);

-- CreateTable
CREATE TABLE "usu_usuario" (
    "usu_id" SERIAL NOT NULL,
    "usu_id_mie" INTEGER,
    "usu_correo" VARCHAR(100) NOT NULL,
    "usu_nombre_usuario" VARCHAR(100),
    "usu_resumen_clave" VARCHAR(100) NOT NULL,
    "usu_activo" BOOLEAN NOT NULL DEFAULT true,
    "usu_estado" "eus_estado_usuario" NOT NULL DEFAULT 'activo',
    "usu_doble_factor" BOOLEAN NOT NULL DEFAULT false,
    "usu_cambiar_clave" BOOLEAN NOT NULL DEFAULT true,
    "usu_fecha_ultimo_acceso" TIMESTAMP(3),
    "usu_fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usu_fecha_modificacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pk_usu_usuario" PRIMARY KEY ("usu_id")
);

-- CreateTable
CREATE TABLE "ses_sesion_autenticacion" (
    "ses_id" SERIAL NOT NULL,
    "ses_identificador" VARCHAR(100) NOT NULL,
    "ses_id_usu" INTEGER NOT NULL,
    "ses_resumen_token_refresco" VARCHAR(100) NOT NULL,
    "ses_fecha_expiracion" TIMESTAMP(3) NOT NULL,
    "ses_fecha_revocacion" TIMESTAMP(3),
    "ses_fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ses_fecha_modificacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pk_ses_sesion_autenticacion" PRIMARY KEY ("ses_id")
);

-- CreateTable
CREATE TABLE "rol_rol" (
    "rol_id" SERIAL NOT NULL,
    "rol_nombre" VARCHAR(100) NOT NULL,
    "rol_codigo" VARCHAR(100) NOT NULL,
    "rol_descripcion" VARCHAR(300),
    "rol_sistema" BOOLEAN NOT NULL DEFAULT false,
    "rol_estado" "ere_estado_registro" NOT NULL DEFAULT 'activo',
    "rol_fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rol_fecha_modificacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pk_rol_rol" PRIMARY KEY ("rol_id")
);

-- CreateTable
CREATE TABLE "per_permiso" (
    "per_id" SERIAL NOT NULL,
    "per_nombre" VARCHAR(100) NOT NULL,
    "per_codigo" VARCHAR(100) NOT NULL,
    "per_modulo" VARCHAR(100) NOT NULL DEFAULT 'General',
    "per_recurso" VARCHAR(100) NOT NULL,
    "per_accion" VARCHAR(100) NOT NULL,
    "per_descripcion" VARCHAR(300),
    "per_sistema" BOOLEAN NOT NULL DEFAULT false,
    "per_estado" "ere_estado_registro" NOT NULL DEFAULT 'activo',
    "per_fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "per_fecha_modificacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pk_per_permiso" PRIMARY KEY ("per_id")
);

-- CreateTable
CREATE TABLE "uxr_usuario_rol" (
    "uxr_id" SERIAL NOT NULL,
    "uxr_usuario" INTEGER NOT NULL,
    "uxr_rol" INTEGER NOT NULL,
    "uxr_fecha_asignacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uxr_id_usu_asignador" INTEGER,

    CONSTRAINT "pk_uxr_usuario_rol" PRIMARY KEY ("uxr_id")
);

-- CreateTable
CREATE TABLE "rxp_rol_permiso" (
    "rxp_id" SERIAL NOT NULL,
    "rxp_rol" INTEGER NOT NULL,
    "rxp_permiso" INTEGER NOT NULL,
    "rxp_fecha_asignacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rxp_id_usu_otorgante" INTEGER,

    CONSTRAINT "pk_rxp_rol_permiso" PRIMARY KEY ("rxp_id")
);

-- CreateTable
CREATE TABLE "dis_distrito" (
    "dis_id" SERIAL NOT NULL,
    "dis_codigo" VARCHAR(100) NOT NULL,
    "dis_nombre" VARCHAR(100) NOT NULL,
    "dis_descripcion" VARCHAR(300),
    "dis_nombre_lider" VARCHAR(100),
    "dis_id_mie" INTEGER,
    "dis_color" VARCHAR(100) NOT NULL,
    "dis_poligono" JSONB NOT NULL,
    "dis_activo" BOOLEAN NOT NULL DEFAULT true,
    "dis_fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dis_fecha_modificacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pk_dis_distrito" PRIMARY KEY ("dis_id")
);

-- CreateTable
CREATE TABLE "zon_zona" (
    "zon_id" SERIAL NOT NULL,
    "zon_id_dis" INTEGER NOT NULL,
    "zon_codigo" VARCHAR(100) NOT NULL,
    "zon_nombre" VARCHAR(100) NOT NULL,
    "zon_descripcion" VARCHAR(300),
    "zon_nombre_lider" VARCHAR(100),
    "zon_id_mie" INTEGER,
    "zon_color" VARCHAR(100) NOT NULL,
    "zon_poligono" JSONB NOT NULL,
    "zon_activo" BOOLEAN NOT NULL DEFAULT true,
    "zon_fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zon_fecha_modificacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pk_zon_zona" PRIMARY KEY ("zon_id")
);

-- CreateTable
CREATE TABLE "sec_sector" (
    "sec_id" SERIAL NOT NULL,
    "sec_id_zon" INTEGER NOT NULL,
    "sec_codigo" VARCHAR(100) NOT NULL,
    "sec_nombre" VARCHAR(100) NOT NULL,
    "sec_descripcion" VARCHAR(300),
    "sec_nombre_lider" VARCHAR(100),
    "sec_id_mie" INTEGER,
    "sec_color" VARCHAR(100) NOT NULL,
    "sec_poligono" JSONB NOT NULL,
    "sec_activo" BOOLEAN NOT NULL DEFAULT true,
    "sec_fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sec_fecha_modificacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pk_sec_sector" PRIMARY KEY ("sec_id")
);

-- CreateTable
CREATE TABLE "tir_tipo_reunion" (
    "tir_id" SERIAL NOT NULL,
    "tir_codigo" VARCHAR(100) NOT NULL,
    "tir_nombre" VARCHAR(100) NOT NULL,
    "tir_descripcion" VARCHAR(300),
    "tir_color" VARCHAR(100) NOT NULL,
    "tir_activo" BOOLEAN NOT NULL DEFAULT true,
    "tir_fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tir_fecha_modificacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pk_tir_tipo_reunion" PRIMARY KEY ("tir_id")
);

-- CreateTable
CREATE TABLE "reu_reunion" (
    "reu_id" SERIAL NOT NULL,
    "reu_id_tir" INTEGER NOT NULL,
    "reu_id_sec" INTEGER NOT NULL,
    "reu_id_mie_supervisor" INTEGER NOT NULL,
    "reu_titulo" VARCHAR(100) NOT NULL,
    "reu_descripcion" VARCHAR(300),
    "reu_fecha" DATE NOT NULL,
    "reu_hora_inicio" TIME(0) NOT NULL,
    "reu_hora_fin" TIME(0) NOT NULL,
    "reu_ubicacion" VARCHAR(300) NOT NULL,
    "reu_latitud" DECIMAL(10,7),
    "reu_longitud" DECIMAL(10,7),
    "reu_frecuencia" "fre_frecuencia_reunion" NOT NULL DEFAULT 'unica',
    "reu_asistente_esperado" INTEGER NOT NULL DEFAULT 0,
    "reu_estado" "ere_estado_reunion" NOT NULL DEFAULT 'programada',
    "reu_publica" BOOLEAN NOT NULL DEFAULT false,
    "reu_nota" VARCHAR(600),
    "reu_color" VARCHAR(100) NOT NULL,
    "reu_fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reu_fecha_modificacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pk_reu_reunion" PRIMARY KEY ("reu_id")
);

-- CreateTable
CREATE TABLE "rxm_reunion_miembro" (
    "rxm_id" SERIAL NOT NULL,
    "rxm_reunion" INTEGER NOT NULL,
    "rxm_miembro" INTEGER NOT NULL,
    "rxm_fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_rxm_reunion_miembro" PRIMARY KEY ("rxm_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uk_mie_codigo" ON "mie_miembro"("mie_codigo");

-- CreateIndex
CREATE UNIQUE INDEX "uk_mie_numero_documento" ON "mie_miembro"("mie_numero_documento");

-- CreateIndex
CREATE INDEX "ix_mie_estado" ON "mie_miembro"("mie_estado");

-- CreateIndex
CREATE INDEX "ix_mie_nombre" ON "mie_miembro"("mie_primer_apellido", "mie_primer_nombre");

-- CreateIndex
CREATE INDEX "ix_mie_fecha_nacimiento" ON "mie_miembro"("mie_fecha_nacimiento");

-- CreateIndex
CREATE INDEX "ix_mie_fecha_ingreso" ON "mie_miembro"("mie_fecha_ingreso");

-- CreateIndex
CREATE INDEX "ix_mie_territorio" ON "mie_miembro"("mie_distrito", "mie_zona", "mie_sector");

-- CreateIndex
CREATE INDEX "ix_mie_sector" ON "mie_miembro"("mie_id_sec");

-- CreateIndex
CREATE UNIQUE INDEX "uk_roc_codigo" ON "roc_rol_comunidad"("roc_codigo");

-- CreateIndex
CREATE UNIQUE INDEX "uk_roc_nombre" ON "roc_rol_comunidad"("roc_nombre");

-- CreateIndex
CREATE INDEX "ix_roc_activo" ON "roc_rol_comunidad"("roc_activo");

-- CreateIndex
CREATE INDEX "ix_mxr_rol" ON "mxr_miembro_rol"("mxr_rol");

-- CreateIndex
CREATE UNIQUE INDEX "uk_mxr_miembro_rol" ON "mxr_miembro_rol"("mxr_miembro", "mxr_rol");

-- CreateIndex
CREATE UNIQUE INDEX "uk_min_codigo" ON "min_ministerio"("min_codigo");

-- CreateIndex
CREATE UNIQUE INDEX "uk_min_nombre" ON "min_ministerio"("min_nombre");

-- CreateIndex
CREATE INDEX "ix_min_activo" ON "min_ministerio"("min_activo");

-- CreateIndex
CREATE INDEX "ix_mxm_ministerio" ON "mxm_miembro_ministerio"("mxm_ministerio");

-- CreateIndex
CREATE UNIQUE INDEX "uk_mxm_miembro_ministerio" ON "mxm_miembro_ministerio"("mxm_miembro", "mxm_ministerio");

-- CreateIndex
CREATE UNIQUE INDEX "uk_usu_id_mie" ON "usu_usuario"("usu_id_mie");

-- CreateIndex
CREATE UNIQUE INDEX "uk_usu_correo" ON "usu_usuario"("usu_correo");

-- CreateIndex
CREATE UNIQUE INDEX "uk_usu_nombre_usuario" ON "usu_usuario"("usu_nombre_usuario");

-- CreateIndex
CREATE INDEX "ix_usu_activo" ON "usu_usuario"("usu_activo");

-- CreateIndex
CREATE INDEX "ix_usu_estado" ON "usu_usuario"("usu_estado");

-- CreateIndex
CREATE INDEX "ix_usu_fecha_ultimo_acceso" ON "usu_usuario"("usu_fecha_ultimo_acceso");

-- CreateIndex
CREATE UNIQUE INDEX "uk_ses_identificador" ON "ses_sesion_autenticacion"("ses_identificador");

-- CreateIndex
CREATE INDEX "ix_ses_usuario" ON "ses_sesion_autenticacion"("ses_id_usu");

-- CreateIndex
CREATE INDEX "ix_ses_fecha_expiracion" ON "ses_sesion_autenticacion"("ses_fecha_expiracion");

-- CreateIndex
CREATE INDEX "ix_ses_fecha_revocacion" ON "ses_sesion_autenticacion"("ses_fecha_revocacion");

-- CreateIndex
CREATE UNIQUE INDEX "uk_rol_nombre" ON "rol_rol"("rol_nombre");

-- CreateIndex
CREATE UNIQUE INDEX "uk_rol_codigo" ON "rol_rol"("rol_codigo");

-- CreateIndex
CREATE INDEX "ix_rol_sistema" ON "rol_rol"("rol_sistema");

-- CreateIndex
CREATE INDEX "ix_rol_estado" ON "rol_rol"("rol_estado");

-- CreateIndex
CREATE UNIQUE INDEX "uk_per_codigo" ON "per_permiso"("per_codigo");

-- CreateIndex
CREATE INDEX "ix_per_modulo" ON "per_permiso"("per_modulo");

-- CreateIndex
CREATE INDEX "ix_per_recurso" ON "per_permiso"("per_recurso");

-- CreateIndex
CREATE INDEX "ix_per_accion" ON "per_permiso"("per_accion");

-- CreateIndex
CREATE INDEX "ix_per_estado" ON "per_permiso"("per_estado");

-- CreateIndex
CREATE UNIQUE INDEX "uk_per_recurso_accion" ON "per_permiso"("per_recurso", "per_accion");

-- CreateIndex
CREATE INDEX "ix_uxr_rol" ON "uxr_usuario_rol"("uxr_rol");

-- CreateIndex
CREATE INDEX "ix_uxr_asignador" ON "uxr_usuario_rol"("uxr_id_usu_asignador");

-- CreateIndex
CREATE UNIQUE INDEX "uk_uxr_usuario_rol" ON "uxr_usuario_rol"("uxr_usuario", "uxr_rol");

-- CreateIndex
CREATE INDEX "ix_rxp_permiso" ON "rxp_rol_permiso"("rxp_permiso");

-- CreateIndex
CREATE INDEX "ix_rxp_otorgante" ON "rxp_rol_permiso"("rxp_id_usu_otorgante");

-- CreateIndex
CREATE UNIQUE INDEX "uk_rxp_rol_permiso" ON "rxp_rol_permiso"("rxp_rol", "rxp_permiso");

-- CreateIndex
CREATE UNIQUE INDEX "uk_dis_codigo" ON "dis_distrito"("dis_codigo");

-- CreateIndex
CREATE UNIQUE INDEX "uk_dis_nombre" ON "dis_distrito"("dis_nombre");

-- CreateIndex
CREATE INDEX "ix_dis_lider" ON "dis_distrito"("dis_id_mie");

-- CreateIndex
CREATE INDEX "ix_dis_activo" ON "dis_distrito"("dis_activo");

-- CreateIndex
CREATE UNIQUE INDEX "uk_zon_codigo" ON "zon_zona"("zon_codigo");

-- CreateIndex
CREATE INDEX "ix_zon_distrito" ON "zon_zona"("zon_id_dis");

-- CreateIndex
CREATE INDEX "ix_zon_lider" ON "zon_zona"("zon_id_mie");

-- CreateIndex
CREATE INDEX "ix_zon_activo" ON "zon_zona"("zon_activo");

-- CreateIndex
CREATE UNIQUE INDEX "uk_zon_distrito_nombre" ON "zon_zona"("zon_id_dis", "zon_nombre");

-- CreateIndex
CREATE UNIQUE INDEX "uk_sec_codigo" ON "sec_sector"("sec_codigo");

-- CreateIndex
CREATE INDEX "ix_sec_zona" ON "sec_sector"("sec_id_zon");

-- CreateIndex
CREATE INDEX "ix_sec_lider" ON "sec_sector"("sec_id_mie");

-- CreateIndex
CREATE INDEX "ix_sec_activo" ON "sec_sector"("sec_activo");

-- CreateIndex
CREATE UNIQUE INDEX "uk_sec_zona_nombre" ON "sec_sector"("sec_id_zon", "sec_nombre");

-- CreateIndex
CREATE UNIQUE INDEX "uk_tir_codigo" ON "tir_tipo_reunion"("tir_codigo");

-- CreateIndex
CREATE UNIQUE INDEX "uk_tir_nombre" ON "tir_tipo_reunion"("tir_nombre");

-- CreateIndex
CREATE INDEX "ix_tir_activo" ON "tir_tipo_reunion"("tir_activo");

-- CreateIndex
CREATE INDEX "ix_reu_tipo" ON "reu_reunion"("reu_id_tir");

-- CreateIndex
CREATE INDEX "ix_reu_sector" ON "reu_reunion"("reu_id_sec");

-- CreateIndex
CREATE INDEX "ix_reu_supervisor" ON "reu_reunion"("reu_id_mie_supervisor");

-- CreateIndex
CREATE INDEX "ix_reu_fecha" ON "reu_reunion"("reu_fecha");

-- CreateIndex
CREATE INDEX "ix_reu_estado" ON "reu_reunion"("reu_estado");

-- CreateIndex
CREATE INDEX "ix_rxm_miembro" ON "rxm_reunion_miembro"("rxm_miembro");

-- CreateIndex
CREATE UNIQUE INDEX "uk_rxm_reunion_miembro" ON "rxm_reunion_miembro"("rxm_reunion", "rxm_miembro");

-- AddForeignKey
ALTER TABLE "mie_miembro" ADD CONSTRAINT "fk_mie_id_sec" FOREIGN KEY ("mie_id_sec") REFERENCES "sec_sector"("sec_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mxr_miembro_rol" ADD CONSTRAINT "fk_mxr_miembro" FOREIGN KEY ("mxr_miembro") REFERENCES "mie_miembro"("mie_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mxr_miembro_rol" ADD CONSTRAINT "fk_mxr_rol" FOREIGN KEY ("mxr_rol") REFERENCES "roc_rol_comunidad"("roc_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mxm_miembro_ministerio" ADD CONSTRAINT "fk_mxm_miembro" FOREIGN KEY ("mxm_miembro") REFERENCES "mie_miembro"("mie_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mxm_miembro_ministerio" ADD CONSTRAINT "fk_mxm_ministerio" FOREIGN KEY ("mxm_ministerio") REFERENCES "min_ministerio"("min_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usu_usuario" ADD CONSTRAINT "fk_usu_id_mie" FOREIGN KEY ("usu_id_mie") REFERENCES "mie_miembro"("mie_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ses_sesion_autenticacion" ADD CONSTRAINT "fk_ses_id_usu" FOREIGN KEY ("ses_id_usu") REFERENCES "usu_usuario"("usu_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uxr_usuario_rol" ADD CONSTRAINT "fk_uxr_usuario" FOREIGN KEY ("uxr_usuario") REFERENCES "usu_usuario"("usu_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uxr_usuario_rol" ADD CONSTRAINT "fk_uxr_rol" FOREIGN KEY ("uxr_rol") REFERENCES "rol_rol"("rol_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uxr_usuario_rol" ADD CONSTRAINT "fk_uxr_id_usu_asignador" FOREIGN KEY ("uxr_id_usu_asignador") REFERENCES "usu_usuario"("usu_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rxp_rol_permiso" ADD CONSTRAINT "fk_rxp_rol" FOREIGN KEY ("rxp_rol") REFERENCES "rol_rol"("rol_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rxp_rol_permiso" ADD CONSTRAINT "fk_rxp_permiso" FOREIGN KEY ("rxp_permiso") REFERENCES "per_permiso"("per_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rxp_rol_permiso" ADD CONSTRAINT "fk_rxp_id_usu_otorgante" FOREIGN KEY ("rxp_id_usu_otorgante") REFERENCES "usu_usuario"("usu_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dis_distrito" ADD CONSTRAINT "fk_dis_id_mie" FOREIGN KEY ("dis_id_mie") REFERENCES "mie_miembro"("mie_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zon_zona" ADD CONSTRAINT "fk_zon_id_dis" FOREIGN KEY ("zon_id_dis") REFERENCES "dis_distrito"("dis_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zon_zona" ADD CONSTRAINT "fk_zon_id_mie" FOREIGN KEY ("zon_id_mie") REFERENCES "mie_miembro"("mie_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sec_sector" ADD CONSTRAINT "fk_sec_id_zon" FOREIGN KEY ("sec_id_zon") REFERENCES "zon_zona"("zon_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sec_sector" ADD CONSTRAINT "fk_sec_id_mie" FOREIGN KEY ("sec_id_mie") REFERENCES "mie_miembro"("mie_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reu_reunion" ADD CONSTRAINT "fk_reu_id_tir" FOREIGN KEY ("reu_id_tir") REFERENCES "tir_tipo_reunion"("tir_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reu_reunion" ADD CONSTRAINT "fk_reu_id_sec" FOREIGN KEY ("reu_id_sec") REFERENCES "sec_sector"("sec_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reu_reunion" ADD CONSTRAINT "fk_reu_id_mie_supervisor" FOREIGN KEY ("reu_id_mie_supervisor") REFERENCES "mie_miembro"("mie_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rxm_reunion_miembro" ADD CONSTRAINT "fk_rxm_reunion" FOREIGN KEY ("rxm_reunion") REFERENCES "reu_reunion"("reu_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rxm_reunion_miembro" ADD CONSTRAINT "fk_rxm_miembro" FOREIGN KEY ("rxm_miembro") REFERENCES "mie_miembro"("mie_id") ON DELETE RESTRICT ON UPDATE CASCADE;
