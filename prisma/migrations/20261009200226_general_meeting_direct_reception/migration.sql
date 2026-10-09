ALTER TABLE "rof_recepcion_ofrenda" ADD COLUMN     "rof_registro_directo" BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN "public"."rof_recepcion_ofrenda"."rof_registro_directo" IS 'Indica que la ofrenda la registró directamente el comité de apoyo, como en los cultos generales sin líder.';
